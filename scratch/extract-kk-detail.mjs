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

  // Scan band y 540..900 for strong accent (title/arrow) columns per class
  const X0 = 300, X1 = 1500, Y0 = 540, Y1 = 900
  const classes = {
    green:  c => c[1] > 110 && c[1] > c[0] + 25 && c[1] > c[2] + 25,
    orange: c => c[0] > 175 && c[1] > 90 && c[0] > c[1] + 35 && c[1] > c[2] + 20,
    blue:   c => c[2] > 140 && c[2] > c[0] + 25 && c[2] > c[1] + 25,
    purple: c => c[0] > 120 && c[2] > 110 && c[0] > c[1] + 18 && Math.abs(c[0] - c[2]) < 45,
  }

  const colHist = {}   // per-class per-x count of accent pixels in band
  for (const k of Object.keys(classes)) colHist[k] = new Array(w).fill(0)
  for (let y = Y0; y < Y1; y++) {
    for (let x = X0; x < X1; x++) {
      const c = px(x, y)
      for (const [k, f] of Object.entries(classes)) {
        if (f(c)) colHist[k][x]++
      }
    }
  }

  // For each class, find contiguous x-runs where colHist > threshold → card location
  const cardLoc = {}
  for (const [k, hist] of Object.entries(colHist)) {
    const runs = []
    let cur = null
    for (let x = X0; x < X1; x++) {
      if (hist[x] > 4) { if (!cur) cur = { s: x, sum: 0 }; cur.e = x; cur.sum += hist[x] }
      else { if (cur) { runs.push(cur); cur = null } }
    }
    if (cur) runs.push(cur)
    const best = runs.filter(r => (r.e - r.s) > 40).sort((a, b) => b.sum - a.sum)[0]
    if (best) cardLoc[k] = best
  }

  // For each card, get detailed row profile
  const out = { band: [X0, Y0, X1, Y1], cards: {} }
  for (const [k, loc] of Object.entries(cardLoc)) {
    const f = classes[k]
    const rows = []
    for (let y = Y0; y < Y1; y++) {
      let cnt = 0, col = [0,0,0], minX = 1e9, maxX = -1
      for (let x = loc.s; x < loc.e; x++) {
        const c = px(x, y)
        if (f(c)) { cnt++; col[0]+=c[0]; col[1]+=c[1]; col[2]+=c[2]; if (x<minX) minX=x; if (x>maxX) maxX=x }
      }
      if (cnt > 2) rows.push({ y, cnt, minX, maxX, avg: col.map(v => Math.round(v/cnt)) })
    }
    // group into lines
    const lines = []
    let curL = null
    for (const r of rows) {
      if (curL && r.y - curL.lastY <= 4) {
        curL.lastY = r.y; curL.cnt += r.cnt
        curL.minX = Math.min(curL.minX, r.minX); curL.maxX = Math.max(curL.maxX, r.maxX)
        curL.col[0]+=r.avg[0]*r.cnt; curL.col[1]+=r.avg[1]*r.cnt; curL.col[2]+=r.avg[2]*r.cnt; curL.total += r.cnt
      } else {
        if (curL) lines.push(curL)
        curL = { y0: r.y, lastY: r.y, cnt: r.cnt, total: r.cnt, minX: r.minX, maxX: r.maxX, col: [...r.avg] }
      }
    }
    if (curL) lines.push(curL)
    out.cards[k] = {
      xRange: [loc.s, loc.e], width: loc.e - loc.s,
      lines: lines.map(l => ({ y: l.y0, minX: l.minX, maxX: l.maxX, width: l.maxX - l.minX, avg: l.col.map(v => Math.round(v / l.total)) })),
    }
  }
  return out
})

console.log(JSON.stringify(result, null, 1))
await browser.close()
