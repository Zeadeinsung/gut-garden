import { chromium } from 'playwright-core'
import { pathToFileURL } from 'node:url'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const REF = 'D:/GutGardenBeta/.tokenicode/tmp/d64ffc3b0ffe0d145a43a8eb6fdbd73_17859188931385.png'
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage()
await page.goto(pathToFileURL(REF).href)
await page.waitForTimeout(500)
const out = await page.evaluate(() => {
  const img = document.querySelector('img')
  const w = img.naturalWidth, h = img.naturalHeight
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0)
  const d = ctx.getImageData(0, 0, w, h).data
  const px = (x, y) => { const i = (y*w+x)*4; return [d[i], d[i+1], d[i+2]] }
  const rows = []
  // horizontal line y=780 from x=340 to x=1340
  const hz = []
  for (let x = 340; x <= 1340; x += 20) hz.push([x, px(x, 780).join(',')])
  rows.push('HORIZONTAL y=780: ' + hz.map(v => v.join('=')).join(' '))
  // vertical line x=542 (card1 center) from y=560 to y=930
  const vt = []
  for (let y = 560; y <= 930; y += 10) vt.push([y, px(542, y).join(',')])
  rows.push('VERTICAL x=542: ' + vt.map(v => v.join('=')).join(' '))
  // vertical line x=718 (card2 center) from y=560 to y=930
  const vt2 = []
  for (let y = 560; y <= 930; y += 10) vt2.push([y, px(718, y).join(',')])
  rows.push('VERTICAL x=718: ' + vt2.map(v => v.join('=')).join(' '))
  return rows.join('\n')
})
console.log(out)
await browser.close()
