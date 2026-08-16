import { chromium } from 'playwright-core'

const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const SHOT = 'D:/GutGardenBeta/.shots/home-current.png'

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage()
await page.goto('file:///' + SHOT.replace(/\\/g, '/'))
await page.waitForTimeout(300)

const result = await page.evaluate(() => {
  const img = document.querySelector('img')
  const w = img.naturalWidth, h = img.naturalHeight
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, w, h).data
  const px = (x, y) => { const i = (y * w + x) * 4; return [data[i], data[i+1], data[i+2]] }

  // Cards at 1280 canvas: x=300/486/672/858, w=174, h=198, y=448
  // Arrow at bottom-right: right-[9px] bottom-[9px], 22px box → within each card:
  // arrow center ≈ (cardX + w - 9 - 11, cardY + h - 9 - 11)
  const cards = [
    { name: '探索花园', x: 300, expect: 'green' },
    { name: '每日打卡', x: 486, expect: 'orange' },
    { name: '知识课堂', x: 672, expect: 'blue' },
    { name: '成长徽章', x: 858, expect: 'purple' },
  ]
  const out = []
  for (const c of cards) {
    const ax = c.x + 174 - 9 - 11, ay = 448 + 198 - 9 - 11
    // sample a 4x4 grid inside the arrow box
    const colors = []
    for (let dy = -6; dy <= 6; dy += 4) for (let dx = -6; dx <= 6; dx += 4) {
      colors.push(px(ax + dx, ay + dy))
    }
    out.push({ card: c.name, arrowCenter: [ax, ay], samples: colors })
  }
  return out
})

console.log(JSON.stringify(result, null, 1))
await browser.close()
