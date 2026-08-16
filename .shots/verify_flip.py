"""One-shot: capture /badges top, then click next and capture mid/after flip."""
import json, base64, time, subprocess, os, glob
import websocket
import requests

CHROME = r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
PORT = 9223
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(HERE, "chrome_profile")
os.makedirs(PROFILE, exist_ok=True)

SEED_SRC = open(os.path.join(HERE, "cdp_shot.py"), encoding="utf-8").read()
SEED = SEED_SRC.split("SEED = r\"\"\"")[1].split('"""')[0]

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
    time.sleep(2.5)

def shot(cdp, name):
    res = cdp.send("Page.captureScreenshot", {"format": "png"})
    with open(os.path.join(HERE, name), "wb") as f:
        f.write(base64.b64decode(res["data"]))
    print("saved", name)

start_chrome()
r = requests.put(f"http://127.0.0.1:{PORT}/json/new?about:blank")
cdp = CDP(r.json()["webSocketDebuggerUrl"])
wait_load(cdp, "http://localhost:3000/badges")
shot(cdp, "badges_top.png")

res = cdp.send("Runtime.evaluate", {"expression": r"""
(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const nav = btns.filter(b => (b.className||'').includes('w-[20px]') && (b.className||'').includes('rounded-full'));
  const ind = Array.from(document.querySelectorAll('span')).map(s=>(s.textContent||'').trim()).filter(t=>/^\d\/\d+$/.test(t));
  const cells = Array.from(document.querySelectorAll('div')).filter(d => d.className && d.className.includes('w-[54px]') && d.className.includes('h-[54px]'));
  const feat = Array.from(document.querySelectorAll('div')).filter(d => d.className && d.className.includes('w-[66px]') && d.className.includes('h-[66px]'));
  const sz = (el) => { const r = el.getBoundingClientRect(); return Math.round(r.width)+'x'+Math.round(r.height); };
  const cls = (el) => (el.className.includes('grayscale') ? 'locked' : 'earned');
  return JSON.stringify({nav: nav.length, indicator: ind.join(','), cells: cells.map(sz), cellTypes: cells.map(cls), featured: feat.map(sz), nextDisabled: nav[1].disabled});
})()
""", "returnByValue": True})
print("PROBE:", res.get("result", {}).get("value"))

cdp.send("Runtime.evaluate", {"expression": r"""
(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const nav = btns.filter(b => (b.className||'').includes('w-[20px]') && (b.className||'').includes('rounded-full'));
  nav[1].click();
})()
""", "returnByValue": True})
time.sleep(0.13)
shot(cdp, "badges_flip_mid.png")
time.sleep(0.7)
shot(cdp, "badges_flip_after.png")

res = cdp.send("Runtime.evaluate", {"expression": r"""
(() => { return Array.from(document.querySelectorAll('span')).map(s=>(s.textContent||'').trim()).filter(t=>/^\d\/\d+$/.test(t)).join(','); })()
""", "returnByValue": True})
print("INDICATOR_AFTER:", res.get("result", {}).get("value"))

cdp.ws.close()
kill_port(PORT)
print("done")
