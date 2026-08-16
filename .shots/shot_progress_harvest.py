"""Screenshot HomePage 成长进度 bar at 丰收期 (gardenLevel=5)."""
import json, base64, time, subprocess, os
from PIL import Image
import websocket, requests

CHROME = r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
PORT = 9224
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(HERE, "chrome_profile_hv")

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
    "currentState":"healthy","moistureLevel":60,"gardenLevel":5,"gardenXp":420,"interactionCount":12
  },"version":0}));
  set('gg-checkin', JSON.stringify({"state":{
    "today":{"date":new Date().toISOString().slice(0,10),"tasks":[
      {"id":"task_garden","status":"done"},
      {"id":"task_eat","status":"done"},
      {"id":"task_sleep","status":"done"},
      {"id":"task_water","status":"done"},
      {"id":"task_sport","status":"done"}
    ],"all_completed":true},
    "streak":7,"makeupsUsed":0
  },"version":0}));
  del('gg-block-positions-home');
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
    const p = [...document.querySelectorAll('p')].find(e => e.textContent.includes('花园成长进度'));
    if (!p) return 'NO P';
    const block = p.closest('div[class*=card-module]') || p.parentElement.parentElement;
    const r = block.getBoundingClientRect();
    const all = [...block.querySelectorAll('span')];
    const stageSet = new Set(['幼苗期','成长期','繁荣期','茂盛期','丰收期','守护期']);
    const labels = all.filter(s => stageSet.has(s.textContent.trim()));
    const current = labels.filter(s => s.className.includes('font-bold')).map(s => s.textContent.trim());
    return JSON.stringify({x:r.x, y:r.y, w:r.width, h:r.height, current});
  } catch (e) { return 'ERR ' + e.message; }
})()
"""
res = send("Runtime.evaluate", {"expression": expr, "returnByValue": True})
val = res.get("result", {}).get("value")
print("RECT+STATE:", val)

shot = send("Page.captureScreenshot", {"format": "png"})
full = os.path.join(HERE, "progress_harvest_full.png")
with open(full, "wb") as f:
    f.write(base64.b64decode(shot["data"]))

if val and val.startswith("{"):
    info = json.loads(val)
    s = 2
    pad = 6
    img = Image.open(full)
    box = (int((info["x"]-pad)*s), int((info["y"]-pad)*s), int((info["x"]+info["w"]+pad)*s), int((info["y"]+info["h"]+pad)*s))
    box = (max(0,box[0]), max(0,box[1]), min(img.width,box[2]), min(img.height,box[3]))
    crop = img.crop(box)
    crop.save(os.path.join(HERE, "progress_harvest.png"))
    print("saved progress_harvest.png", crop.size)
ws.close()
