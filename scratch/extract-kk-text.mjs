import { chromium } from 'playwright-core'
import { pathToFileURL } from 'node:url'

const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const REF = 'D:/GutGardenBeta/.tokenicode/tmp/d64ffc3b0ffe0d145a43a8eb6fdbd73_17859210155096.png'

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage()
await page.goto(pathToFileURL(REF).href)
await page.waitForTimeout(500)

const result = await page.evaluate(() => {
  const img = document.querySelector('img')
  const w = img.naturalWidth, h = img.naturalHeight
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, w, h).data
  const px = (x, y) => { const i = (y * w + x) * 4; return [data[i], data[i+1], data[i+2]] }

  // Find the 4 cards. The kingkong band is around y 560-900. Probe y=620 row for border x-runs.
  const probeY = 630
  const runs = []
  let cur = null
  const dark = (c) => c[0] < 120 && c[1] < 150   // dark border-ish
  for (let x = 250; x < 1450; x++) {
    const c = px(x, probeY)
    if (c[0] < 200 || c[1] < 200) { if (!cur) cur = { s: x }; cur.e = x }
    else { if (cur) { runs.push(cur); cur = null } }
  }
  if (cur) runs.push(cur)

  // Keep runs wide enough to be cards
  const cards = runs.filter(r => (r.e - r.s) > 80).map(r => ({ x0: r.s, x1: r.e }))
  const out = { w, h, cards }

  // For each card, scan a vertical band for saturated title pixels → x-extent & centering
  out.titles = {}
  cards.forEach((c, ci) => {
    const bx = Math.floor((c.x0 + c.x1) / 2)
    // find title band: rows where saturated colored pixels exist (title) within upper 60% of card
    const cy0 = probeY - 80, cy1 = probeY + 90
    const rows = []
    for (let y = cy0; y < cy1; y++) {
      let minX = 1e9, maxX = -1, cnt = 0, col = [0,0,0]
      for (let x = c.x0 + 8; x < c.x1 - 8; x++) {
        const [r, g, b] = px(x, y)
        const sat = Math.max(r,g,b) - Math.min(r,g,b)
        if (sat > 40 && (r < 180 || g < 180 || b < 180)) {
          if (x < minX) minX = x; if (x > maxX) maxX = x
          col[0]+=r; col[1]+=g; col[2]+=b; cnt++
        }
      }
      if (cnt > 2) rows.push({ y, minX, maxX, cnt, avg: col.map(v => Math.round(v/cnt)) })
    }
    // group consecutive rows into text lines
    const lines = []
    let curLine = null
    for (const r of rows) {
      if (curLine && r.y - curLine.lastY <= 4) {
        curLine.lastY = r.y; curLine.maxX = Math.max(curLine.maxX, r.maxX); curLine.minX = Math.min(curLine.minX, r.minX); curLine.cnt += r.cnt
        curLine.col[0]+=r.avg[0]*r.cnt; curLine.col[1]+=r.avg[1]*r.cnt; curLine.col[2]+=r.avg[2]*r.cnt; curLine.total += r.cnt
      } else {
        if (curLine) lines.push(curLine)
        curLine = { y0: r.y, lastY: r.y, minX: r.minX, maxX: r.maxX, cnt: r.cnt, total: r.cnt, col: [...r.avg] }
      }
    }
    if (curLine) lines.push(curLine)
    out.titles['card' + (ci+1)] = lines.map(l => ({
      y: l.y0, minX: l.minX, maxX: l.maxX, width: l.maxX - l.minX,
      centerOffset: Math.abs((l.minX + l.maxX) / 2 - bx),
      avgCol: l.col.map(v => Math.round(v / l.total)),
    }))
  })

  return out
})

console.log(JSON.stringify(result, null, 1))
await browser.close()
