"""Probe + crop the 今日小任务 task bar card on ClassroomPage."""
import json, base64, time, subprocess, os
from PIL import Image
import websocket, requests

CHROME = r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
PORT = 9226
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(HERE, "chrome_profile_taskbar")

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
  set('gg-garden', JSON.stringify({"state":{
    "currentState":"healthy","moistureLevel":60,"gardenLevel":3,"gardenXp":220,"interactionCount":12
  },"version":0}));
  ['gg-block-positions-classroom'].forEach(del);
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
send("Page.navigate", {"url": "http://localhost:3000/classroom"})
time.sleep(4)

expr = r"""
(() => {
  try {
    const h = [...document.querySelectorAll('h3')].find(e => e.textContent.includes('今日小任务'));
    if (!h) return 'NO H3';
    const card = h.closest('div[class*=card-module]') || h.parentElement.parentElement;
    const r = card.getBoundingClientRect();
    // gather each direct child's rect + computed margin
    const kids = [...card.children].map(c => {
      const cr = c.getBoundingClientRect();
      const cs = getComputedStyle(c);
      return {tag: c.tagName, top: Math.round(cr.top - r.top), bottom: Math.round(r.bottom - cr.bottom),
              h: Math.round(cr.height), mt: cs.marginTop, mb: cs.marginBottom};
    });
    return JSON.stringify({x:r.x, y:r.y, w:r.width, h:r.height, kids});
  } catch (e) { return 'ERR ' + e.message; }
})()
"""
res = send("Runtime.evaluate", {"expression": expr, "returnByValue": True})
val = res.get("result", {}).get("value")
print("RECT+CHILDREN:", val)

shot = send("Page.captureScreenshot", {"format": "png"})
full = os.path.join(HERE, "taskbar_full.png")
with open(full, "wb") as f:
    f.write(base64.b64decode(shot["data"]))

if val and val.startswith("{"):
    info = json.loads(val)
    s = 2
    pad = 8
    img = Image.open(full)
    box = (int((info["x"]-pad)*s), int((info["y"]-pad)*s), int((info["x"]+info["w"]+pad)*s), int((info["y"]+info["h"]+pad)*s))
    box = (max(0,box[0]), max(0,box[1]), min(img.width,box[2]), min(img.height,box[3]))
    crop = img.crop(box)
    crop.save(os.path.join(HERE, "taskbar_card.png"))
    print("saved taskbar_card.png", crop.size)
ws.close()
