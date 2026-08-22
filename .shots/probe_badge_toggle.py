"""A/B toggle the title container translate to measure its exact contribution."""
import json, time, subprocess, os, glob, re
import websocket, requests

CHROME = r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
PORT = 9237
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(HERE, "chrome_profile_title2")
os.makedirs(PROFILE, exist_ok=True)

src = open(os.path.join(HERE, "probe_badge_title.py"), encoding="utf-8").read()
m = re.search(r"SEED = r\"\"\"(.*?)\"\"\"", src, re.S)
SEED = m.group(1)

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

kill_port(PORT); time.sleep(0.3)
for f in glob.glob(os.path.join(PROFILE, "Singleton*")):
    try: os.remove(f)
    except OSError: pass
subprocess.Popen([CHROME, f"--remote-debugging-port={PORT}", "--headless=new", "--disable-gpu",
    "--no-first-run","--no-default-browser-check","--hide-scrollbars","--remote-allow-origins=*",
    "--user-data-dir="+PROFILE, "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
for _ in range(60):
    try:
        r = requests.get(f"http://127.0.0.1:{PORT}/json/version", timeout=1)
        if r.ok: break
    except Exception: pass
    time.sleep(0.2)

class CDP:
    def __init__(self, ws_url):
        self.ws = websocket.create_connection(ws_url, timeout=30); self._id = 0
    def send(self, method, params=None):
        self._id += 1; mid = self._id
        self.ws.send(json.dumps({"id": mid, "method": method, "params": params or {}}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == mid: return msg.get("result", {})

def ev(cdp, expr):
    r = cdp.send("Runtime.evaluate", {"expression": expr, "returnByValue": True})
    return r.get("result", {}).get("value")

r = requests.put(f"http://127.0.0.1:{PORT}/json/new?about:blank")
cdp = CDP(r.json()["webSocketDebuggerUrl"])
cdp.send("Page.enable"); cdp.send("Runtime.enable")
cdp.send("Emulation.setDeviceMetricsOverride", {"width": 1600, "height": 1000, "deviceScaleFactor": 1, "mobile": False})
cdp.send("Page.addScriptToEvaluateOnNewDocument", {"source": SEED})
cdp.send("Page.navigate", {"url": "http://localhost:5173/badges"})
t0 = time.time()
while time.time() - t0 < 20:
    if ev(cdp, "document.readyState") == "complete": break
    time.sleep(0.15)
time.sleep(2.5)

res = ev(cdp, """(() => {
  const h1 = [...document.querySelectorAll('h1')].find(h => h.textContent.includes('成长徽章馆'));
  const box = h1.closest('[class*="translate-x"]') || h1.parentElement;
  const cs = getComputedStyle(box);
  return {
    boxClass: box.className,
    boxTransform: cs.transform,
    boxTranslate: cs.translate,
  };
})()""")
print("before:", json.dumps(res, ensure_ascii=False))

res2 = ev(cdp, """(() => {
  const h1 = [...document.querySelectorAll('h1')].find(h => h.textContent.includes('成长徽章馆'));
  const box = h1.closest('[class*="translate-x"]') || h1.parentElement;
  const measure = () => Math.round(h1.getBoundingClientRect().x + h1.getBoundingClientRect().width/2);
  const cur = measure();
  box.style.translate = '0px';
  const zero = measure();
  box.style.translate = '80px';
  const e80 = measure();
  box.style.translate = '';
  const restored = measure();
  return { cur, zero, e80, restored, deltaToZero: cur - zero, deltaTo80: e80 - zero };
})()""")
print("toggle:", json.dumps(res2, ensure_ascii=False))
cdp.ws.close()
kill_port(PORT)
