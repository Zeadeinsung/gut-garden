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
  const out = {}
  // Find the chrome label div whose text is exactly-ish the knowledgeTree handle
  const labels = [...document.querySelectorAll('div')].filter((el) => el.className && String(el.className).includes('cursor-grab') && el.textContent?.includes('knowledgeTree'))
  out.labelCount = labels.length
  const label = labels[0]
  if (label) {
    const box = label.parentElement
    const br = box.getBoundingClientRect()
    out.boxStyle = box.getAttribute('style')
    out.boxRect = { left: br.left, top: br.top, right: br.right, bottom: br.bottom, w: br.width, h: br.height }
    // List all children of the box with their classes/rects
    out.boxChildren = [...box.children].map((c) => {
      const r = c.getBoundingClientRect()
      return { cls: String(c.className).slice(0, 60), left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }
    })
    // se handle
    const se = box.querySelector('.bg-garden-coral.rounded-full')
    if (se) {
      const r = se.getBoundingClientRect()
      out.seHandle = { left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: r.width, h: r.height }
      // elementFromPoint at se center
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2
      const el = document.elementFromPoint(cx, cy)
      out.seHit = el ? { tag: el.tagName, cls: String(el.className).slice(0, 60) } : null
    }
  }
  return out
})
console.log(JSON.stringify(info, null, 2))
await browser.close()
