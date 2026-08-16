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
await sleep(2500)

async function cardRect() {
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

console.log('NORMAL card:', JSON.stringify(await cardRect()))

// Enter edit mode
await page.keyboard.press('Control+e')
await sleep(600)

// In edit mode the DraggableBlock has a chrome label "⋮⋮ knowledgeTree". Drag from that label.
const label = page.locator('div', { hasText: 'knowledgeTree' }).last()
const lb = await label.boundingBox()
console.log('label bbox:', JSON.stringify(lb))

// The drag handle is the label div itself (it has onMouseDown). Drag by 120px right / 80px down.
if (lb) {
  await page.mouse.move(lb.x + lb.width / 2, lb.y + lb.height / 2)
  await page.mouse.down()
  await page.mouse.move(lb.x + lb.width / 2 + 120, lb.y + lb.height / 2 + 80, { steps: 10 })
  await page.mouse.up()
  await sleep(500)
}
console.log('EDIT after drag card:', JSON.stringify(await cardRect()))
await page.screenshot({ path: 'D:/GutGardenBeta/scratch/tree_dragged.png' })

// Resize using the se corner handle (bg-garden-coral rounded-full). Find it inside the block box.
const se = page.locator('.bg-garden-coral.rounded-full').last()
const sb = await se.boundingBox()
console.log('se handle bbox:', JSON.stringify(sb))
if (sb) {
  await page.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2)
  await page.mouse.down()
  await page.mouse.move(sb.x + sb.width / 2 + 80, sb.y + sb.height / 2 + 40, { steps: 8 })
  await page.mouse.up()
  await sleep(500)
}
console.log('EDIT after resize card:', JSON.stringify(await cardRect()))
await page.screenshot({ path: 'D:/GutGardenBeta/scratch/tree_resized.png' })

// Exit edit mode; verify persisted
await page.keyboard.press('Control+e')
await sleep(600)
console.log('NORMAL after drag+resize card:', JSON.stringify(await cardRect()))

const ls = await page.evaluate(() => {
  const raw = localStorage.getItem('gg-block-positions-classroom')
  const parsed = raw ? JSON.parse(raw) : null
  return parsed?.knowledgeTree ?? null
})
console.log('saved knowledgeTree:', JSON.stringify(ls))

await browser.close()
