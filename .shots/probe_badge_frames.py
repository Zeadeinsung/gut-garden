"""Screenshot /badges with mixed-rarity badge awards to verify gold/silver/bronze frames."""
import json, base64, time, subprocess, os, glob
import websocket, requests

CHROME = r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
PORT = 9246
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(HERE, "chrome_profile_frames")
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
      {"id":1,"badge_id":1,"code":"first_checkin","name":"初来乍到","rarity":"gold","awarded_at":"2026-07-30"},
      {"id":2,"badge_id":2,"code":"persist_3d","name":"初露锋芒","rarity":"bronze","awarded_at":"2026-07-31"},
      {"id":3,"badge_id":3,"code":"persist_7d","name":"一周之星","rarity":"silver","awarded_at":"2026-08-01"},
      {"id":4,"badge_id":4,"code":"persist_30d","name":"月度冠军","rarity":"gold","awarded_at":"2026-08-02"},
      {"id":5,"badge_id":6,"code":"first_feed","name":"初次投喂","rarity":"bronze","awarded_at":"2026-08-03"},
      {"id":6,"badge_id":7,"code":"feed_50","name":"小小农夫","rarity":"silver","awarded_at":"2026-08-04"},
      {"id":7,"badge_id":11,"code":"first_quiz","name":"好奇宝宝","rarity":"gold","awarded_at":"2026-08-05"},
      {"id":8,"badge_id":13,"code":"first_stool","name":"便便观察员","rarity":"bronze","awarded_at":"2026-08-06"},
      {"id":9,"badge_id":17,"code":"type4_streak_5","name":"超级便便","rarity":"silver","awarded_at":"2026-08-07"},
      {"id":10,"badge_id":18,"code":"perfect_week","name":"完美一周","rarity":"gold","awarded_at":"2026-08-08"}
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

def stats(cdp):
    expr = r"""
    (() => {
      const frames = [...document.querySelectorAll('img')].filter(i => i.src.includes('badges/frames/'));
      const counts = {gold:0, silver:0, bronze:0};
      frames.forEach(i => { const s = i.src; if(s.includes('gold'))counts.gold++; else if(s.includes('silver'))counts.silver++; else counts.bronze++; });
      const lockIcons = [...document.querySelectorAll('svg,img')].filter(e => {
        const cl = (e.getAttribute('class')||'');
        const p = (e.closest && e.closest('[class]')) ? e.closest('[class]').getAttribute('class')||'' : '';
        return (cl+' '+p).includes('grayscale');
      }).length;
      return JSON.stringify({frameImgs: counts, litFrames: frames.length, grayish: lockIcons});
    })()
    """
    res = cdp.send("Runtime.evaluate", {"expression": expr, "returnByValue": True})
    print("DOM stats:", res.get("result", {}).get("value"))

start_chrome()
r = requests.put(f"http://127.0.0.1:{PORT}/json/new?about:blank")
cdp = CDP(r.json()["webSocketDebuggerUrl"])
wait_load(cdp, "http://localhost:3000/badges")
stats(cdp)
shot(cdp, "badge_frames.png")
cdp.ws.close()
kill_port(PORT)
print("done")
