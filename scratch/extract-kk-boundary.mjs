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

  // interior classification: high-lightness pastels, per card color
  const isInterior = (i, cls) => {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    if (cls === 1) return r > 205 && b > 190 && g > r + 4 && g > b + 14
    if (cls === 2) return r > 230 && b > 195 && r > g + 8 && g > b + 10
    if (cls === 3) return r > 205 && b > 225 && b > r + 10 && b > g + 3
    if (cls === 4) return r > 210 && b > 210 && g < r - 3 && g < b - 3 && Math.abs(r - b) < 30
    return false
  }

  const flood = (seedX, seedY, cls) => {
    const mask = new Uint8Array(w * h)
    const stack = [[seedX, seedY]]
    mask[seedY * w + seedX] = 1
    let minX = w, maxX = 0, minY = h, maxY = 0, count = 0
    while (stack.length) {
      const [cx, cy] = stack.pop()
      if (cx < minX) minX = cx; if (cx > maxX) maxX = cx
      if (cy < minY) minY = cy; if (cy > maxY) maxY = cy
      count++
      for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
        const idx = ny * w + nx
        if (mask[idx]) continue
        if (isInterior(idx * 4, cls)) { mask[idx] = 1; stack.push([nx, ny]) }
      }
    }
    return { mask, minX, maxX, minY, maxY, count }
  }

  // find seeds in the bottom band (y 0.55h..h), pick largest blob per class
  const scanTop = Math.floor(h * 0.55)
  const blobs = { 1: null, 2: null, 3: null, 4: null }
  for (let y = scanTop; y < h; y++) {
    for (let x = 0; x < w; x++) {
      for (let cls = 1; cls <= 4; cls++) {
        if (isInterior((y * w + x) * 4, cls)) {
          const b = flood(x, y, cls)
          if (b.count > 2000 && (!blobs[cls] || b.count > blobs[cls].count)) blobs[cls] = b
          break
        }
      }
    }
  }

  const pick = (blob) => blob ? { bbox: [blob.minX, blob.minY, blob.maxX, blob.maxY], bw: blob.maxX - blob.minX + 1, bh: blob.maxY - blob.minY + 1, count: blob.count } : null

  const g = blobs[1]
  if (!g) return { error: 'no green card', sizes: Object.fromEntries(Object.entries(blobs).map(([k, v]) => [k, pick(v)])) }

  const edges = []
  const { mask } = g
  for (let y = g.minY; y <= g.maxY; y++) {
    let lx = -1, rx = -1
    for (let x = g.minX; x <= g.maxX; x++) {
      if (mask[y * w + x]) { if (lx === -1) lx = x; rx = x }
    }
    if (lx !== -1) edges.push({ y: y - g.minY, lx: lx - g.minX, rx: rx - g.minX })
  }

  return {
    w, h, scanTop,
    green: pick(g), orange: pick(blobs[2]), blue: pick(blobs[3]), purple: pick(blobs[4]),
    bw: g.maxX - g.minX + 1, bh: g.maxY - g.minY + 1,
    silhouette: edges,
  }
})

console.log(JSON.stringify(result))
await browser.close()
