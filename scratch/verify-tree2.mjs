import { chromium } from 'playwright-core'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const BASE = 'http://localhost:3003'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1672, height: 941 } })
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await sleep(500)
await page.evaluate(() => {
  localStorage.clear()
  localStorage.setItem('gg-auth', JSON.stringify({
    state: {
      mode: 'guest',
      user: { parent_id: 0, phone: '', children: [{ id: 1, name: '小明', age: 6, avatar_url: null }], active_child_id: 1 },
      token: null, loading: false,
    }, version: 0,
  }))
  localStorage.setItem('gg-onboarding-done', '1')
})
await page.goto(`${BASE}/classroom`, { waitUntil: 'networkidle' })
await sleep(2000)
await page.keyboard.press('Control+e')
await sleep(600)

async function blockBox() {
  return page.evaluate(() => {
    const label = [...document.querySelectorAll('div')].find((el) => el.textContent?.trim().includes('knowledgeTree') && el.className && String(el.className).includes('cursor-grab'))
    if (!label) return null
    const b = label.parentElement.getBoundingClientRect()
    return { left: b.left, top: b.top, width: b.width, height: b.height }
  })
}

// 1) Drag from the label's BOTTOM half (below the Layout banner: banner bottom ~37, label bottom ~45)
const box = await blockBox()
console.log('block box:', JSON.stringify(box))
if (box) {
  const lx = box.left + 40
  const ly = box.top - 10 // 10px above block top => inside label, below banner (block top in edit ~45, so y ~35..)
  await page.mouse.move(lx, box.top - 15)
  await page.mouse.down()
  await page.mouse.move(lx + 100, box.top - 15 + 70, { steps: 10 })
  await page.mouse.up()
  await sleep(400)
}
console.log('after drag, block box:', JSON.stringify(await blockBox()))

// 2) Resize via se handle (bottom-right corner of the block)
const box2 = await blockBox()
if (box2) {
  const sx = box2.left + box2.width - 4
  const sy = box2.top + box2.height - 4
  await page.mouse.move(sx, sy)
  await page.mouse.down()
  await page.mouse.move(sx + 90, sy + 40, { steps: 8 })
  await page.mouse.up()
  await sleep(400)
}
console.log('after resize, block box:', JSON.stringify(await blockBox()))

await page.keyboard.press('Control+e')
await sleep(500)
const ls = await page.evaluate(() => {
  const raw = localStorage.getItem('gg-block-positions-classroom')
  const parsed = raw ? JSON.parse(raw) : null
  return parsed?.knowledgeTree ?? null
})
console.log('saved knowledgeTree:', JSON.stringify(ls))
await page.screenshot({ path: 'D:/GutGardenBeta/scratch/tree_final.png' })
await browser.close()
