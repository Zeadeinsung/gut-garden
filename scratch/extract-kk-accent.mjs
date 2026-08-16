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

  // strongly saturated accent colors per card (title/arrow/border)
  const classes = {
    green:  c => c[1] > 120 && c[1] > c[0] + 30 && c[1] > c[2] + 30,
    orange: c => c[0] > 180 && c[1] > 90 && c[0] > c[1] + 40 && c[1] > c[2] + 20,
    blue:   c => c[2] > 150 && c[2] > c[0] + 30 && c[2] > c[1] + 30,
    purple: c => c[0] > 120 && c[2] > 120 && c[0] > c[1] + 20 && Math.abs(c[0] - c[2]) < 40,
  }

  // find rows containing accent pixels per class; get bounding box of accent regions
  const out = {}
  for (const [k, f] of Object.entries(classes)) {
    const pts = []
    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        if (f(px(x, y))) pts.push([x, y])
      }
    }
    // cluster
    const clusters = []
    for (const [x, y] of pts) {
      let found = null
      for (const cl of clusters) {
        const dx = Math.abs(cl.avgX - x), dy = Math.abs(cl.avgY - y)
        if (dx < 90 && dy < 60) { found = cl; break }
      }
      if (found) { found.pts.push([x, y]); found.avgX = found.pts.reduce((s, p) => s + p[0], 0) / found.pts.length; found.avgY = found.pts.reduce((s, p) => s + p[1], 0) / found.pts.length }
      else clusters.push({ pts: [[x, y]], avgX: x, avgY: y })
    }
    out[k] = clusters
      .filter(cl => cl.pts.length > 8)
      .map(cl => {
        const xs = cl.pts.map(p => p[0]), ys = cl.pts.map(p => p[1])
        return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), cx: Math.round(cl.avgX), cy: Math.round(cl.avgY), n: cl.pts.length }
      })
      .sort((a, b) => a.cy - b.cy || a.cx - b.cx)
  }
  return out
})

console.log(JSON.stringify(result, null, 1))
await browser.close()
