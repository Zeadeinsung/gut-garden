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

// What's at the label center?
const hit = await page.evaluate(() => {
  const label = [...document.querySelectorAll('div')].find((el) => el.textContent?.trim().includes('knowledgeTree') && el.className && String(el.className).includes('cursor-grab'))
  if (!label) return { error: 'label not found' }
  const r = label.getBoundingClientRect()
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  const el = document.elementFromPoint(cx, cy)
  const block = label.parentElement
  return {
    label: { left: r.left, top: r.top, w: r.width, h: r.height },
    atPoint: el ? { tag: el.tagName, cls: String(el.className).slice(0, 60) } : null,
    blockBefore: block ? block.getAttribute('style') : null,
  }
})
console.log('hit:', JSON.stringify(hit, null, 2))

// Now try the drag and watch inline style
const label = page.locator('div', { hasText: 'knowledgeTree' }).last()
const lb = await label.boundingBox()
await page.mouse.move(lb.x + lb.width / 2, lb.y + lb.height / 2)
await page.mouse.down()
await sleep(200)
const midDrag = await page.evaluate(() => {
  const label = [...document.querySelectorAll('div')].find((el) => el.textContent?.trim().includes('knowledgeTree') && el.className && String(el.className).includes('cursor-grab'))
  const block = label ? label.parentElement : null
  return { blockDuringDrag: block ? block.getAttribute('style') : null }
})
console.log('midDrag block style:', JSON.stringify(midDrag, null, 2))
await page.mouse.move(lb.x + lb.width / 2 + 120, lb.y + lb.height / 2 + 80, { steps: 10 })
await sleep(200)
const afterMove = await page.evaluate(() => {
  const label = [...document.querySelectorAll('div')].find((el) => el.textContent?.trim().includes('knowledgeTree') && el.className && String(el.className).includes('cursor-grab'))
  const block = label ? label.parentElement : null
  return { blockAfterMove: block ? block.getAttribute('style') : null }
})
console.log('afterMove block style:', JSON.stringify(afterMove, null, 2))
await page.mouse.up()
await sleep(300)
const afterUp = await page.evaluate(() => {
  const label = [...document.querySelectorAll('div')].find((el) => el.textContent?.trim().includes('knowledgeTree') && el.className && String(el.className).includes('cursor-grab'))
  const block = label ? label.parentElement : null
  return { blockAfterUp: block ? block.getAttribute('style') : null }
})
console.log('afterUp block style:', JSON.stringify(afterUp, null, 2))

await browser.close()
