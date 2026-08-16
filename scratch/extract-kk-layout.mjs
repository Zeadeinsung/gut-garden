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
  const px = (x, y) => { const i = (y * w + x) * 4; return [data[i], data[i+1], data[i+2], data[i+3]] }

  // Identify the 4 kingkong cards via colored borders/edges. Report the overall image dims
  // and sample specific pixel colors at key locations.
  const out = { w, h }

  // Find distinct regions: look for saturated accent colors (green/orange/blue/purple) per card.
  // Scan a horizontal line across the middle-top to find card boundaries by border color.
  const yProbe = Math.floor(h * 0.30)
  const runs = []
  let cur = null
  const isBorder = (c) => {
    const [r, g, b] = c
    // any saturated-ish color distinct from white/cream
    return Math.max(r, g, b) - Math.min(r, g, b) > 40
  }
  for (let x = 0; x < w; x++) {
    const c = px(x, yProbe)
    if (isBorder(c)) { if (!cur) cur = { s: x, col: c.slice(0,3) }; cur.e = x }
    else { if (cur) { runs.push(cur); cur = null } }
  }
  if (cur) runs.push(cur)
  out.borderRuns_y30 = runs

  // probe text rows: sample average color in bands per card
  // Find each card's x-range from the runs
  const cards = runs.map(r => ({ x0: r.s - 6, x1: r.e + 6 }))
  out.cards = cards

  // For each card, sample a grid to find colored title text pixels
  out.titleProbe = {}
  cards.forEach((c, ci) => {
    const cx0 = c.x0, cx1 = c.x1
    const bandY0 = Math.floor(h * 0.30), bandY1 = Math.floor(h * 0.55)
    // find rows containing saturated colored pixels (the title)
    const rows = []
    for (let y = bandY0; y < bandY1; y++) {
      let cnt = 0, colSum = [0, 0, 0]
      for (let x = cx0 + 4; x < cx1 - 4; x++) {
        const c = px(x, y)
        if (Math.max(c[0],c[1],c[2]) - Math.min(c[0],c[1],c[2]) > 50) { cnt++; colSum[0]+=c[0]; colSum[1]+=c[1]; colSum[2]+=c[2] }
      }
      if (cnt > 3) rows.push({ y, cnt, avg: colSum.map(v => Math.round(v / cnt)) })
    }
    out.titleProbe['card' + (ci + 1)] = { x0: cx0, x1: cx1, rows: rows.slice(0, 40) }
  })

  return out
})

console.log(JSON.stringify(result, null, 1))
await browser.close()
