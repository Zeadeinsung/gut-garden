"""Reproduce: does SPA navigation AWAY from /badges freeze the main thread?

Uses a setInterval beat counter (robust in headless) instead of rAF.
Also counts React renders on /badges via a MutationObserver-free counter
injected into the store setter path is hard, so instead we measure whether
the main thread stays responsive while parked on /badges.
"""
import json, time, subprocess, sys, os, glob
import websocket, requests

CHROME = r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
PORT = 9228
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(HERE, "chrome_profile_freeze2")
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
    kill_port(PORT); time.sleep(0.3)
    for f in glob.glob(os.path.join(PROFILE, "Singleton*")):
        try: os.remove(f)
        except OSError: pass
    subprocess.Popen([
        CHROME, f"--remote-debugging-port={PORT}", "--headless=new", "--disable-gpu",
        "--no-first-run","--no-default-browser-check","--hide-scrollbars","--remote-allow-origins=*",
        "--user-data-dir="+PROFILE, "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(60):
        try:
            r = requests.get(f"http://127.0.0.1:{PORT}/json/version", timeout=1)
            if r.ok: return
        except Exception: pass
        time.sleep(0.2)
    raise RuntimeError("chrome did not start")

class CDP:
    def __init__(self, ws_url):
        self.ws = websocket.create_connection(ws_url, timeout=60); self._id = 0
    def send(self, method, params=None):
        self._id += 1; mid = self._id
        self.ws.send(json.dumps({"id": mid, "method": method, "params": params or {}}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == mid: return msg.get("result", {})

def eval_(cdp, expr):
    r = cdp.send("Runtime.evaluate", {"expression": expr, "returnByValue": True, "awaitPromise": True})
    return r.get("result", {}).get("value")

def main():
    target = sys.argv[1] if len(sys.argv) > 1 else "/garden"
    start_chrome()
    r = requests.put(f"http://127.0.0.1:{PORT}/json/new?about:blank")
    cdp = CDP(r.json()["webSocketDebuggerUrl"])
    cdp.send("Page.enable"); cdp.send("Runtime.enable")
    cdp.send("Emulation.setDeviceMetricsOverride", {"width": 1600, "height": 1000, "deviceScaleFactor": 1, "mobile": False})
    cdp.send("Page.addScriptToEvaluateOnNewDocument", {"source": SEED})

    cdp.send("Page.navigate", {"url": "http://localhost:3000/badges"})
    t0 = time.time()
    while time.time() - t0 < 20:
        if eval_(cdp, "document.readyState") == "complete": break
        time.sleep(0.15)
    time.sleep(2.5)
    print("badges loaded, pathname:", eval_(cdp, "location.pathname"))

    # Install a beat counter that fires every 50ms. If the main thread is
    # blocked by an infinite render loop, beats stop incrementing.
    eval_(cdp, r"""
      window.__beat = { count: 0, last: performance.now(), stalled: 0 };
      window.__beatTimer = setInterval(() => {
        const now = performance.now();
        if (now - window.__beat.last > 200) window.__beat.stalled++;
        window.__beat.last = now;
        window.__beat.count++;
      }, 50);
      window.__lt = [];
      try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push({d: Math.round(e.duration), s: Math.round(e.startTime)}); }).observe({entryTypes: ['longtask']}); } catch(e) {}
    """)

    # 1) Check responsiveness while PARKED on /badges for 2s
    b0 = eval_(cdp, "window.__beat.count")
    time.sleep(2)
    b1 = eval_(cdp, "window.__beat.count")
    print("parked on /badges 2s: beats", b0, "->", b1, "(expect ~40)")

    # 2) Click the target NavLink
    clicked = eval_(cdp, f"""(() => {{
      const a = document.querySelector('a[href="{target}"]');
      if (!a) return 'NO_LINK:' + JSON.stringify([...document.querySelectorAll('a')].map(x=>x.getAttribute('href')));
      a.click();
      return 'clicked';
    }})()""")
    print("click:", clicked, "target:", target)

    # 3) Poll: does route change? does the beat counter keep ticking?
    path_changed = None
    beats_before_click = eval_(cdp, "window.__beat.count")
    timeline = []
    t_click = time.time()
    for _ in range(40):
        p = eval_(cdp, "location.pathname")
        beats = eval_(cdp, "window.__beat.count")
        timeline.append(beats)
        if p != "/badges":
            path_changed = p
            # keep sampling a bit longer to see if beat continues after route change
            for _ in range(20):
                time.sleep(0.1)
                timeline.append(eval_(cdp, "window.__beat.count"))
            break
        time.sleep(0.15)
    elapsed = time.time() - t_click

    beats_after = eval_(cdp, "window.__beat.count")
    lt = eval_(cdp, "window.__lt")
    total_lt = sum(x["d"] for x in lt) if lt else 0
    print("route_changed_to:", path_changed, "after_sec:", round(elapsed, 2))
    print("beats: before_click=%d after=%d delta=%d (expect ~20/sec while responsive)" % (beats_before_click, beats_after, beats_after - beats_before_click))
    print("beat timeline:", timeline[-30:])
    print("longtasks:", len(lt or []), "total_block_ms:", total_lt)
    if lt:
        print("  worst:", sorted(lt, key=lambda x: -x["d"])[:8])
    # last values of the beat counter
    print("stalled_cnt:", eval_(cdp, "window.__beat.stalled"))

    cdp.ws.close()
    kill_port(PORT)

if __name__ == "__main__":
    main()
