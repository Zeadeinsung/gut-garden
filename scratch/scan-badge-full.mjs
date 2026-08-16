import { chromium } from 'playwright-core'

const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const SHOT = 'D:/GutGardenBeta/.shots/home-current.png'

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

  const isGreen = c => c[1] > 90 && c[1] > c[0] + 15 && c[1] > c[2] + 15
  const isGray = c => Math.abs(c[0]-c[1]) < 18 && Math.abs(c[1]-c[2]) < 18 && c[0] > 170 && c[0] < 245
  const isCream = c => c[0] > 242 && c[1] > 237 && c[2] > 215

  // Find the cream bar row band in bottom region y 700..900
  const rowStats = []
  for (let y = 700; y < 900; y += 2) {
    let cream = 0, green = 0
    for (let x = 320; x < 1030; x += 3) {
      const c = px(x, y)
      if (isCream(c)) cream++
      else if (isGreen(c)) green++
    }
    rowStats.push({ y, cream, green })
  }
  // rows dominated by cream = the bar
  const barRows = rowStats.filter(r => r.cream > 140).map(r => r.y)
  const barTop = Math.min(...barRows), barBottom = Math.max(...barRows)
  const midY = Math.round((barTop + barBottom) / 2)

  // circle detection along midY within bar
  const circleCols = []
  for (let x = 340; x < 1030; x++) {
    const c = px(x, midY)
    if (isGreen(c) || isGray(c)) circleCols.push(x)
  }
  // cluster consecutive columns
  const clusters = []
  let cur = null
  for (const x of circleCols) {
    if (cur && x - cur.x1 <= 3) cur.x1 = x
    else { if (cur) clusters.push(cur); cur = { x0: x, x1: x } }
  }
  if (cur) clusters.push(cur)
  const circles = clusters
    .filter(cl => cl.x1 - cl.x0 >= 20)
    .map(cl => ({ cx: Math.round((cl.x0 + cl.x1) / 2), w: cl.x1 - cl.x0 + 1, color: (() => { const c = px(Math.round((cl.x0+cl.x1)/2), midY); return isGreen(c) ? 'green' : isGray(c) ? 'gray' : 'other' })() }))

  // connector line scan between first two circles
  const segs = []
  for (let i = 0; i < circles.length - 1; i++) {
    const a = circles[i].cx, b = circles[i+1].cx
    let g = 0, t = 0
    for (let x = a + 16; x <= b - 16; x++) { const c = px(x, midY); t++; if (isGreen(c)) g++ }
    segs.push({ a, b, greenPct: t ? Math.round(g / t * 100) : 0 })
  }

  return { w, h, barTop, barBottom, barH: barBottom - barTop, midY, circles, segs }
})

console.log(JSON.stringify(info, null, 1))
await browser.close()
