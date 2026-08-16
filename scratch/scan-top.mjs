import { chromium } from 'playwright-core'
import { pathToFileURL } from 'node:url'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const REF = 'D:/GutGardenBeta/.tokenicode/tmp/d64ffc3b0ffe0d145a43a8eb6fdbd73_17859188931385.png'
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage()
await page.goto(pathToFileURL(REF).href)
await page.waitForTimeout(400)
const out = await page.evaluate(() => {
  const img = document.querySelector('img'); const w = img.naturalWidth, h = img.naturalHeight
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0)
  const d = ctx.getImageData(0, 0, w, h).data
  const px = (x, y) => { const i = (y*w+x)*4; return [d[i], d[i+1], d[i+2]] }
  const rows = []
  // scan card1 top rows y=596..632, find leftmost/rightmost non-cream per row
  const isCard = (c) => c[1] > c[0] + 4 && c[1] > c[2] + 8  // greenish
  for (let y = 596; y <= 632; y++) {
    let l = -1, r = -1
    for (let x = 397; x <= 594; x++) { if (isCard(px(x,y))) { if (l===-1) l=x; r=x } }
    rows.push(y + ': ' + l + '-' + r + ' w=' + (r-l))
  }
  return rows.join('\n')
})
console.log(out)
await browser.close()
