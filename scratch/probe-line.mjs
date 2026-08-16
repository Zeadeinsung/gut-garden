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
await page.waitForTimeout(4000)

const info = await page.evaluate(() => {
  const garden = localStorage.getItem('gg-garden')
  // find the badge panel's stage label '幼苗期' to locate the bar
  const label = Array.from(document.querySelectorAll('span')).find((s) => s.textContent === '幼苗期')
  const segs = label ? Array.from(label.closest('div').querySelectorAll('div[class*="h-[4px]"]')) : []
  const out = {
    ggGarden: garden,
    segCount: segs.length,
    segs: segs.map((s) => {
      const cls = s.className
      const cs = getComputedStyle(s)
      const r = s.getBoundingClientRect()
      return { cls, bg: cs.backgroundColor, x: Math.round(r.x), w: Math.round(r.width) }
    }),
  }
  // check if bg-[#8BC34A] rule exists in stylesheets
  out.hasGreenRule = Array.from(document.styleSheets).some((ss) => {
    try { return Array.from(ss.cssRules).some((r) => r.selectorText && r.selectorText.includes('#8BC34A')) } catch { return false }
  })
  return out
})
console.log(JSON.stringify(info, null, 1))
await browser.close()
