"""Screenshot /badges with edit mode (Ctrl+E) enabled to verify DraggableBlock chrome."""
import json, base64, time, subprocess, os
import websocket
import requests

CHROME = r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
PORT = 9237
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(HERE, "chrome_profile_editmode")
os.makedirs(PROFILE, exist_ok=True)

SEED = r"""
(() => {
  localStorage.setItem('gg-onboarding-done', 'true');
  localStorage.setItem('gg-auth', JSON.stringify({"state":{"mode":"guest","user":{
    "parent_id":1,"phone":"13800000000",
    "children":[{"id":1,"name":"小满","age":5,"avatar_url":null}],
    "active_child_id":1
  },"token":null,"loading":false},"version":0}));
  localStorage.setItem('gg-garden', JSON.stringify({"state":{
    "currentState":"healthy","moistureLevel":60,"gardenLevel":5,"gardenXp":720,"interactionCount":12
  },"version":0}));
  localStorage.setItem('gg-badges', JSON.stringify({"state":{
    "awarded":[
      {"id":1,"badge_id":1,"code":"first_checkin","name":"初来乍到","rarity":"bronze","awarded_at":"2026-07-30"},
      {"id":2,"badge_id":2,"code":"persist_3d","name":"初露锋芒","rarity":"bronze","awarded_at":"2026-07-31"},
      {"id":6,"badge_id":6,"code":"first_feed","name":"初次投喂","rarity":"bronze","awarded_at":"2026-08-01"}
    ],
    "pending":[],"defs":[]
  },"version":0}));
})();
"""

proc = subprocess.Popen([
    CHROME, f"--remote-debugging-port={PORT}",
    "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    "--hide-scrollbars", "--remote-allow-origins=*", "--user-data-dir=" + PROFILE, "about:blank",
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

try:
    for _ in range(60):
        try:
            r = requests.get(f"http://127.0.0.1:{PORT}/json/version", timeout=1)
            if r.ok:
                break
        except Exception:
            pass
        time.sleep(0.2)
    else:
        raise RuntimeError("chrome did not start")

    r = requests.put(f"http://127.0.0.1:{PORT}/json/new?about:blank")
    ws_url = r.json()["webSocketDebuggerUrl"]
    ws = websocket.create_connection(ws_url, timeout=30)
    state = {"mid": 0}
    def send(method, params=None):
        state["mid"] += 1
        m = state["mid"]
        ws.send(json.dumps({"id": m, "method": method, "params": params or {}}))
        while True:
            msg = json.loads(ws.recv())
            if msg.get("id") == m:
                return msg.get("result", {})

    send("Page.enable")
    send("Runtime.enable")
    send("Emulation.setDeviceMetricsOverride", {"width": 1400, "height": 1000, "deviceScaleFactor": 1, "mobile": False})
    send("Page.addScriptToEvaluateOnNewDocument", {"source": SEED})
    send("Page.navigate", {"url": "http://localhost:3000/badges"})
    t0 = time.time()
    while time.time() - t0 < 20:
        res = send("Runtime.evaluate", {"expression": "document.readyState", "returnByValue": True})
        if res.get("result", {}).get("value") == "complete":
            break
        time.sleep(0.2)
    time.sleep(3)

    # Enable edit mode via Ctrl+E
    send("Runtime.evaluate", {"expression":
        "window.dispatchEvent(new KeyboardEvent('keydown',{ctrlKey:true,key:'e',bubbles:true}))"})
    time.sleep(1.5)

    res = send("Page.captureScreenshot", {"format": "png"})
    with open(os.path.join(HERE, "badges_editmode_view.png"), "wb") as f:
        f.write(base64.b64decode(res["data"]))
    print("saved badges_editmode_view.png")

    ws.close()
finally:
    proc.kill()
