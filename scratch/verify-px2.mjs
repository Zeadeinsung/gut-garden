import { chromium } from 'playwright-core'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const SHOT = 'D:/GutGardenBeta/.shots/badge-final.png'
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage()
await page.goto('file:///' + SHOT.replace(/\\/g, '/'))
await page.waitForTimeout(200)
const r = await page.evaluate(() => {
  const img = document.querySelector('img')
  const w = img.naturalWidth, h = img.naturalHeight
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const x = c.getContext('2d'); x.drawImage(img, 0, 0)
  const d = x.getImageData(0, 0, w, h).data
  const px = (a, b) => { const i = (b*w+a)*4; return [d[i], d[i+1], d[i+2]] }
  const isGreen = c2 => c2[1] > 100 && c2[1] > c2[0]+20 && c2[1] > c2[2]+20
  const isGray = c2 => Math.abs(c2[0]-c2[1]) < 18 && Math.abs(c2[1]-c2[2]) < 18 && c2[0] > 170 && c2[0] < 245
  // circle centers: cx 149..590, circles ~36px tall → center rows ~16..52, center ~34
  const out = []
  for (let y = 25; y <= 45; y += 2) {
    const segs = []
    const pairs = [[149,237],[237,325],[325,414],[414,502],[502,590]]
    for (const [a, b] of pairs) {
      let g=0, t=0
      for (let q = a+18; q <= b-18; q++) { t++; if (isGreen(px(q,y))) g++ }
      segs.push(t ? Math.round(g/t*100) : 0)
    }
    out.push({ y, segs })
  }
  return out
})
console.log(JSON.stringify(r, null, 1))
await browser.close()
