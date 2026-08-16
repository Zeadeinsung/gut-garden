import { chromium } from 'playwright-core'

const BASE = 'http://localhost:3000'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const GUEST_AUTH = {
  state: {
    mode: 'guest',
    user: { parent_id: 0, phone: '', children: [{ id: 1, name: '小园丁', age: 6, avatar_url: null }], active_child_id: 1 },
    token: null, loading: false,
  }, version: 0,
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
await page.addInitScript((auth) => {
  localStorage.setItem('gg-auth', JSON.stringify(auth))
  localStorage.setItem('gg-onboarding-done', '1')
  localStorage.removeItem('gg-block-positions-home')
}, GUEST_AUTH)
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 20000 })
await page.waitForTimeout(4000)

const box = await page.evaluate(() => {
  const label = Array.from(document.querySelectorAll('span')).find((s) => s.textContent === '幼苗期')
  let cur = label
  for (let i = 0; i < 6 && cur; i++) {
    const cls = cur.className
    if (typeof cls === 'string' && cls.includes('h-full') && cls.includes('flex items-center')) return (() => { const r = cur.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height } })()
    cur = cur.parentElement
  }
  return null
})
if (!box) { console.log('NOT FOUND'); process.exit(1) }
console.log('box:', JSON.stringify(box))
await page.screenshot({ path: 'D:/GutGardenBeta/.shots/badge-el.png', clip: { x: box.x, y: box.y, width: box.width, height: box.height } })
console.log('saved badge-el.png')
await browser.close()
