"""Verify wider badge gap + overflow arrows actually scroll the row."""
import json, base64, time, subprocess, os, glob
import websocket, requests

CHROME = r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
PORT = 9241
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(HERE, "chrome_profile_arrows")
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
      {"id":3,"badge_id":5,"code":"first_feed","name":"初次投喂","rarity":"bronze","awarded_at":"2026-08-01"},
      {"id":4,"badge_id":6,"code":"feed_50","name":"小小农夫","rarity":"bronze","awarded_at":"2026-08-02"},
      {"id":5,"badge_id":11,"code":"first_quiz","name":"好奇宝宝","rarity":"bronze","awarded_at":"2026-08-03"}
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
            if requests.get(f"http://127.0.0.1:{PORT}/json/version", timeout=1).ok:
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

def wait_load(cdp, url, timeout=25):
    cdp.send("Page.enable")
    cdp.send("Runtime.enable")
    cdp.send("Emulation.setDeviceMetricsOverride", {"width": 1600, "height": 1200, "deviceScaleFactor": 1, "mobile": False})
    cdp.send("Page.addScriptToEvaluateOnNewDocument", {"source": SEED})
    cdp.send("Page.navigate", {"url": url})
    t0 = time.time()
    while time.time() - t0 < timeout:
        res = cdp.send("Runtime.evaluate", {"expression": "document.readyState", "returnByValue": True})
        if res.get("result", {}).get("value") == "complete":
            break
        time.sleep(0.2)
    time.sleep(3)

def shot(cdp, name):
    res = cdp.send("Page.captureScreenshot", {"format": "png"})
    with open(os.path.join(HERE, name), "wb") as f:
        f.write(base64.b64decode(res["data"]))
    print("saved", name)

start_chrome()
r = requests.put(f"http://127.0.0.1:{PORT}/json/new?about:blank")
cdp = CDP(r.json()["webSocketDebuggerUrl"])
wait_load(cdp, "http://localhost:3000/badges")

def js(expr):
    return cdp.send("Runtime.evaluate", {"expression": expr, "returnByValue": True}).get("result", {}).get("value")

# gather row info
info = js(r"""
(() => {
  let cabinet = null;
  document.querySelectorAll('div').forEach(d => {
    if (getComputedStyle(d).backgroundImage.includes('ui_badge_cabinet')) cabinet = d;
  });
  if (!cabinet) return {err:'no cabinet'};
  const rows = Array.from(cabinet.children).filter(d => getComputedStyle(d).position === 'absolute');
  return rows.map((row, i) => {
    const scrollEl = row.querySelector('div.flex-1');
    const firstGroup = scrollEl ? scrollEl.querySelector('div[class*="w-[88px]"]') : null;
    const groups = scrollEl ? Array.from(scrollEl.querySelectorAll('div[class*="w-[88px]"]')) : [];
    const xs = groups.map(g => Math.round(g.getBoundingClientRect().left));
    const first = xs.length ? xs[0] : null;
    const second = xs.length > 1 ? xs[1] : null;
    return {
      idx: i,
      pitch: (first!=null && second!=null) ? second-first : null,
      scrollW: scrollEl ? scrollEl.scrollWidth : null,
      clientW: scrollEl ? scrollEl.clientWidth : null,
      overflow: scrollEl ? scrollEl.scrollWidth > scrollEl.clientWidth : false,
      rightArrow: !!row.querySelector('button'),
      leftArrow: !!row.querySelector('button[title="返回"]'),
    };
  });
})()
""")
print("ROWS:", json.dumps(info))

res2 = cdp.send("Runtime.evaluate", {"expression": r"""
(async () => {
  let cabinet = null;
  document.querySelectorAll('div').forEach(d => {
    if (getComputedStyle(d).backgroundImage.includes('ui_badge_cabinet')) cabinet = d;
  });
  const rows = Array.from(cabinet.children).filter(d => getComputedStyle(d).position === 'absolute');
  const row = rows.find(r => {
    const se = r.querySelector('div.flex-1');
    return se && se.scrollWidth > se.clientWidth;
  });
  if (!row) return {err:'no overflowing row'};
  const se = row.querySelector('div.flex-1');
  const before = se.scrollLeft;
  const rightBtn = row.querySelector('button[title="更多徽章"]');
  rightBtn.click();
  await new Promise(res => setTimeout(res, 700));
  const after = se.scrollLeft;
  const leftVisible = !!row.querySelector('button[title="返回"]');
  const leftBtn = row.querySelector('button[title="返回"]');
  if (leftBtn) leftBtn.click();
  await new Promise(res => setTimeout(res, 700));
  const back = se.scrollLeft;
  return {before, after, moved: after > before, leftVisible, back, leftBack: back < after};
})()
""", "returnByValue": True, "awaitPromise": True})
print("SCROLLTEST:", res2.get("result", {}).get("value"))

shot(cdp, "cabinet_arrows.png")
cdp.ws.close()
kill_port(PORT)
print("done")
