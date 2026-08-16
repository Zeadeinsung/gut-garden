"""Measure badge cabinet shelves + badge positions, screenshot /badges."""
import json, base64, time, subprocess, os, glob
import websocket, requests

CHROME = r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
PORT = 9224
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(HERE, "chrome_profile_cabinet")
os.makedirs(PROFILE, exist_ok=True)

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
  set('gg-garden', JSON.stringify({"state":{"currentState":"healthy","moistureLevel":60,"gardenLevel":3,"gardenXp":220,"interactionCount":12},"version":0}));
  set('gg-checkin', JSON.stringify({"state":{"today":{"date":todayKey,"tasks":[]},"streak":7,"makeupsUsed":0},"version":0}));
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

def kill_port(port):
    try:
        out = subprocess.run(["netstat", "-ano"], capture_output=True, text=True).stdout
        pids = set()
        for line in out.splitlines():
            parts = line.split()
            if (len(parts) >= 5 and parts[0] == "TCP"
                    and parts[1].endswith(f":{port}") and parts[3] == "LISTENING"):
                pids.add(parts[4])
        for pid in pids:
            subprocess.run(["taskkill", "/F", "/PID", pid, "/T"], capture_output=True)
    except Exception:
        pass

def start_chrome():
    kill_port(PORT)
    time.sleep(0.3)
    for f in glob.glob(os.path.join(PROFILE, "Singleton*")):
        try:
            os.remove(f)
        except OSError:
            pass
    subprocess.Popen([
        CHROME, f"--remote-debugging-port={PORT}",
        "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
        "--hide-scrollbars", "--remote-allow-origins=*", "--user-data-dir=" + PROFILE, "about:blank",
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(60):
        try:
            r = requests.get(f"http://127.0.0.1:{PORT}/json/version", timeout=1)
            if r.ok:
                return
        except Exception:
            pass
        time.sleep(0.2)
    raise RuntimeError("chrome did not start")

class CDP:
    def __init__(self, ws_url):
        self.ws = websocket.create_connection(ws_url, timeout=30)
        self._id = 0
    def send(self, method, params=None):
        self._id += 1
        mid = self._id
        self.ws.send(json.dumps({"id": mid, "method": method, "params": params or {}}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == mid:
                return msg.get("result", {})

def wait_load(cdp, url, timeout=20):
    cdp.send("Page.enable")
    cdp.send("Runtime.enable")
    cdp.send("Emulation.setDeviceMetricsOverride", {"width": 1600, "height": 1000, "deviceScaleFactor": 1, "mobile": False})
    cdp.send("Page.addScriptToEvaluateOnNewDocument", {"source": SEED})
    cdp.send("Page.navigate", {"url": url})
    t0 = time.time()
    while time.time() - t0 < timeout:
        res = cdp.send("Runtime.evaluate", {"expression": "document.readyState", "returnByValue": True})
        if res.get("result", {}).get("value") == "complete":
            break
        time.sleep(0.2)
    time.sleep(2.5)

def shot(cdp, name):
    res = cdp.send("Page.captureScreenshot", {"format": "png"})
    with open(os.path.join(HERE, name), "wb") as f:
        f.write(base64.b64decode(res["data"]))
    print("saved", name)

start_chrome()
r = requests.put(f"http://127.0.0.1:{PORT}/json/new?about:blank")
cdp = CDP(r.json()["webSocketDebuggerUrl"])
wait_load(cdp, "http://localhost:3000/badges")
shot(cdp, "cabinet_pos.png")

res = cdp.send("Runtime.evaluate", {"expression": r"""
(() => {
  const info = {};
  const clamp = (el) => { const r = el.getBoundingClientRect(); return {left: Math.round(r.left), top: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height)}; };
  let cabinet = null;
  document.querySelectorAll('div').forEach(d => {
    if (getComputedStyle(d).backgroundImage.includes('ui_badge_cabinet')) cabinet = d;
  });
  if (!cabinet) return JSON.stringify({err: 'no cabinet'});
  const cRect = clamp(cabinet);
  info.cabinet = cRect;
  // shelf rows: direct children positioned absolute (class-based)
  const rows = Array.from(cabinet.children).filter(d => getComputedStyle(d).position === 'absolute');
  info.rows = rows.map((row, i) => {
    const rRect = clamp(row);
    const groups = Array.from(row.querySelectorAll('div')).filter(g => {
      const cls = g.className || '';
      return cls.includes('shrink-0') && cls.includes('w-[88px]') && cls.includes('flex-col');
    });
    const badges = groups.map(b => {
      const br = b.getBoundingClientRect();
      const circle = b.firstElementChild; // the rounded-full circle wrapper
      const cR = circle ? circle.getBoundingClientRect() : null;
      const img = b.querySelector('img');
      const iR = img ? img.getBoundingClientRect() : null;
      const name = b.querySelector('p');
      const status = b.querySelector('span');
      return {
        box: {left: Math.round(br.left), top: Math.round(br.top), w: Math.round(br.width), h: Math.round(br.height)},
        circle: cR ? {left: Math.round(cR.left), top: Math.round(cR.top), w: Math.round(cR.width), h: Math.round(cR.height), cy: Math.round(cR.top + cR.height/2)} : null,
        img: iR ? {left: Math.round(iR.left), top: Math.round(iR.top), w: Math.round(iR.width), h: Math.round(iR.height)} : null,
        name: name ? name.textContent.trim() : null,
        status: status ? status.textContent.trim() : null,
        earned: (circle.className||'').includes('FFE896'),
      };
    });
    const scrollW = row.querySelector('div.flex-1') ? row.querySelector('div.flex-1').scrollWidth : null;
    const clientW = row.querySelector('div.flex-1') ? row.querySelector('div.flex-1').clientWidth : null;
    return {idx: i, rect: rRect, topPct: row.style.top, rowH: rRect.h, badgeCount: badges.length,
            rowCenter: Math.round(rRect.top + rRect.height/2), scrollW, clientW, overflowX: scrollW > clientW, badges};
  });
  return JSON.stringify(info);
})()
""", "returnByValue": True})
print("MEASURE:", res.get("result", {}).get("value"))

cdp.ws.close()
kill_port(PORT)
print("done")
