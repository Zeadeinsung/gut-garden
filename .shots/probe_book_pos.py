"""Measure cabinet + book vertical positions on /badges."""
import json, time, subprocess, os, glob
import websocket, requests

CHROME = r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
PORT = 9225
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(HERE, "chrome_profile_book")
os.makedirs(PROFILE, exist_ok=True)

SEED = open(os.path.join(HERE, "probe_cabinet_pos.py"), encoding="utf-8").read()
SEED = SEED.split("SEED = r\"\"\"")[1].split('"""')[0]

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
        try: os.remove(f)
        except OSError: pass
    subprocess.Popen([
        CHROME, f"--remote-debugging-port={PORT}",
        "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
        "--hide-scrollbars", "--remote-allow-origins=*", "--user-data-dir=" + PROFILE, "about:blank",
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(60):
        try:
            if requests.get(f"http://127.0.0.1:{PORT}/json/version", timeout=1).ok: return
        except Exception: pass
        time.sleep(0.2)
    raise RuntimeError("chrome did not start")

class CDP:
    def __init__(self, ws_url):
        self.ws = websocket.create_connection(ws_url, timeout=30)
        self._id = 0
    def send(self, method, params=None):
        self._id += 1; mid = self._id
        self.ws.send(json.dumps({"id": mid, "method": method, "params": params or {}}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == mid: return msg.get("result", {})

start_chrome()
r = requests.put(f"http://127.0.0.1:{PORT}/json/new?about:blank")
cdp = CDP(r.json()["webSocketDebuggerUrl"])
cdp.send("Page.enable"); cdp.send("Runtime.enable")
cdp.send("Emulation.setDeviceMetricsOverride", {"width": 1600, "height": 1000, "deviceScaleFactor": 1, "mobile": False})
cdp.send("Page.addScriptToEvaluateOnNewDocument", {"source": SEED})
cdp.send("Page.navigate", {"url": "http://localhost:3000/badges"})
time.sleep(4)

res = cdp.send("Runtime.evaluate", {"expression": r"""
(() => {
  const clamp = (el) => { const r = el.getBoundingClientRect(); return {left: Math.round(r.left), top: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height)}; };
  const info = {};
  let cabinet = null;
  document.querySelectorAll('div').forEach(d => { if (getComputedStyle(d).backgroundImage.includes('ui_badge_cabinet')) cabinet = d; });
  if (cabinet) info.cabinet = clamp(cabinet);
  // find BadgeBook: the share button text
  const shareBtn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent||'').replace(/\s+/g,'').includes('分享我的徽章墙'));
  if (shareBtn) {
    let bookRoot = shareBtn;
    // walk up to a large container (the DraggableBlock)
    for (let i=0;i<8;i++) {
      bookRoot = bookRoot.parentElement;
      const r = bookRoot.getBoundingClientRect();
      if (r.width > 500) { info.bookBlock = clamp(bookRoot); break; }
    }
    // also measure the book's 3d wrapper
    const bookWrap = shareBtn.closest('[style*="perspective"]');
    if (bookWrap) info.bookPerspective = clamp(bookWrap);
    const pages = Array.from(document.querySelectorAll('[style*="rotateX(26deg)"]')).map(clamp);
    info.bookTilt = pages;
  }
  info.shareBtn = shareBtn ? clamp(shareBtn) : null;
  return JSON.stringify(info);
})()
""", "returnByValue": True})
print("MEASURE:", res.get("result", {}).get("value"))
cdp.ws.close()
kill_port(PORT)
print("done")
