"""Scope the render loop: is it badges-only or global? Count commits per route."""
import json, time, subprocess, sys, os, glob
import websocket, requests

CHROME = r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
PORT = 9231
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(HERE, "chrome_profile_scope")
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

def load(cdp, url):
    cdp.send("Page.enable"); cdp.send("Runtime.enable")
    cdp.send("Emulation.setDeviceMetricsOverride", {"width": 1600, "height": 1000, "deviceScaleFactor": 1, "mobile": False})
    cdp.send("Page.addScriptToEvaluateOnNewDocument", {"source": SEED})
    t0 = time.time()
    cdp.send("Page.navigate", {"url": url})
    while time.time() - t0 < 20:
        if eval_(cdp, "document.readyState") == "complete": break
        time.sleep(0.15)
    time.sleep(2.0)

def commits_per_sec(cdp, label, seconds=3):
    hooked = eval_(cdp, r"""
      (() => {
        const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (!hook) return 'NO_HOOK';
        if (hook.__cc) return 'ALREADY';
        window.__cc = 0;
        const orig = hook.onCommitFiberRoot ? hook.onCommitFiberRoot.bind(hook) : null;
        hook.onCommitFiberRoot = (...a) => { window.__cc++; if (orig) return orig(...a); };
        hook.__cc = true;
        return 'hooked';
      })()
    """)
    c0 = eval_(cdp, "window.__cc || 0")
    time.sleep(seconds)
    c1 = eval_(cdp, "window.__cc || 0")
    rate = (c1 - c0) / seconds
    print(f"  [{label}] commits/sec = {rate:.0f}  (path={eval_(cdp, 'location.pathname')})")
    return rate

def main():
    start_chrome()
    r = requests.put(f"http://127.0.0.1:{PORT}/json/new?about:blank")
    cdp = CDP(r.json()["webSocketDebuggerUrl"])
    # warm all chunks
    for route in ["/", "/garden", "/checkin", "/badges", "/classroom"]:
        load(cdp, "http://localhost:3000" + route)
    print("chunks warmed\n")

    print("=== fresh / ===")
    load(cdp, "http://localhost:3000/")
    commits_per_sec(cdp, "home")
    print("\n=== fresh /garden ===")
    load(cdp, "http://localhost:3000/garden")
    commits_per_sec(cdp, "garden")
    print("\n=== fresh /checkin ===")
    load(cdp, "http://localhost:3000/checkin")
    commits_per_sec(cdp, "checkin")
    print("\n=== fresh /badges ===")
    load(cdp, "http://localhost:3000/badges")
    commits_per_sec(cdp, "badges")
    print("\n=== fresh /classroom ===")
    load(cdp, "http://localhost:3000/classroom")
    commits_per_sec(cdp, "classroom")
    print("\n=== back to fresh /garden (after visiting /badges) ===")
    load(cdp, "http://localhost:3000/garden")
    commits_per_sec(cdp, "garden-after-badges")

    cdp.ws.close()
    kill_port(PORT)

if __name__ == "__main__":
    main()
