"""Measure page-navigation performance for GutGarden routes via CDP.

Usage: python perf_measure.py [route ...]
Reports: navigation timing, resource bytes/count, biggest images, long tasks.
"""
import json, time, subprocess, sys, os, glob
import websocket
import requests

CHROME = r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
PORT = 9224
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(HERE, "chrome_profile_perf")
os.makedirs(PROFILE, exist_ok=True)

SEED = r"""
(() => {
  const set = (k, v) => localStorage.setItem(k, v);
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
    "today":{"date":todayKey,"tasks":[
      {"id":"task_garden","status":"pending"},
      {"id":"task_eat","status":"done"},
      {"id":"task_sleep","status":"pending"},
      {"id":"task_water","status":"done"},
      {"id":"task_sport","status":"done"}
    ],"all_completed":false},
    "streak":7,"makeupsUsed":0
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
   'gg-block-positions-home','gg-block-positions-garden'].forEach(k => localStorage.removeItem(k));
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
        self.ws = websocket.create_connection(ws_url, timeout=60)
        self._id = 0
    def send(self, method, params=None):
        self._id += 1
        mid = self._id
        self.ws.send(json.dumps({"id": mid, "method": method, "params": params or {}}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == mid:
                return msg.get("result", {})

def collect(cdp, url):
    cdp.send("Page.enable")
    cdp.send("Runtime.enable")
    cdp.send("Emulation.setDeviceMetricsOverride", {"width": 1600, "height": 1000, "deviceScaleFactor": 1, "mobile": False})
    cdp.send("Page.addScriptToEvaluateOnNewDocument", {"source": SEED})
    # instrument long tasks + resource timing
    cdp.send("Runtime.evaluate", {"expression": r"""
      window.__lt = [];
      try { new PerformanceObserver((l) => {
        for (const e of l.getEntries()) window.__lt.push({d: Math.round(e.duration), s: e.startTime});
      }).observe({entryTypes: ['longtask']}); } catch(e) {}
    """})
    t0 = time.time()
    cdp.send("Page.navigate", {"url": url})
    while time.time() - t0 < 20:
        res = cdp.send("Runtime.evaluate", {"expression": "document.readyState", "returnByValue": True})
        if res.get("result", {}).get("value") == "complete":
            break
        time.sleep(0.15)
    time.sleep(3.0)  # let fonts/images/decode settle

    expr = r"""
      (() => {
        const nav = performance.getEntriesByType('navigation')[0];
        const res = performance.getEntriesByType('resource');
        const imgs = res.filter(r => r.initiatorType === 'img' || /\.(png|jpe?g|webp|gif)$/i.test(r.name));
        let totalBytes = 0, totalDecode = 0;
        const big = imgs.map(r => ({ n: r.name.replace(location.origin,''), b: Math.round((r.transferSize||0)/1024), d: Math.round(r.decodedBodySize||0/1024) }))
          .filter(x => x.b > 300 || x.d > 300).sort((a,b) => b.b - a.b);
        const lt = (window.__lt||[]);
        return {
          ready: document.readyState,
          navMs: nav ? Math.round(nav.duration) : null,
          dclMs: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
          loadMs: nav ? Math.round(nav.loadEventEnd) : null,
          domNodes: document.getElementsByTagName('*').length,
          images: imgs.length,
          totalImgBytesKB: Math.round(imgs.reduce((s,r)=>s+(r.transferSize||0),0)/1024),
          totalAllKB: Math.round(res.reduce((s,r)=>s+(r.transferSize||0),0)/1024),
          requests: res.length,
          longTasks: lt.length,
          longTaskMs: lt.reduce((s,t)=>s+t.d,0),
          biggest: big.slice(0, 12)
        };
      })()
    """
    res = cdp.send("Runtime.evaluate", {"expression": expr, "returnByValue": True})
    return res.get("result", {}).get("value", {})

def main():
    routes = sys.argv[1:] or ["/", "/garden", "/checkin", "/badges", "/classroom", "/report", "/profile"]
    start_chrome()
    pages = []
    for route in routes:
        r = requests.put(f"http://127.0.0.1:{PORT}/json/new?about:blank")
        pages.append(r.json()["webSocketDebuggerUrl"])
    for route, ws in zip(routes, pages):
        cdp = CDP(ws)
        url = "http://localhost:3000" + route
        print(f"\n===== {route} =====")
        m = collect(cdp, url)
        print(json.dumps(m, ensure_ascii=False, indent=1))
        cdp.ws.close()
    kill_port(PORT)
    print("\ndone")

if __name__ == "__main__":
    main()
