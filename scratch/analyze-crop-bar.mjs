import { chromium } from 'playwright-core'

const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const SHOT = 'D:/GutGardenBeta/.shots/ref-badgebar.png'

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

  // Bar occupies y 24..119 (crop). Scan x 40..1510
  const y0 = 24, y1 = 119
  const midY = Math.round((y0+y1)/2) // ~71

  // Classifiers (colors known from sample: bg cream #FBF6E4)
  const isYellow = c => c[0]>215 && c[1]>160 && c[2]<140 && c[1]>c[2]+60
  const isGray = c => Math.abs(c[0]-c[1])<16 && Math.abs(c[1]-c[2])<16 && c[0]>150 && c[0]<235
  const isGreen = c => c[1]>100 && c[1]>c[0]+25 && c[1]>c[2]+25
  const isOrange = c => c[0]>200 && c[1]>90 && c[1]<200 && c[2]<130 && c[0]>c[2]+80

  // Build column profile for circle detection
  const colProfile = []
  for (let x = 40; x < w; x++) {
    let yl=0, gr=0, gn=0
    for (let y = y0; y <= y1; y++) {
      const c = px(x,y)
      if (isYellow(c)) yl++
      else if (isGray(c)) gr++
      else if (isGreen(c)) gn++
    }
    colProfile.push({ x, yl, gr, gn })
  }

  // Circle clusters: columns where (yl+gr+gn) > 14 (a ~32px circle spans ~25px wide)
  const clusters = []
  let cur = null
  for (const p of colProfile) {
    const active = p.yl + p.gr + p.gn > 12
    if (active) {
      if (!cur) cur = { x0: p.x, x1: p.x, yl:0, gr:0, gn:0 }
      cur.x1 = p.x; cur.yl += p.yl; cur.gr += p.gr; cur.gn += p.gn
    } else if (cur) { clusters.push(cur); cur = null }
  }
  if (cur) clusters.push(cur)
  const circles = clusters.filter(cl => (cl.x1-cl.x0) >= 14 && (cl.x1-cl.x0) <= 70).map(cl => ({
    cx: Math.round((cl.x0+cl.x1)/2), x0: cl.x0, x1: cl.x1, w: cl.x1-cl.x0+1,
    yl: cl.yl, gr: cl.gr, gn: cl.gn,
    dominant: cl.yl > cl.gr && cl.yl > cl.gn ? 'yellow' : cl.gn > cl.gr ? 'green' : 'gray',
  }))

  // Find horizontal connecting line segments between consecutive circles
  const segs = []
  for (let i = 0; i < circles.length-1; i++) {
    const a = circles[i].cx, b = circles[i+1].cx
    let active = [], yl = []
    for (let x = a+16; x <= b-16; x++) {
      let any = false, hasY = false
      for (let y = midY-14; y <= midY+14; y++) {
        const c = px(x,y)
        if (isYellow(c) && !hasY) hasY = true
        if (isYellow(c) || isGreen(c) || isGray(c)) { any = true; break }
      }
      if (any) active.push(x)
      if (hasY) yl.push(x)
    }
    segs.push({ from: i, to: i+1, cxA: a, cxB: b, gap: b-a, activeCount: active.length, yellowCount: yl.length, activeStart: active[0] ?? null, activeEnd: active[active.length-1] ?? null, yellowStart: yl[0] ?? null, yellowEnd: yl[yl.length-1] ?? null })
  }

  // Text regions: left title block, sample dark text pixels in x 60..180
  const leftText = []
  for (let y = y0+4; y <= y1-4; y += 2) {
    let dark = 0
    for (let x = 50; x < 200; x++) {
      const c = px(x,y)
      if (c[0]<130 && c[1]<130 && c[2]<130) dark++
    }
    if (dark > 0) leftText.push({ y, dark })
  }
  // orange text pixels in left block
  const leftOrange = []
  for (let y = y0; y <= y1; y++) for (let x = 50; x < 230; x++) {
    const c = px(x,y)
    if (isOrange(c)) { leftOrange.push({x,y}); break }
  }

  // Right block: find orange/dark pixels from x=1100
  const rightBlocks = []
  for (let x = 1100; x < w-20; x++) {
    let or=0, dark=0
    for (let y = y0; y <= y1; y++) {
      const c = px(x,y)
      if (isOrange(c)) or++
      else if (c[0]<110 && c[1]<110 && c[2]<110) dark++
    }
    if (or+dark > 2) rightBlocks.push({ x, or, dark })
  }
  const rightX0 = rightBlocks.length ? rightBlocks[0].x : null
  const rightX1 = rightBlocks.length ? rightBlocks[rightBlocks.length-1].x : null

  return {
    size: [w,h], barMidY: midY,
    circles,
    segs,
    leftTextRows: leftText.length, leftTextTop: leftText.length ? leftText[0].y : null, leftTextBottom: leftText.length ? leftText[leftText.length-1].y : null,
    leftOrangeCount: leftOrange.length,
    rightX0, rightX1,
  }
})

console.log(JSON.stringify(info, null, 1))
await browser.close()
