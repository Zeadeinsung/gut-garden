import { chromium } from 'playwright-core'
import { pathToFileURL } from 'node:url'

const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const REF = 'D:/GutGardenBeta/.tokenicode/tmp/d64ffc3b0ffe0d145a43a8eb6fdbd73_17859188931385.png'

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

  // broad "greenish card" test: captures border + interior, excludes cream bg
  const isGreenish = (i) => {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    return g > r + 6 && g > b + 8
  }

  // flood fill restricted to a region around card 1 to avoid leaking left
  const RX0 = 380, RX1 = 700, RY0 = 585, RY1 = 830
  const seed = [542, 750]
  const mask = new Uint8Array(w * h)
  const stack = [seed]
  mask[seed[1] * w + seed[0]] = 1
  let minX = w, maxX = 0, minY = h, maxY = 0, count = 0
  while (stack.length) {
    const [cx, cy] = stack.pop()
    if (cx < minX) minX = cx; if (cx > maxX) maxX = cx
    if (cy < minY) minY = cy; if (cy > maxY) maxY = cy
    count++
    for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
      if (nx < RX0 || nx > RX1 || ny < RY0 || ny > RY1) continue
      const idx = ny * w + nx
      if (mask[idx]) continue
      if (isGreenish(idx * 4)) { mask[idx] = 1; stack.push([nx, ny]) }
    }
  }

  // per-row leftmost/rightmost mask pixel
  const edges = []
  for (let y = minY; y <= maxY; y++) {
    let lx = -1, rx = -1
    for (let x = minX; x <= maxX; x++) {
      if (mask[y * w + x]) { if (lx === -1) lx = x; rx = x }
    }
    if (lx !== -1) edges.push({ y: y - minY, lx: lx - minX, rx: rx - minX })
  }

  return {
    w, h, bbox: [minX, minY, maxX, maxY],
    bw: maxX - minX + 1, bh: maxY - minY + 1, count,
    silhouette: edges,
  }
})

console.log(JSON.stringify(result))
await browser.close()
