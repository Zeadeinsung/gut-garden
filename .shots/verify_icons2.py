"""Deeper DOM inspection: dump icons in status card + row labels."""
import json, time, subprocess, os
import websocket, requests

CHROME = r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
PORT = 9224
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(HERE, "chrome_profile_f3")

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
send("Emulation.setDeviceMetricsOverride", {"width": 1600, "height": 1000, "deviceScaleFactor": 1, "mobile": False})
send("Page.addScriptToEvaluateOnNewDocument", {"source": SEED})
send("Page.navigate", {"url": "http://localhost:3000/"})
time.sleep(4)

expr = r"""
(() => {
  const h = [...document.querySelectorAll('h3')].find(e => e.textContent.includes('花园状态'));
  if (!h) return 'NO H3';
  const card = h.closest('div[class*=card]');
  if (!card) return 'NO CARD';
  // list all rows by their text + icon child
  const rows = [];
  card.querySelectorAll('*').forEach(el => {
    if (el.children.length > 0) return;
    const t = (el.textContent || '').trim();
    if (!t) return;
    // a leaf node with text — check parent for icon
    const parent = el.parentElement;
    const icon = parent ? parent.querySelector('svg, img') : null;
    if (icon) {
      let kind = icon.tagName;
      if (kind === 'IMG') kind += ' ' + icon.src.split('/').pop();
      else {
        const p = icon.querySelector('path');
        const st = p ? (p.getAttribute('stroke') ? 'stroke:' + p.getAttribute('stroke') : '') : '';
        const fl = p ? (p.getAttribute('fill') ? 'fill:' + p.getAttribute('fill') : '') : '';
        kind += ' [' + st + ' ' + fl + ']';
      }
      rows.push(t.slice(0, 8) + ' -> ' + kind);
    }
  });
  return rows.join('\n');
})()
"""
res = send("Runtime.evaluate", {"expression": expr, "returnByValue": True})
print(res.get("result", {}).get("value"))
ws.close()
