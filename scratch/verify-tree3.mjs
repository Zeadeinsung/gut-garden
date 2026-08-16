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

console.log('NORMAL card (should be ~1133,24):', JSON.stringify(await cardRect(page)))
await page.keyboard.press('Control+e')
await sleep(600)

// elementFromPoint at the label center & se handle
const hits = await page.evaluate(() => {
  const label = [...document.querySelectorAll('div')].find((el) => el.textContent?.trim().includes('knowledgeTree') && el.className && String(el.className).includes('cursor-grab'))
  if (!label) return { error: 'no label' }
  const box = label.parentElement
  const lr = label.getBoundingClientRect()
  const se = box.querySelector('.bg-garden-coral.rounded-full')
  const sr = se.getBoundingClientRect()
  const hit = (x, y) => { const el = document.elementFromPoint(x, y); return el ? { tag: el.tagName, cls: String(el.className).slice(0, 50) } : null }
  return {
    labelCenter: hit(lr.left + lr.width / 2, lr.top + lr.height / 2),
    seCenter: hit(sr.left + sr.width / 2, sr.top + sr.height / 2),
    labelRect: { left: Math.round(lr.left), top: Math.round(lr.top), w: Math.round(lr.width), h: Math.round(lr.height) },
    seRect: { left: Math.round(sr.left), top: Math.round(sr.top), w: Math.round(sr.width), h: Math.round(sr.height) },
  }
})
console.log('hits:', JSON.stringify(hits, null, 2))

// DRAG via label center
const label = page.locator('div', { hasText: 'knowledgeTree' }).last()
const lb = await label.boundingBox()
await page.mouse.move(lb.x + lb.width / 2, lb.y + lb.height / 2)
await page.mouse.down()
await page.mouse.move(lb.x + lb.width / 2 + 150, lb.y + lb.height / 2 + 90, { steps: 12 })
await page.mouse.up()
await sleep(500)
console.log('EDIT after drag card:', JSON.stringify(await cardRect(page)))

// RESIZE via se handle
const se = await page.evaluate(() => {
  const label = [...document.querySelectorAll('div')].find((el) => el.textContent?.trim().includes('knowledgeTree') && el.className && String(el.className).includes('cursor-grab'))
  const se = label?.parentElement?.querySelector('.bg-garden-coral.rounded-full')
  if (!se) return null
  const r = se.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
})
if (se) {
  await page.mouse.move(se.x, se.y)
  await page.mouse.down()
  await page.mouse.move(se.x + 80, se.y + 40, { steps: 8 })
  await page.mouse.up()
  await sleep(500)
}
console.log('EDIT after resize card:', JSON.stringify(await cardRect(page)))

await page.keyboard.press('Control+e')
await sleep(500)
console.log('NORMAL after drag+resize card:', JSON.stringify(await cardRect(page)))
const ls = await page.evaluate(() => {
  const raw = localStorage.getItem('gg-block-positions-classroom')
  const parsed = raw ? JSON.parse(raw) : null
  return parsed?.knowledgeTree ?? null
})
console.log('saved knowledgeTree:', JSON.stringify(ls))
await page.screenshot({ path: 'D:/GutGardenBeta/scratch/tree_final.png' })
await browser.close()

async function cardRect(page) {
  return page.evaluate(() => {
    const p = [...document.querySelectorAll('p')].find((el) => el.textContent?.includes('知识树成长'))
    if (!p) return null
    let el = p
    for (let i = 0; i < 6 && el; i++) {
      el = el.parentElement
      if (el && el.className && String(el.className).includes('rounded-[24px]')) break
    }
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) }
  })
}
