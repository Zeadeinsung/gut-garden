"""Verify assistantChar is an independent edit-mode block (chrome + resize)."""
import json, time, subprocess, os
import websocket, requests

CHROME = r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
PORT = 9247
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(HERE, "chrome_profile_editmode")

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
  localStorage.removeItem('gg-block-positions-badges');
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
time.sleep(3)

# enter edit mode via Ctrl+E
send("Input.dispatchKeyEvent", {"type": "keyDown", "modifiers": 2, "key": "e", "code": "KeyE", "windowsVirtualKeyCode": 69, "nativeVirtualKeyCode": 69})
send("Input.dispatchKeyEvent", {"type": "keyUp", "modifiers": 2, "key": "e", "code": "KeyE", "windowsVirtualKeyCode": 69, "nativeVirtualKeyCode": 69})
time.sleep(1)

expr = r"""
(() => {
  const labels = [...document.querySelectorAll('div')].filter(e => e.textContent === '⋮⋮ assistantChar').length;
  const chrome = [...document.querySelectorAll('div')].find(e => e.textContent === '⋮⋮ assistantChar');
  let se = null;
  if (chrome) {
    const block = chrome.parentElement;
    se = [...block.querySelectorAll('div')].filter(d => d.title && d.title.includes('×')).length;
  }
  // check the char image exists in its own block, outside the card
  const charImg = [...document.querySelectorAll('img')].find(i => (i.src||'').includes('char_xiaoyuan'));
  const imgRect = charImg ? charImg.getBoundingClientRect() : null;
  const saved = localStorage.getItem('gg-block-positions-badges');
  return JSON.stringify({
    chromeLabelCount: labels,
    seHandleCount: se,
    charImgSize: imgRect ? Math.round(imgRect.width) + 'x' + Math.round(imgRect.height) : null,
    saved: saved ? !!JSON.parse(saved).blocks.assistantChar : false
  });
})()
"""
res = send("Runtime.evaluate", {"expression": expr, "returnByValue": True})
print("EDITMODE:", res.get("result", {}).get("value"))
ws.close()
