"""Screenshot ClassroomPage and probe for any music-note button + sprite bubble."""
import json, base64, time, subprocess, os
import websocket, requests

CHROME = r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
PORT = 9229
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(HERE, "chrome_profile_cr")

SEED = r"""
(() => {
  const set = (k, v) => localStorage.setItem(k, v);
  set('gg-onboarding-done', 'true');
  set('gg-auth', JSON.stringify({"state":{"mode":"guest","user":{
    "parent_id":1,"phone":"13800000000",
    "children":[{"id":1,"name":"小满","age":5,"avatar_url":null}],
    "active_child_id":1
  },"token":null,"loading":false},"version":0}));
  ['gg-block-positions-classroom'].forEach(k => localStorage.removeItem(k));
})();
"""

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
send("Page.navigate", {"url": "http://localhost:3000/classroom"})
time.sleep(4)

# Probe all img/svg/emoji buttons and the sprite bubble
expr = r"""
(() => {
  // find music-note-ish elements: any img whose src contains note/music, any svg, any text with note
  const notes = [...document.querySelectorAll('img')].filter(i => /music|note|音符/i.test(i.src)).map(i => {
    const r = i.getBoundingClientRect();
    return {src: i.src.split('/').pop(), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height)};
  });
  // sprite bubble text
  const bubble = [...document.querySelectorAll('div')].filter(d => /想探索什么/.test(d.textContent) && d.children.length === 0).map(d => {
    const r = d.getBoundingClientRect();
    return {x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), fontSize: getComputedStyle(d).fontSize};
  });
  // any button with a single-letter music glyph (emoji)
  const btns = [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(t => /[🎵🎶♪♫]/.test(t));
  return JSON.stringify({notes, bubble, btns});
})()
"""
res = send("Runtime.evaluate", {"expression": expr, "returnByValue": True})
print("PROBE:", res.get("result", {}).get("value"))

shot = send("Page.captureScreenshot", {"format": "png"})
with open(os.path.join(HERE, "classroom_full.png"), "wb") as f:
    f.write(base64.b64decode(shot["data"]))
print("saved classroom_full.png")
ws.close()
