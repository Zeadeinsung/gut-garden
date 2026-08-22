"""Detect an infinite React render loop on /badges by counting fiber commits.

Hooks __REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot. In an infinite
effect->setState->render loop, commits skyrocket and the main thread stalls.
"""
import json, time, subprocess, sys, os, glob
import websocket, requests

CHROME = r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
PORT = 9230
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(HERE, "chrome_profile_loop")
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

    # Hook commit counting. Must be evaluated in the page AFTER React loaded.
    hooked = eval_(cdp, r"""
      (() => {
        const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (!hook) return 'NO_HOOK';
        if (hook.__commitCounted) return 'ALREADY';
        window.__commits = 0;
        const orig = hook.onCommitFiberRoot ? hook.onCommitFiberRoot.bind(hook) : null;
        hook.onCommitFiberRoot = (...args) => { window.__commits++; if (orig) return orig(...args); };
        hook.__commitCounted = true;
        return 'hooked';
      })()
    """)
    print("hook:", hooked)

    samples = []
    for i in range(6):
        c = eval_(cdp, "window.__commits")
        samples.append(c)
        print(f"  t+{i}s commits={c} delta={samples[-1] - (samples[-2] if len(samples)>1 else samples[0])}")
        time.sleep(1)
    # click a nav link after settling, to see if navigation away triggers commit storm
    clicked = eval_(cdp, """(() => { const a = document.querySelector('a[href="/garden"]'); if(!a) return 'NO_LINK'; a.click(); return 'clicked'; })()""")
    print("clicked nav:", clicked)
    time.sleep(1)
    print("commits after nav click:", eval_(cdp, "window.__commits"))
    print("pathname:", eval_(cdp, "location.pathname"))

    cdp.ws.close()
    kill_port(PORT)

if __name__ == "__main__":
    main()
