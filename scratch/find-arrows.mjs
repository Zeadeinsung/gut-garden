import { chromium } from 'playwright-core'

const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const SHOT = 'D:/GutGardenBeta/.shots/home-current.png'

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage()
await page.goto('file:///' + SHOT.replace(/\\/g, '/'))
await page.waitForTimeout(300)

const result = await page.evaluate(() => {
  const img = document.querySelector('img')
  const w = img.naturalWidth, h = img.naturalHeight
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, w, h).data
  const px = (x, y) => { const i = (y * w + x) * 4; return [data[i], data[i+1], data[i+2]] }

  // Find vivid accent squares: strong green/orange/blue/purple clusters with white pixels (triangle)
  const classes = {
    green:  c => c[1] > 110 && c[1] > c[0] + 30 && c[1] > c[2] + 30,
    orange: c => c[0] > 170 && c[1] > 80 && c[0] > c[1] + 30 && c[1] > c[2] + 20,
    blue:   c => c[2] > 120 && c[2] > c[0] + 30 && c[2] > c[1] + 30,
    purple: c => c[0] > 110 && c[2] > 110 && c[0] > c[1] + 15 && Math.abs(c[0] - c[2]) < 55,
  }
  const out = {}
  for (const [k, f] of Object.entries(classes)) {
    // grid-cluster saturated pixels
    const pts = []
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (f(px(x, y))) pts.push([x, y])
    const clusters = []
    for (const [x, y] of pts) {
      let found = null
      for (const cl of clusters) {
        if (Math.abs(cl.avgX - x) < 14 && Math.abs(cl.avgY - y) < 14) { found = cl; break }
      }
      if (found) { found.pts.push([x, y]); found.avgX = found.pts.reduce((s,p)=>s+p[0],0)/found.pts.length; found.avgY = found.pts.reduce((s,p)=>s+p[1],0)/found.pts.length }
      else clusters.push({ pts: [[x, y]], avgX: x, avgY: y })
    }
    out[k] = clusters
      .filter(cl => cl.pts.length >= 40 && cl.pts.length <= 500)
      .map(cl => {
        const xs = cl.pts.map(p => p[0]), ys = cl.pts.map(p => p[1])
        const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
        if (x1 - x0 > 40 || y1 - y0 > 40) return null
        let white = 0
        for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
          const c = px(xx, yy); if (c[0] > 225 && c[1] > 225 && c[2] > 225) white++
        }
        return { cx: Math.round(cl.avgX), cy: Math.round(cl.avgY), x0, y0, x1, y1, bw: x1-x0+1, bh: y1-y0+1, white }
      })
      .filter(Boolean)
      .sort((a, b) => a.cx - b.cx)
  }
  return out
})

console.log(JSON.stringify(result, null, 1))
await browser.close()
