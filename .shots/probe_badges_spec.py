"""Verify badges page redesign per design spec: playerCard (break-frame avatar) + recentCard (wood strip)."""
import json, base64, time, subprocess, os
import websocket, requests

CHROME = r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
PORT = 9231
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(HERE, "chrome_profile_spec")

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
      {"id":1,"badge_id":1,"code":"first_checkin","name":"初来乍到","rarity":"bronze","awarded_at":"2026-07-30"},
      {"id":2,"badge_id":2,"code":"persist_3d","name":"初露锋芒","rarity":"bronze","awarded_at":"2026-07-31"},
      {"id":3,"badge_id":5,"code":"first_feed","name":"初次投喂","rarity":"bronze","awarded_at":"2026-08-01"}
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
  const clamp = (el) => {
    const r = el.getBoundingClientRect();
    return { left: Math.round(r.left), top: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
  };

  // --- playerCard ---
  try {
    const p = [...document.querySelectorAll('p')].find(e => e.textContent.includes('距离下一级还差'));
    let root = p;
    while (root && root.style.position !== 'absolute') root = root.parentElement;
    if (!root) throw new Error('playerCard wrapper not found');
    const card = root.firstElementChild;
    const avatar = card.querySelector('img[src*="char_xiaoyuan"]');
    const sprout = card.querySelector('img[src*="1F331"]');
    const title = [...card.querySelectorAll('div')].find(e => e.textContent.includes('Lv.') && e.querySelector('span.truncate'));
    info.playerCard = {
      cardRect: clamp(card),
      avatarRect: avatar ? clamp(avatar) : null,
      overflowLeft: avatar ? Math.round(avatar.getBoundingClientRect().left - card.getBoundingClientRect().left) : null,
      sprout: !!sprout,
      titleText: title ? title.textContent.replace(/\s+/g, ' ').trim() : null,
      titleNowrap: title ? getComputedStyle(title).whiteSpace : null,
      titleNoWrap: title ? title.scrollWidth <= title.clientWidth : null,
      cardBg: getComputedStyle(card).backgroundImage.slice(0, 60),
      cardBorder: getComputedStyle(card).borderWidth + ' ' + getComputedStyle(card).borderColor.slice(0, 20),
    };
  } catch (e) { info.playerCard = 'ERR ' + e.message; }

  // --- recentCard ---
  try {
    const tag = [...document.querySelectorAll('div')].find(e => e.textContent.trim() === '最近获得');
    let root = tag;
    while (root && root.style.position !== 'absolute') root = root.parentElement;
    if (!root) throw new Error('recentCard wrapper not found');
    const outer = root.firstElementChild; // relative container
    const base = outer.querySelector('div.absolute.inset-0');
    const wood = outer.querySelector('div[class*="8B5A2B"]');
    const newTag = outer.querySelector('div[class*="FF5252"]');
    const leaves = [...outer.querySelectorAll('img[src*="1F33F"]')];
    const name = [...outer.querySelectorAll('div')].find(e => e.className.includes('text-[#2E5A1C]'));
    const desc = [...outer.querySelectorAll('div')].find(e => e.className.includes('text-[#7D6C5B]'));
    const reward = [...outer.querySelectorAll('div')].find(e => e.className.includes('text-[#3B8E2A]'));
    const date = [...outer.querySelectorAll('div')].find(e => e.className.includes('text-[#A89A8A]'));
    info.recentCard = {
      wrapperRect: clamp(root),
      baseRect: base ? clamp(base) : null,
      wood: wood ? { text: wood.textContent.trim(), cls: wood.className.slice(0, 40), top: Math.round(wood.getBoundingClientRect().top - root.getBoundingClientRect().top) } : null,
      newTag: newTag ? { text: newTag.textContent.trim(), rotate: getComputedStyle(newTag).rotate } : null,
      leaves: leaves.length,
      name: name ? name.textContent.trim() : null,
      desc: desc ? desc.textContent.trim() : null,
      reward: reward ? reward.textContent.trim() : null,
      date: date ? date.textContent.trim() : null,
      cardBg: getComputedStyle(base).backgroundColor.slice(0, 40),
      cardBorder: getComputedStyle(base).borderColor.slice(0, 20) + ' ' + getComputedStyle(base).borderWidth,
    };
  } catch (e) { info.recentCard = 'ERR ' + e.message; }

  return JSON.stringify(info);
})()
"""
res = send("Runtime.evaluate", {"expression": expr, "returnByValue": True})
print("INFO:", res.get("result", {}).get("value"))

shot = send("Page.captureScreenshot", {"format": "png"})
with open(os.path.join(HERE, "badges_spec_full.png"), "wb") as f:
    f.write(base64.b64decode(shot["data"]))
print("saved badges_spec_full.png")
ws.close()
