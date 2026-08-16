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
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()
await page.addInitScript((auth) => {
  localStorage.setItem('gg-auth', JSON.stringify(auth))
  localStorage.setItem('gg-onboarding-done', '1')
  localStorage.removeItem('gg-block-positions-home')
}, GUEST_AUTH)
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 20000 })
await page.waitForTimeout(5000)

// scroll badge panel into view
await page.evaluate(() => {
  const title = Array.from(document.querySelectorAll('p')).find((p) => p.textContent === '花园成长进度')
  const panel = title.closest('div[class*="h-full"]')
  panel.scrollIntoView({ block: 'center' })
})
await page.waitForTimeout(500)

const result = await page.evaluate(() => {
  const cs = (el) => el ? getComputedStyle(el) : null
  const all = Array.from(document.querySelectorAll('*'))
  const title = all.find((e) => e.textContent === '花园成长进度')
  const panel = title.closest('div[class*="h-full"]')
  const circles = Array.from(panel.querySelectorAll('span[class*="w-[36px]"]'))
  const segs = Array.from(panel.querySelectorAll('div[class*="h-[5px]"]')).filter((d) => d.className.includes('z-10'))
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } }
  return {
    panelRect: rect(panel),
    center: Math.round(rect(panel).x + rect(panel).w / 2),
    circles: circles.map((c) => ({ w: rect(c).w, h: rect(c).h })),
    nConnectorSegments: segs.length,
    firstSegBg: segs[0] ? cs(segs[0]).backgroundImage.slice(0, 60) : null,
  }
})
console.log(JSON.stringify(result, null, 1))

const box = await page.evaluate(() => {
  const title = Array.from(document.querySelectorAll('p')).find((p) => p.textContent === '花园成长进度')
  const panel = title.closest('div[class*="h-full"]')
  const r = panel.getBoundingClientRect()
  return { x: r.x, y: r.y, width: r.width, height: r.height }
})
await page.screenshot({ path: 'D:/GutGardenBeta/.shots/badge-v3.png', clip: box })
console.log('saved badge-v3.png', JSON.stringify(box))
await browser.close()
