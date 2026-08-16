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

  // Classify fill colors: pastel card fills
  const fills = {
    green:  c => c[1] > c[0] + 8 && c[1] > c[2] + 8 && c[0] > 200 && c[2] > 180,   // E8F5E8-ish
    orange: c => c[0] > c[1] + 10 && c[1] > c[2] + 10 && c[0] > 245 && c[1] > 215, // FFF3E0-ish
    blue:   c => c[2] > c[1] + 8 && c[1] > c[0] + 5 && c[2] > 220,                 // E3F2FD-ish
    purple: c => c[0] > c[2] - 6 && c[0] > c[1] + 12 && c[0] > 230,                // F3E5F5-ish
  }

  // Downsample: count fill pixels per 10x10 cell, grid across bottom half
  const grid = []
  const cell = 12
  for (let gy = 0; gy < Math.floor(h / cell); gy++) {
    for (let gx = 0; gx < Math.floor(w / cell); gx++) {
      let cnt = { green: 0, orange: 0, blue: 0, purple: 0 }
      let tot = 0
      for (let dy = 0; dy < cell; dy += 3) {
        for (let dx = 0; dx < cell; dx += 3) {
          const y = gy * cell + dy, x = gx * cell + dx
          const c = px(x, y)
          tot++
          for (const [k, f] of Object.entries(fills)) if (f(c)) cnt[k]++
        }
      }
      const best = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]
      if (best && best[1] > 8) grid.push({ gx: gx * cell, gy: gy * cell, cls: best[0], n: best[1] })
    }
  }

  // Cluster grid cells by proximity
  const clusters = []
  for (const g of grid) {
    let found = null
    for (const cl of clusters) {
      const dx = Math.abs(cl.avgX - g.gx), dy = Math.abs(cl.avgY - g.gy)
      if (dx < 100 && dy < 60) { found = cl; break }
    }
    if (found) {
      found.cells.push(g)
      found.avgX = found.cells.reduce((s, c) => s + c.gx, 0) / found.cells.length
      found.avgY = found.cells.reduce((s, c) => s + c.gy, 0) / found.cells.length
    } else {
      clusters.push({ cls: g.cls, cells: [g], avgX: g.gx, avgY: g.gy })
    }
  }

  return clusters.map(cl => {
    const xs = cl.cells.map(c => c.gx), ys = cl.cells.map(c => c.gy)
    return { cls: cl.cls, x0: Math.min(...xs), x1: Math.max(...xs) + cell, y0: Math.min(...ys), y1: Math.max(...ys) + cell, avgX: Math.round(cl.avgX), avgY: Math.round(cl.avgY), n: cl.cells.length }
  }).sort((a, b) => a.avgY - b.avgY || a.avgX - b.avgX)
})

console.log(JSON.stringify(result, null, 1))
await browser.close()
