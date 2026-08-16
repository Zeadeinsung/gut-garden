"""Verify badges page: growth-path timeline, recently-earned card, scrollbar hidden."""
import json, base64, time, subprocess, os
import websocket, requests

CHROME = r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
PORT = 9230
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(HERE, "chrome_profile_badges_title")

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
  set('gg-garden', JSON.stringify({"state":{
    "currentState":"healthy","moistureLevel":60,"gardenLevel":3,"gardenXp":220,"interactionCount":12
  },"version":0}));
  set('gg-checkin', JSON.stringify({"state":{
    "today":{"date":todayKey,"tasks":[]},"streak":7,"makeupsUsed":0
  },"version":0}));
  set('gg-badges', JSON.stringify({"state":{
    "awarded":[
      {"id":1,"badge_id":1,"code":"first_checkin","name":"第一次打卡","rarity":"bronze","awarded_at":"2026-07-30"},
      {"id":2,"badge_id":2,"code":"streak_3","name":"三天坚持","rarity":"bronze","awarded_at":"2026-07-31"},
      {"id":3,"badge_id":5,"code":"first_feed","name":"初次喂食","rarity":"bronze","awarded_at":"2026-08-01"}
    ],
    "pending":[],"defs":[]
  },"version":0}));

  ['gg-block-positions-checkin','gg-block-positions-badges','gg-block-positions-classroom',
   'gg-block-positions-home','gg-block-positions-garden'].forEach(del);
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
time.sleep(4)

expr = r"""
(() => {
  const info = {};
  try {
    // 1. growth path timeline
    const growthTitle = [...document.querySelectorAll('div')].find(e => e.textContent.trim() === '成长之路');
    if (growthTitle) {
      const card = growthTitle.closest('div.rounded-\\[22px\\]');
      const line = card ? card.querySelector('div.absolute.left-\\[12px\\]') : null;
      const items = card ? card.querySelectorAll('div.flex.flex-col > div.relative') : [];
      info.growth = {
        hasLine: !!line,
        itemCount: items.length,
        items: [...items].map(it => {
          const dot = it.querySelector('div.absolute.left-\\[-19px\\]');
          return {
            text: it.textContent.trim(),
            cls: it.className,
            dotCls: dot ? dot.className : null
          };
        })
      };
    }
  } catch (e) { info.growth = 'ERR ' + e.message; }

  try {
    // 2. recently earned card
    const tag = [...document.querySelectorAll('div')].find(e => e.textContent.trim() === '最近获得');
    if (tag) {
      const card = tag.closest('div.absolute.bottom-\\[40px\\]');
      const rect = card ? card.getBoundingClientRect() : null;
      info.recent = {
        exists: !!card,
        rect: rect ? {top: Math.round(rect.top), left: Math.round(rect.left), w: Math.round(rect.width), h: Math.round(rect.height)} : null,
        hasNewTag: card ? !!card.querySelector('div.bg-\\[\\#FF5252\\]') : false,
        text: card ? card.textContent.replace(/\\s+/g,' ').trim() : null
      };
    } else {
      info.recent = { exists: false };
    }
  } catch (e) { info.recent = 'ERR ' + e.message; }

  try {
    // 3. shelf scrollbar
    const shelves = [...document.querySelectorAll('[class*="overflow-x-auto"]')];
    info.shelves = shelves.map(s => ({
      cls: s.className,
      scrollW: s.scrollWidth,
      clientW: s.clientWidth
    }));
    // check computed overflow & scrollbar styling
    const shelf0 = shelves[0];
    if (shelf0) {
      const cs = getComputedStyle(shelf0);
      info.shelfScrollbar = { scrollbarWidth: cs.scrollbarWidth, overflowX: cs.overflowX };
    }
  } catch (e) { info.shelves = 'ERR ' + e.message; }

  return JSON.stringify(info);
})()
"""
res = send("Runtime.evaluate", {"expression": expr, "returnByValue": True})
print("DOM INFO:", res.get("result", {}).get("value"))

shot = send("Page.captureScreenshot", {"format": "png"})
full = os.path.join(HERE, "badges_v3_full.png")
with open(full, "wb") as f:
    f.write(base64.b64decode(shot["data"]))
print("saved badges_v3_full.png")
ws.close()
