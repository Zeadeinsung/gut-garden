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
  const els = Array.from(document.querySelectorAll('*'))
  const find = (text) => {
    const span = els.find((e) => e.textContent === text)
    if (!span) return null
    const r = span.closest('div')
    const rect = (r || span).getBoundingClientRect()
    return { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) }
  }
  return {
    title: find('花园成长进度'),
    sub: find('已成长'),
    right: find('下一份惊喜'),
    circles: Array.from(document.querySelectorAll('span[class*="rounded-full"]'))
      .map((s) => { const r = s.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), cls: s.className.slice(0, 60) } })
      .filter((r) => r.w >= 30 && r.w <= 45 && r.h >= 30 && r.h <= 45),
  }
})
console.log(JSON.stringify(info, null, 1))
await browser.close()
