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
  const px = (x, y) => { const i = (y * w + x) * 4; return [data[i], data[i+1], data[i+2]] }

  // ASCII render of band: y 540..940, x 250..1500, cell 24x20
  const X0 = 250, Y0 = 540, CX = 24, CY = 20
  const rows = []
  for (let y = Y0; y < h; y += CY) {
    let line = ''
    for (let x = X0; x < 1500; x += CX) {
      // average color in cell
      let r = 0, g = 0, b = 0, n = 0
      for (let dy = 0; dy < CY; dy += 4) for (let dx = 0; dx < CX; dx += 4) {
        const c = px(x + dx, y + dy); r += c[0]; g += c[1]; b += c[2]; n++
      }
      r = r / n; g = g / n; b = b / n
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
      let ch = '.'
      if (mx < 200) ch = '#'                      // dark content
      else if (mx - mn < 12) ch = ' '            // near-white/neutral
      else if (r > g && r > b) ch = 'O'          // orange
      else if (g > r && g > b) ch = 'G'          // green
      else if (b > r && b > g) ch = 'B'          // blue
      else if (r > 120 && b > 120) ch = 'P'      // purple
      line += ch
    }
    rows.push(line + '  y=' + y)
  }
  return rows.join('\n')
})

console.log(result)
await browser.close()
