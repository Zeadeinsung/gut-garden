"""Screenshot HomePage status card at 3x zoom to verify enlarged cells."""
import json, base64, time, subprocess, os
from PIL import Image
import websocket, requests

CHROME = r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
PORT = 9224
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(HERE, "chrome_profile_s")

SEED = open(os.path.join(HERE, "shot_f3.py"), encoding="utf-8").read().split('SEED = r"""')[1].split('"""')[0]

subprocess.Popen([
    CHROME, f"--remote-debugging-port={PORT}", "--headless=new", "--disable-gpu",
    "--no-first-run", "--no-default-browser-check", "--hide-scrollbars",
    "--remote-allow-origins=*", "--user-data-dir=" + PROFILE, "about:blank",
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
for _ in range(60):
    try:
        if requests.get(f"http://127.0.0.1:{PORT}/json/version", timeout=1).ok:
            break
    except Exception:
        pass
    time.sleep(0.2)

r = requests.put(f"http://127.0.0.1:{PORT}/json/new?about:blank")
ws = websocket.create_connection(r.json()["webSocketDebuggerUrl"], timeout=30)
_id = 0
def send(m, p=None):
    global _id
    _id += 1
    mid = _id
    ws.send(json.dumps({"id": mid, "method": m, "params": p or {}}))
    while True:
        msg = json.loads(ws.recv())
        if msg.get("id") == mid:
            return msg.get("result", {})

send("Page.enable")
send("Runtime.enable")
send("Emulation.setDeviceMetricsOverride", {"width": 1600, "height": 1000, "deviceScaleFactor": 2, "mobile": False})
send("Page.addScriptToEvaluateOnNewDocument", {"source": SEED})
send("Page.navigate", {"url": "http://localhost:3000/"})
time.sleep(4)

expr = r"""
(() => {
  const h = [...document.querySelectorAll('h3')].find(e => e.textContent.includes('今日花园状态'));
  const card = h.closest('div[class*=card]');
  const cr = card.getBoundingClientRect();
  // also measure each status cell text sizes
  const cells = [...card.querySelectorAll('div.grid.grid-cols-3 > div')].map(c => {
    const cs = c.querySelectorAll('span');
    return cs.length ? (cs[0].textContent + '/' + cs[1].textContent + ' label=' + getComputedStyle(cs[0]).fontSize + ' value=' + getComputedStyle(cs[1]).fontSize) : '';
  });
  return JSON.stringify({x:cr.x, y:cr.y, w:cr.width, h:cr.height, cells});
})()
"""
res = send("Runtime.evaluate", {"expression": expr, "returnByValue": True})
val = res.get("result", {}).get("value")
print("RECT+CELLS:", val)

shot = send("Page.captureScreenshot", {"format": "png"})
full = os.path.join(HERE, "status_big_full.png")
with open(full, "wb") as f:
    f.write(base64.b64decode(shot["data"]))

if val and val.startswith("{"):
    info = json.loads(val)
    s = 2
    pad = 4
    img = Image.open(full)
    box = (int((info["x"]-pad)*s), int((info["y"]-pad)*s), int((info["x"]+info["w"]+pad)*s), int((info["y"]+info["h"]+pad)*s))
    box = (max(0,box[0]), max(0,box[1]), min(img.width,box[2]), min(img.height,box[3]))
    crop = img.crop(box)
    crop.save(os.path.join(HERE, "status_big_card.png"))
    print("saved status_big_card.png", crop.size)
ws.close()
