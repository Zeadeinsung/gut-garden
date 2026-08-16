"""Measure header title vs canvas modules for overlap."""
import json, time, subprocess, os
import websocket, requests

CHROME = r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
PORT = 9241
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(HERE, "chrome_profile_overlap")

SEED = r"""
(() => {
  const set = (k, v) => localStorage.setItem(k, v);
  set('gg-onboarding-done', 'true');
  set('gg-auth', JSON.stringify({"state":{"mode":"guest","user":{
    "parent_id":1,"phone":"13800000000",
    "children":[{"id":1,"name":"小满","age":5,"avatar_url":null}],
    "active_child_id":1
  },"token":null,"loading":false},"version":0}));
  set('gg-badges', JSON.stringify({"state":{"awarded":[],"pending":[],"defs":[]},"version":0}));
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
send("Emulation.setDeviceMetricsOverride", {"width": 1600, "height": 1000, "deviceScaleFactor": 1, "mobile": False})
send("Page.addScriptToEvaluateOnNewDocument", {"source": SEED})
send("Page.navigate", {"url": "http://localhost:3000/badges"})
time.sleep(3.5)

expr = r"""
(() => {
  const rectOf = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return {left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height)}; };
  const title = [...document.querySelectorAll('h1')].find(e => e.textContent.includes('成长徽章馆'));
  const sub = [...document.querySelectorAll('p')].find(e => e.textContent.includes('每一枚徽章'));
  const titleBlock = title ? {t: rectOf(title), s: rectOf(sub)} : null;
  // find cabinet by image bg url and playerCard by level text
  const cabinet = [...document.querySelectorAll('div')].find(e => (getComputedStyle(e).backgroundImage||'').includes('ui_badge_cabinet'));
  const playerCard = [...document.querySelectorAll('div')].find(e => e.textContent.includes('成长值') && e.textContent.includes('/ 1000'));
  const canvas = cabinet ? cabinet.parentElement : null;
  const blocks = [];
  if (playerCard) blocks.push({name: 'playerCard', r: rectOf(playerCard)});
  if (cabinet) blocks.push({name: 'cabinet', r: rectOf(cabinet)});
  return JSON.stringify({titleBlock, blocks, canvasRect: canvas ? rectOf(canvas) : null});
})()
"""
res = send("Runtime.evaluate", {"expression": expr, "returnByValue": True})
print("MEASURE:", res.get("result", {}).get("value"))
ws.close()
