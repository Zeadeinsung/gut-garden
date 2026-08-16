"""Headless-Chrome CDP screenshot tool for the GutGarden app.

Usage: python cdp_shot.py <route...>   e.g. python cdp_shot.py /checkin /badges /classroom
Screenshots each page at top + a few scroll positions into .shots/.
"""
import json, base64, time, subprocess, sys, os, glob
import websocket
import requests

CHROME = r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
PORT = 9223
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(HERE, "chrome_profile")
os.makedirs(PROFILE, exist_ok=True)

# Clean old screenshots
for f in glob.glob(os.path.join(HERE, "*.png")):
    os.remove(f)

# ── seed script (runs before any page JS) ──────────────────────────
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
   'gg-block-positions-home','gg-block-positions-garden'].forEach(del);
})();
"""


def kill_port(port):
    """Kill only processes listening on `port` — leaves the user's own Chrome alone."""
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
    # Clear stale singleton locks left by a force-killed previous run (they make
    # the next launch exit immediately = "闪退").
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
    time.sleep(2.5)  # let animations/render settle


def metrics(cdp):
    res = cdp.send("Runtime.evaluate", {"expression": r"""
      (() => {
        const el = document.querySelector('.flex-1.overflow-auto') || document.scrollingElement;
        const r = el.getBoundingClientRect();
        return { clientH: el.clientHeight, scrollH: el.scrollHeight,
                 maxScroll: el.scrollHeight - el.clientHeight,
                 viewportW: innerWidth, viewportH: innerHeight };
      })()
    """, "returnByValue": True})
    return res.get("result", {}).get("value", {})


def scroll_by(cdp, dy):
    cdp.send("Runtime.evaluate", {"expression": r"""
      (() => {
        const el = document.querySelector('.flex-1.overflow-auto') || document.scrollingElement;
        el.scrollTop += %d;
        return el.scrollTop;
      })()
    """ % dy, "returnByValue": True})


def shot(cdp, name):
    res = cdp.send("Page.captureScreenshot", {"format": "png"})
    with open(os.path.join(HERE, name), "wb") as f:
        f.write(base64.b64decode(res["data"]))
    print("saved", name)


def main():
    routes = sys.argv[1:] or ["/checkin", "/badges", "/classroom"]
    start_chrome()
    pages = []
    for route in routes:
        r = requests.put(f"http://127.0.0.1:{PORT}/json/new?about:blank")
        pages.append(r.json()["webSocketDebuggerUrl"])

    for i, (route, ws) in enumerate(zip(routes, pages)):
        tag = route.strip("/") or "home"
        cdp = CDP(ws)
        url = "http://localhost:3000" + route
        print(f"== {tag} ==")
        wait_load(cdp, url)
        m = metrics(cdp)
        print("metrics:", json.dumps(m, ensure_ascii=False))
        shot(cdp, f"{tag}_top.png")
        # scroll down 2 steps
        for step in range(1, 3):
            scroll_by(cdp, 500)
            time.sleep(0.4)
            shot(cdp, f"{tag}_scroll{step}.png")
        cdp.ws.close()

    # teardown — only kill the headless instance we launched, not the user's browser
    kill_port(PORT)
    print("done")


if __name__ == "__main__":
    main()
