"""Capture screenshot of badges assistant card + floating character."""
import json, time, subprocess, os, base64
import websocket, requests
from PIL import Image
import io

CHROME = r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
PORT = 9246
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(HERE, "chrome_profile_assistant")

SEED = r"""
(() => {
  const set = (k, v) => localStorage.setItem(k, v);
  const del = (k) => localStorage.removeItem(k);
  set('gg-onboarding-done', 'true');
  set('gg-auth', JSON.stringify({"state":{"mode":"guest","user":{
    "parent_id":1,"phone":"13800000000",
    "children":[{"id":1,"name":"小满","age":5,"avatar_url":null}],
    "active_child_id":1
  },"token":null,"loading":false},"version":0}));
  set('gg-badges', JSON.stringify({"state":{
    "awarded":[{"id":1,"badge_id":1,"code":"first_checkin","name":"初来乍到","rarity":"bronze","awarded_at":"2026-07-30"}],
    "pending":[],"defs":[]
  },"version":0}));
  del('gg-block-positions-badges');
})();
"""

subprocess.Popen([
    CHROME, f"--remote-debugging-port={PORT}", "--headless=new", "--disable-gpu",
    "--no-first-run", "--no-default-browser-check", "--hide-scrollbars",
    "--remote-allow-origins=*", "--user-data-dir=" + PROFILE, "about:blank",
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
for _ in range(60):
    try:
        if requests.get(f"http://127.0.0.1:{PORT}/json/version", timeout=1).ok:
            break
    except Exception:
        pass
    time.sleep(0.2)

r = requests.put(f"http://127.0.0.1:{PORT}/json/new?about:blank")
ws = websocket.create_connection(r.json()["webSocketDebuggerUrl"], timeout=30)
_id = 0
def send(m, p=None):
    global _id
    _id += 1
    mid = _id
    ws.send(json.dumps({"id": mid, "method": m, "params": p or {}}))
    while True:
        msg = json.loads(ws.recv())
        if msg.get("id") == mid:
            return msg.get("result", {})

send("Page.enable")
send("Runtime.enable")
send("Emulation.setDeviceMetricsOverride", {"width": 1600, "height": 1000, "deviceScaleFactor": 2, "mobile": False})
send("Page.addScriptToEvaluateOnNewDocument", {"source": SEED})
send("Page.navigate", {"url": "http://localhost:3000/badges"})
time.sleep(3.5)

res = send("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": False})
img = Image.open(io.BytesIO(base64.b64decode(res["data"])))
print("full:", img.size)
# card area approx: x 184-434, y 292-632 (CSS px) -> *2 for scale
crop = img.crop((int(184*2)-80, int(292*2)-80, int(434*2)+80, int(632*2)+40))
out = os.path.join(HERE, "shot_assistant.png")
crop.save(out)
print("saved:", out, crop.size)
ws.close()
