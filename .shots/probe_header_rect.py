"""Measure header title rect vs page center after header changes."""
import json, time, subprocess, os
import websocket, requests

CHROME = r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
PORT = 9239
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(HERE, "chrome_profile_header_rect")

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
  const h1 = [...document.querySelectorAll('h1')].find(e => e.textContent.includes('成长徽章馆'));
  const p = [...document.querySelectorAll('p')].find(e => e.textContent.includes('每一枚徽章'));
  const header = document.querySelector('header');
  const backBtn = header ? header.querySelector('button') : null;
  const info = {
    winW: window.innerWidth,
    h1Rect: h1 ? {left: Math.round(h1.getBoundingClientRect().left), right: Math.round(h1.getBoundingClientRect().right), top: Math.round(h1.getBoundingClientRect().top), h: Math.round(h1.getBoundingClientRect().height)} : null,
    pRect: p ? {top: Math.round(p.getBoundingClientRect().top), h: Math.round(p.getBoundingClientRect().height)} : null,
    fontSize: h1 ? getComputedStyle(h1).fontSize : null,
    subFontSize: p ? getComputedStyle(p).fontSize : null,
    headerRect: header ? {top: Math.round(header.getBoundingClientRect().top), bottom: Math.round(header.getBoundingClientRect().bottom), h: Math.round(header.getBoundingClientRect().height)} : null,
    backBtnRect: backBtn ? {top: Math.round(backBtn.getBoundingClientRect().top), bottom: Math.round(backBtn.getBoundingClientRect().bottom)} : null,
  };
  if (h1) {
    const c = (h1.getBoundingClientRect().left + h1.getBoundingClientRect().right) / 2;
    info.h1Center = Math.round(c);
    info.offsetFromPageCenter = Math.round(c - window.innerWidth / 2);
    info.trophyPresent = !!h1.querySelector('svg, img, [class*=ui-icon]');
  }
  return JSON.stringify(info);
})()
"""
res = send("Runtime.evaluate", {"expression": expr, "returnByValue": True})
print("MEASURE:", res.get("result", {}).get("value"))
ws.close()
