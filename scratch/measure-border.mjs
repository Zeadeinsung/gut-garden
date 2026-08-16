import { chromium } from 'playwright-core'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const b = await chromium.launch({ executablePath: CHROME, headless: true })
const p = await b.newPage()
await p.goto('file:///D:/GutGardenBeta/.shots/home-kingkong.png')
await p.waitForTimeout(300)
const m = await p.evaluate(() => {
  const img = document.querySelector('img')
  const w = img.naturalWidth, h = img.naturalHeight
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const x = c.getContext('2d'); x.drawImage(img, 0, 0)
  const d = x.getImageData(0, 0, w, h).data
  const px = (xx, yy) => { const i = (yy * w + xx) * 4; return [d[i], d[i + 1], d[i + 2]] }
  // scan a horizontal row across card1 (green) body; classify
  const out = { w, h }
  // detect greenish runs at several rows
  for (const y of [230, 260, 290]) {
    const isGreen = (c) => c[1] > c[0] + 10 && c[1] > c[2] + 20
    let runs = [], cur = null
    for (let i = 0; i < w; i++) {
      if (isGreen(px(i, y))) { if (!cur) cur = { s: i }; cur.e = i }
      else { if (cur) { runs.push(cur); cur = null } }
    }
    if (cur) runs.push(cur)
    out['row' + y] = runs.map(r => r.e - r.s)
  }
  return out
})
console.log(JSON.stringify(m, null, 1))
await b.close()
