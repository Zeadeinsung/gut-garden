import json, base64, time, subprocess, os, glob
import websocket
import requests

CHROME = r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
PORT = 9227
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(HERE, "chrome_profile_cards")
os.makedirs(PROFILE, exist_ok=True)

SEED = r"""
(() => {
  const set = (k, v) => localStorage.setItem(k, v);
  const del = (k) => localStorage.removeItem(k);
  const d = new Date(); d.setHours(0,0,0,0);
  const todayKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  set('gg-onboarding-done', 'true');
  set('gg-auth', JSON.stringify({"state":{"mode":"guest","user":{
    "parent_id":1,"phone":"13800000000",
    "children":[{"id":1,"name":"小满","age":5,"avatar_url":null}],
    "active_child_id":1
  },"token":null,"loading":false},"version":0}));
  set('gg-garden', JSON.stringify({"state":{
    "currentState":"healthy","moistureLevel":60,"gardenLevel":5,"gardenXp":80,"interactionCount":12
  },"version":0}));
  set('gg-checkin', JSON.stringify({"state":{
    "today":{"date":todayKey,"tasks":[
      {"id":"task_garden","status":"pending"},
      {"id":"task_eat","status":"done"},
      {"id":"task_sleep","status":"pending"},
      {"id":"task_water","status":"done"},
      {"id":"task_sport","status":"pending"}
    ],"all_completed":false},
    "streak":12,"makeupsUsed":0
  },"version":0}));
  ['gg-block-positions-checkin'].forEach(del);
})();
"""

def kill_port(port):
    try:
        out = subprocess.run(["netstat", "-ano"], capture_output=True, text=True).stdout
        pids = set()
        for line in out.splitlines():
            parts = line.split()
            if len(parts) >= 5 and parts[0] == "TCP" and parts[1].endswith(f":{port}") and parts[3] == "LISTENING":
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

def wait_load(cdp, url, timeout=20, w=1600, h=1000):
    cdp.send("Page.enable")
    cdp.send("Runtime.enable")
    cdp.send("Emulation.setDeviceMetricsOverride", {"width": w, "height": h, "deviceScaleFactor": 1, "mobile": False})
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

def main():
    import sys
    w = int(sys.argv[1]) if len(sys.argv) > 1 else 1600
    h = int(sys.argv[2]) if len(sys.argv) > 2 else 1000
    tag = f"{w}x{h}"
    start_chrome()
    r = requests.put(f"http://127.0.0.1:{PORT}/json/new?about:blank")
    cdp = CDP(r.json()["webSocketDebuggerUrl"])
    wait_load(cdp, "http://localhost:5173/checkin", w=w, h=h)
    shot(cdp, f"checkin_cards_{tag}.png")
    # crop the care section for detail
    cdp.send("Runtime.evaluate", {"expression": r"""
      (() => {
        const cards = document.querySelectorAll('.ggc-task-card');
        if (!cards.length) return 'no-cards';
        const first = cards[0].getBoundingClientRect();
        const last = cards[cards.length-1].getBoundingClientRect();
        const x = first.left, y = first.top, right = last.right, bottom = last.bottom;
        const sw = (right-x)/innerWidth, sh = (bottom-y)/innerHeight;
        return JSON.stringify({x, y, right, bottom, sw, sh, sx: x/innerWidth, sy: y/innerHeight});
      })()
    """, "returnByValue": True})
    shot(cdp, f"checkin_cards_{tag}_full.png")
    cdp.ws.close()
    kill_port(PORT)
    print("done")

if __name__ == "__main__":
    main()
