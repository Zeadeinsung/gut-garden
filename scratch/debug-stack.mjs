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

const info = await page.evaluate(() => {
  const label = [...document.querySelectorAll('div')].find((el) => el.textContent?.trim().includes('knowledgeTree') && el.className && String(el.className).includes('cursor-grab'))
  if (!label) return { error: 'no label' }
  const box = label.parentElement
  const lr = label.getBoundingClientRect()
  const cx = lr.left + lr.width / 2, cy = lr.top + lr.height / 2

  // The full hit stack at label center
  const stack = document.elementsFromPoint(cx, cy).map((el) => ({
    tag: el.tagName,
    cls: String(el.className).slice(0, 55),
    style: el.getAttribute('style')?.slice(0, 80) ?? null,
  }))

  // Walk up from the block to the frame, capture stacking-relevant computed styles
  const chain = []
  let el = box
  for (let i = 0; i < 12 && el; i++) {
    const cs = getComputedStyle(el)
    chain.push({
      tag: el.tagName,
      cls: String(el.className).slice(0, 50),
      position: cs.position,
      zIndex: cs.zIndex,
      opacity: cs.opacity,
      overflow: cs.overflow,
      transform: cs.transform !== 'none' ? 'Y' : 'N',
    })
    el = el.parentElement
  }
  return { stack, chain }
})
console.log(JSON.stringify(info, null, 2))
await browser.close()
