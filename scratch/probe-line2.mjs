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
  // Find all divs whose className mentions h-[4px]
  const all = Array.from(document.querySelectorAll('div'))
  const segs = all.filter((d) => d.className && typeof d.className === 'string' && d.className.includes('h-[4px]'))
  const out = segs.map((s) => {
    const cs = getComputedStyle(s)
    const r = s.getBoundingClientRect()
    return { cls: s.className, bg: cs.backgroundColor, x: Math.round(r.x), w: Math.round(r.width), parent: s.parentElement?.className?.slice(0, 50) }
  })
  // Also test a manually-created element
  const probe = document.createElement('div')
  probe.className = 'bg-[#8BC34A]'
  document.body.appendChild(probe)
  const pcs = getComputedStyle(probe)
  out.push({ probeBg: pcs.backgroundColor })
  // test bg-[#4CAF50]
  const probe2 = document.createElement('div')
  probe2.className = 'bg-[#4CAF50]'
  document.body.appendChild(probe2)
  out.push({ probe2Bg: getComputedStyle(probe2).backgroundColor })
  return out
})
console.log(JSON.stringify(info, null, 1))
await browser.close()
