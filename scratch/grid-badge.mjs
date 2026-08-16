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
  const grid = []
  for (let y = 0; y < h; y += 12) {
    const row = []
    for (let x = 0; x < w; x += 120) {
      const c = px(x, y)
      row.push(`${c[0]},${c[1]},${c[2]}`)
    }
    grid.push({ y, row })
  }
  return { w, h, grid }
})
console.log(JSON.stringify(info, null, 1))
await browser.close()
