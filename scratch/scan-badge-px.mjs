import { chromium } from 'playwright-core'

const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const SHOT = 'D:/GutGardenBeta/.shots/badge-el.png'

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage()
await page.goto('file:///' + SHOT.replace(/\\/g, '/'))
await page.waitForTimeout(300)

const info = await page.evaluate(() => {
  const img = document.querySelector('img')
  const w = img.naturalWidth, h = img.naturalHeight
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, w, h).data
  const px = (x, y) => { const i = (y * w + x) * 4; return [data[i], data[i+1], data[i+2]] }

  const isGreen = c => c[1] > 100 && c[1] > c[0] + 20 && c[1] > c[2] + 20
  const isGray = c => Math.abs(c[0]-c[1]) < 16 && Math.abs(c[1]-c[2]) < 16 && c[0] > 170 && c[0] < 240
  const isCream = c => c[0] > 240 && c[1] > 235 && c[2] > 210

  // mid height of circle row (bar is 164 tall, circles centered around y~30 in image)
  // scan rows to find circle row
  let circleRow = null
  for (let y = 5; y < h; y++) {
    let greens = 0, grays = 0
    for (let x = 0; x < w; x += 2) {
      const c = px(x, y)
      if (isGreen(c)) greens++
      else if (isGray(c)) grays++
    }
    if (greens + grays > 100) { circleRow = y; break }
  }

  // column profile at circleRow
  const col = []
  for (let x = 0; x < w; x++) {
    const c = px(x, circleRow)
    col.push({ x, c: isGreen(c) ? 'G' : isGray(c) ? 'Y' : isCream(c) ? '.' : 'x' })
  }

  // segment line detection between circle centers at circleRow
  const centers = []
  let cur = null
  for (let x = 0; x < w; x++) {
    const cls = col[x].c
    if (cls === 'G' || cls === 'Y') {
      if (!cur) cur = { x0: x, x1: x, g: cls === 'G' ? 1 : 0 }
      cur.x1 = x
      if (cls === 'G') cur.g++
    } else if (cur) {
      if (cur.x1 - cur.x0 > 20) centers.push({ cx: Math.round((cur.x0 + cur.x1) / 2), w: cur.x1 - cur.x0 + 1, greenPct: Math.round(cur.g / (cur.x1 - cur.x0 + 1) * 100) })
      cur = null
    }
  }
  if (cur && cur.x1 - cur.x0 > 20) centers.push({ cx: Math.round((cur.x0 + cur.x1) / 2), w: cur.x1 - cur.x0 + 1, greenPct: Math.round(cur.g / (cur.x1 - cur.x0 + 1) * 100) })

  // scan between circle centers for green line
  const segs = []
  for (let i = 0; i < centers.length - 1; i++) {
    const a = centers[i].cx, b = centers[i + 1].cx
    let green = 0, total = 0
    for (let x = a + 20; x <= b - 20; x++) {
      const c = px(x, circleRow)
      total++
      if (isGreen(c)) green++
    }
    segs.push({ a, b, greenPct: Math.round(green / total * 100) })
  }

  return { w, h, circleRow, centers, segs }
})

console.log(JSON.stringify(info, null, 1))
await browser.close()
