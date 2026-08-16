import { chromium } from 'playwright-core'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const SHOT = 'D:/GutGardenBeta/.shots/badge-final.png'
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage()
await page.goto('file:///' + SHOT.replace(/\\/g, '/'))
await page.waitForTimeout(200)
const r = await page.evaluate(() => {
  const img = document.querySelector('img')
  const w = img.naturalWidth, h = img.naturalHeight
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const x = c.getContext('2d'); x.drawImage(img, 0, 0)
  const d = x.getImageData(0, 0, w, h).data
  const px = (a, b) => { const i = (b*w+a)*4; return [d[i], d[i+1], d[i+2]] }
  const isGreen = c2 => c2[1] > 100 && c2[1] > c2[0]+20 && c2[1] > c2[2]+20
  const isGray = c2 => Math.abs(c2[0]-c2[1]) < 18 && Math.abs(c2[1]-c2[2]) < 18 && c2[0] > 170 && c2[0] < 245
  let circleRow = -1
  for (let y = 10; y < h-20; y++) {
    let green=0, gray=0
    for (let a = 0; a < w; a += 2) { const cc = px(a,y); if (isGreen(cc)) green++; else if (isGray(cc)) gray++ }
    if (green > 12 && gray > 12) { circleRow = y; break }
  }
  const cols = []
  for (let a = 0; a < w; a++) { const cc = px(a, circleRow); if (isGreen(cc)||isGray(cc)) cols.push(a) }
  const cls = []
  let cur = null
  for (const a of cols) { if (cur && a - cur.x1 <= 4) cur.x1 = a; else { if (cur) cls.push(cur); cur = { x0:a, x1:a } } }
  if (cur) cls.push(cur)
  const circles = cls.filter(cl => cl.x1-cl.x0 >= 15).map(cl => { const m = Math.round((cl.x0+cl.x1)/2); return { cx: m, w: cl.x1-cl.x0+1, color: isGreen(px(m,circleRow)) ? 'green' : 'gray' } })
  let line = null
  if (circles.length >= 2) {
    const a = circles[0].cx, b = circles[1].cx
    let g=0, t=0
    for (let q = a+18; q <= b-18; q++) { t++; if (isGreen(px(q,circleRow))) g++ }
    line = { from: a, to: b, greenPct: t ? Math.round(g/t*100) : 0 }
  }
  return { w, h, circleRow, circles, line }
})
console.log(JSON.stringify(r, null, 1))
await browser.close()
