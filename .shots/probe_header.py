"""Screenshot the shared Header top-right controls (settings + volume) on HomePage."""
import json, base64, time, subprocess, os
import websocket, requests

CHROME = r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
PORT = 9228
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(HERE, "chrome_profile_hdr")

SEED = r"""
(() => {
  const set = (k, v) => localStorage.setItem(k, v);
  set('gg-onboarding-done', 'true');
  set('gg-auth', JSON.stringify({"state":{"mode":"guest","user":{
    "parent_id":1,"phone":"13800000000",
    "children":[{"id":1,"name":"小满","age":5,"avatar_url":null}],
    "active_child_id":1
  },"token":null,"loading":false},"version":0}));
  ['gg-block-positions-home'].forEach(k => localStorage.removeItem(k));
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
send("Page.navigate", {"url": "http://localhost:3000/"})
time.sleep(4)

expr = r"""
(() => {
  try {
    const btns = [...document.querySelectorAll('header button')];
    const info = btns.map((b, i) => {
      const r = b.getBoundingClientRect();
      const svg = b.querySelector('svg');
      const img = b.querySelector('img');
      const iconTag = svg ? 'svg' : (img ? 'img' : 'none');
      let color = null;
      if (svg) {
        const p = svg.querySelector('path') || svg.querySelector('circle');
        color = p ? getComputedStyle(p).stroke || getComputedStyle(svg).color : getComputedStyle(svg).color;
      }
      return {i, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
              tag: iconTag, color, cls: b.className};
    });
    return JSON.stringify(info);
  } catch (e) { return 'ERR ' + e.message; }
})()
"""
res = send("Runtime.evaluate", {"expression": expr, "returnByValue": True})
print("HEADER BTNS:", res.get("result", {}).get("value"))

shot = send("Page.captureScreenshot", {"format": "png"})
full = os.path.join(HERE, "header_full.png")
with open(full, "wb") as f:
    f.write(base64.b64decode(shot["data"]))
print("saved header_full.png")
ws.close()
