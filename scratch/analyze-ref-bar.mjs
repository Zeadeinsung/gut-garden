import { chromium } from 'playwright-core'

const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const REF = 'D:/GutGardenBeta/.tokenicode/tmp/d64ffc3b0ffe0d145a43a8eb6fdbd73_17864446977911.png'

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage()
await page.goto('file:///' + REF.replace(/\\/g, '/'))
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
  const isCream = c => Math.abs(c[0]-248)<14 && Math.abs(c[1]-245)<14 && Math.abs(c[2]-230)<16
  const isYellow = c => c[0]>220 && c[1]>180 && c[2]<120 && c[1]>c[2]+80
  const isGray = c => Math.abs(c[0]-224)<20 && Math.abs(c[1]-224)<20 && Math.abs(c[2]-224)<20
  const isGreen = c => c[1]>100 && c[1]>c[0]+20 && c[1]>c[2]+20
  const isOrange = c => c[0]>220 && c[1]>110 && c[1]<190 && c[2]<110 && c[0]>c[2]+120

  // Scan bottom third for the bar (row profile of cream coverage)
  let barRows = []
  for (let y = Math.floor(h*0.7); y < h; y++) {
    let cnt = 0
    for (let x = 100; x < w-100; x += 4) if (isCream(px(x,y))) cnt++
    barRows.push({ y, cnt })
  }
  const creamYs = barRows.filter(r => r.cnt > 100).map(r => r.y)
  const barTop = Math.min(...creamYs), barBottom = Math.max(...creamYs)

  // Column profile within bar to find left text block, circles, right block
  const barY0 = barTop, barY1 = barBottom
  const midY = Math.round((barY0 + barY1)/2)
  const colProfile = []
  for (let x = 0; x < w; x++) {
    let yellow = 0, gray = 0, green = 0, cream = 0, orange = 0
    for (let y = barY0; y <= barY1; y++) {
      const c = px(x, y)
      if (isYellow(c)) yellow++
      else if (isGray(c)) gray++
      else if (isGreen(c)) green++
      else if (isOrange(c)) orange++
      else if (isCream(c)) cream++
    }
    colProfile.push({ x, yellow, gray, green, orange, cream })
  }

  // Find circle clusters: columns with high yellow or gray count
  const clusters = []
  let cur = null
  for (const p of colProfile) {
    const active = p.yellow > 10 || p.gray > 10
    if (active) { if (!cur) cur = { x0: p.x, x1: p.x, yYellow: 0, yGray: 0, yGreen: 0 }; cur.x1 = p.x; cur.yYellow += p.yellow; cur.yGray += p.gray; cur.yGreen += p.green }
    else if (cur) { clusters.push(cur); cur = null }
  }
  if (cur) clusters.push(cur)
  const circles = clusters
    .filter(cl => (cl.x1 - cl.x0) > 18 && (cl.x1 - cl.x0) < 60)
    .map(cl => ({ cx: Math.round((cl.x0+cl.x1)/2), w: cl.x1-cl.x0+1, yellow: cl.yYellow, gray: cl.yGray, green: cl.yGreen }))

  // Find connecting line between circle 1 and 2: columns between them with yellow at mid height
  const circleCenters = circles.map(c => c.cx)
  let lineSegments = []
  for (let i = 0; i < circleCenters.length - 1; i++) {
    const a = circleCenters[i], b = circleCenters[i+1]
    let yellowPts = []
    for (let x = a + 20; x <= b - 20; x++) {
      let has = false
      for (let y = midY - 12; y <= midY + 12; y++) if (isYellow(px(x,y))) { has = true; break }
      if (has) yellowPts.push(x)
    }
    lineSegments.push({ from: i, to: i+1, start: yellowPts[0] ?? null, end: yellowPts[yellowPts.length-1] ?? null, count: yellowPts.length })
  }

  // Find right orange text + house icon region
  const rightBlock = colProfile.slice(Math.round(w*0.7)).filter(p => p.orange > 3 || p.green > 3)

  return {
    imgSize: [w, h],
    barTop, barBottom, barHeight: barBottom - barTop,
    barMidY: midY,
    circles,
    lineSegments,
    rightColX0: rightBlock.length ? rightBlock[0].x : null,
    rightColX1: rightBlock.length ? rightBlock[rightBlock.length-1].x : null,
  }
})

console.log(JSON.stringify(info, null, 1))
await browser.close()
