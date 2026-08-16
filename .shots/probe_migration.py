"""Verify v7 layout migration moves saved assistantCard to new default y."""
import json, time, subprocess, os
import websocket, requests

CHROME = r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
PORT = 9243
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(HERE, "chrome_profile_migration")

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
  // 模拟用户已有 v6 存档，assistantCard 在旧位置 y=192
  set('gg-block-positions-badges', JSON.stringify({v: 6, blocks: {
    playerCard: {x:24,y:20,w:250,h:156},
    assistantCard: {x:24,y:192,w:250,h:340},
    cabinet: {x:290,y:20,w:672,h:620},
    growthCard: {x:978,y:20,w:278,h:248},
    unlockCard: {x:978,y:284,w:278,h:248},
    recentCard: {x:140,y:540,w:250,h:96},
    badgeBook: {x:290,y:660,w:700,h:232}
  }}));
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
  const title = [...document.querySelectorAll('div')].find(e => e.textContent.trim().startsWith('菌小园助手'));
  let card = title;
  // walk up to the DraggableBlock outer wrapper (positioned by pos)
  for (let i = 0; i < 5 && card; i++) {
    const r = card.getBoundingClientRect();
    if (Math.abs(r.top - r.bottom) < 0.1) break;
    card = card.parentElement;
  }
  const saved = localStorage.getItem('gg-block-positions-badges');
  let migratedV = null;
  if (saved) { try { migratedV = JSON.parse(saved).v; } catch {} }
  const canvas = document.querySelector('div[class*=max-w-\\[1280px\\]');
  const canvasTop = canvas ? canvas.getBoundingClientRect().top : null;
  const rect = card ? card.getBoundingClientRect() : null;
  return JSON.stringify({
    assistantTopAbs: rect ? Math.round(rect.top) : null,
    canvasTop: canvasTop ? Math.round(canvasTop) : null,
    assistantTopInCanvas: rect && canvasTop !== null ? Math.round(rect.top - canvasTop) : null,
    savedVersion: migratedV
  });
})()
"""
res = send("Runtime.evaluate", {"expression": expr, "returnByValue": True})
print("MEASURE:", res.get("result", {}).get("value"))
ws.close()
