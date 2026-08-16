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

  // Scan the whole image for saturated accent squares with a white center (arrow button).
  // Arrow buttons: strongly saturated bg, ~small, contain near-white pixels (the arrow glyph).
  const classes = {
    green:  { f: c => c[1] > 120 && c[1] > c[0] + 30 && c[1] > c[2] + 30 },
    orange: { f: c => c[0] > 190 && c[1] > 90 && c[0] > c[1] + 35 && c[1] > c[2] + 20 },
    blue:   { f: c => c[2] > 140 && c[2] > c[0] + 30 && c[2] > c[1] + 30 },
    purple: { f: c => c[0] > 110 && c[2] > 100 && c[0] > c[1] + 15 && Math.abs(c[0] - c[2]) < 50 },
  }

  // For each class, find connected regions of saturated pixels (downsampled)
  const out = {}
  for (const [k, { f }] of Object.entries(classes)) {
    // collect saturated points
    const pts = []
    for (let y = 540; y < h; y++) for (let x = 250; x < 1450; x++) if (f(px(x, y))) pts.push([x, y])
    // cluster by 8-connected-ish (simple grid cluster)
    const clusters = []
    for (const [x, y] of pts) {
      let found = null
      for (const cl of clusters) {
        if (Math.abs(cl.avgX - x) < 12 && Math.abs(cl.avgY - y) < 12) { found = cl; break }
      }
      if (found) { found.pts.push([x, y]); found.avgX = found.pts.reduce((s,p)=>s+p[0],0)/found.pts.length; found.avgY = found.pts.reduce((s,p)=>s+p[1],0)/found.pts.length }
      else clusters.push({ pts: [[x, y]], avgX: x, avgY: y })
    }
    // keep small clusters (arrows are small), size 15..400 px
    const candidates = clusters
      .filter(cl => cl.pts.length >= 15 && cl.pts.length <= 500)
      .map(cl => {
        const xs = cl.pts.map(p => p[0]), ys = cl.pts.map(p => p[1])
        const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
        const bw = x1 - x0 + 1, bh = y1 - y0 + 1
        if (bw < 6 || bw > 60 || bh < 6 || bh > 60) return null
        // check white pixels inside the bbox (arrow glyph)
        let white = 0
        for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
          const c = px(xx, yy); if (c[0] > 220 && c[1] > 220 && c[2] > 220) white++
        }
        return { x0, y0, x1, y1, bw, bh, n: cl.pts.length, whitePx: white, centerBg: px(Math.round((x0+x1)/2), Math.round((y0+y1)/2)) }
      })
      .filter(Boolean)
    out[k] = candidates.sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0)
  }
  return out
})

console.log(JSON.stringify(result, null, 1))
await browser.close()
