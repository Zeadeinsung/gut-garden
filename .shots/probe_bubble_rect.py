"""Measure avatar vs bubble rects in assistant card."""
import json, time, subprocess, os
import websocket, requests

CHROME = r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
PORT = 9245
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(HERE, "chrome_profile_bubble_rect")

SEED = r"""
(() => {
  const set = (k, v) => localStorage.setItem(k, v);
  const del = (k) => localStorage.removeItem(k);
  const todayKey = new Date().toISOString().slice(0, 10);
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
  ['gg-block-positions-badges'].forEach(del);
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
  const rectOf = (el) => { const r = el.getBoundingClientRect(); return {top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height)}; };
  const bubble = document.querySelector('[class*="bg-[#FBF5E6]"]');
  const avatar = [...document.querySelectorAll('img')].find(i => (i.src||'').includes('char_xiaoyuan'));
  const card = bubble ? bubble.closest('[class*="rounded-[22px]"]') : null;
  return JSON.stringify({
    avatar: avatar ? rectOf(avatar) : null,
    bubble: bubble ? rectOf(bubble) : null,
    card: card ? rectOf(card) : null,
    avatarToBubbleGap: avatar && bubble ? Math.round(bubble.getBoundingClientRect().top - avatar.getBoundingClientRect().bottom) : null,
    bubbleToCardBottom: bubble && card ? Math.round(card.getBoundingClientRect().bottom - bubble.getBoundingClientRect().bottom) : null
  });
})()
"""
res = send("Runtime.evaluate", {"expression": expr, "returnByValue": True})
print("MEASURE:", res.get("result", {}).get("value"))
ws.close()
