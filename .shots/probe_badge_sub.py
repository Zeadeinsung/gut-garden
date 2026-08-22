import json, base64, time, subprocess, os, glob
import websocket
import requests

CHROME = r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
PORT = 9234
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(HERE, "chrome_profile_probe")
os.makedirs(PROFILE, exist_ok=True)

SEED = r"""
(() => {
  const set = (k, v) => localStorage.setItem(k, v);
  set('gg-onboarding-done', 'true');
  set('gg-auth', JSON.stringify({"state":{"mode":"guest","user":{
    "parent_id":1,"phone":"13800000000",
    "children":[{"id":1,"name":"小满","age":5,"avatar_url":null}],
    "active_child_id":1
  },"token":null,"loading":false},"version":0}));
  set('gg-garden', JSON.stringify({"state":{
    "currentState":"healthy","moistureLevel":60,"gardenLevel":5,"gardenXp":80,"interactionCount":12
  },"version":0}));
  ['gg-block-positions-badges'].forEach(k => localStorage.removeItem(k));
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
        self.ws = websocket.create_connection(ws_url, timeout=30); self._id = 0
    def send(self, method, params=None):
        self._id += 1; mid = self._id
        self.ws.send(json.dumps({"id": mid, "method": method, "params": params or {}}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == mid: return msg.get("result", {})

def eval_(cdp, expr):
    r = cdp.send("Runtime.evaluate", {"expression": expr, "returnByValue": True})
    return r.get("result", {}).get("value")

def main():
    start_chrome()
    r = requests.put(f"http://127.0.0.1:{PORT}/json/new?about:blank")
    cdp = CDP(r.json()["webSocketDebuggerUrl"])
    cdp.send("Page.enable"); cdp.send("Runtime.enable")
    cdp.send("Emulation.setDeviceMetricsOverride", {"width": 1600, "height": 1000, "deviceScaleFactor": 1, "mobile": False})
    cdp.send("Page.addScriptToEvaluateOnNewDocument", {"source": SEED})
    cdp.send("Page.navigate", {"url": "http://localhost:5173/badges"})
    t0 = time.time()
    while time.time() - t0 < 20:
        if eval_(cdp, "document.readyState") == "complete": break
        time.sleep(0.15)
    time.sleep(2.5)
    res = eval_(cdp, """(() => {
      const p = [...document.querySelectorAll('p')].find(p => p.textContent.includes('每一枚徽章'));
      if (!p) return 'not-found';
      const cs = getComputedStyle(p);
      const h1 = p.parentElement?.querySelector('h1');
      const hr = h1 ? h1.getBoundingClientRect() : null;
      const pr = p.getBoundingClientRect();
      const measure = () => Math.round(p.getBoundingClientRect().x);
      const withShift = measure();
      p.style.translate = '0px';
      const without = measure();
      p.style.translate = '8px';
      const restored = measure();
      return {
        pTransform: cs.transform,
        pTranslate: cs.translate,
        pX: Math.round(pr.x),
        withShift, without, restored, delta: withShift - without,
        h1X: hr ? Math.round(hr.x) : null,
        deltaLeft: hr ? Math.round(pr.x - hr.x) : null,
        pText: p.textContent
      };
    })()""")
    print(json.dumps(res, ensure_ascii=False))
    cdp.ws.close()
    kill_port(PORT)

if __name__ == "__main__":
    main()
