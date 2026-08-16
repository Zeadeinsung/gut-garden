import { chromium } from 'playwright-core'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const SHOT = 'D:/GutGardenBeta/.shots/home-current.png'
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage()
await page.goto('file:///' + SHOT.replace(/\\/g, '/'))
await page.waitForTimeout(300)
const r = await page.evaluate(() => {
  const img = document.querySelector('img')
  const w = img.naturalWidth, h = img.naturalHeight
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const x = c.getContext('2d'); x.drawImage(img, 0, 0)
  const d = x.getImageData(0, 0, w, h).data
  const px = (a, b) => { const i = (b*w+a)*4; return [d[i], d[i+1], d[i+2]] }
  const out = []
  for (let y = 730; y < 900; y += 2) {
    const cols = [320, 447, 600, 800, 1030].map((a) => { const p = px(a, y); return p[0]+','+p[1]+','+p[2] })
    out.push({ y, cols })
  }
  return out
})
for (const row of r) console.log(row.y, row.cols.join('  |  '))
await browser.close()
