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
  const titles = ['探索花园', '每日打卡', '知识课堂', '成长徽章']
  return titles.map((t) => {
    const span = Array.from(document.querySelectorAll('span')).find((s) => s.textContent === t)
    if (!span) return { title: t, found: false }
    const btn = span.closest('button')
    const el = btn ? btn.parentElement : span
    const r = el.getBoundingClientRect()
    const arrows = Array.from(el.querySelectorAll('svg')).map((s) => {
      const sr = s.getBoundingClientRect()
      return { x: Math.round(sr.x), y: Math.round(sr.y), w: Math.round(sr.width), h: Math.round(sr.height) }
    })
    const titleColor = getComputedStyle(span).color
    const arrowBg = el.querySelector('div[style*="background"]')
    const arrowDiv = el.querySelector('div.absolute')
    return {
      title: t, found: true,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      titleColor, arrowCount: arrows.length, arrows,
      arrowBgStyle: arrowDiv ? arrowDiv.getAttribute('style') : null,
    }
  })
})
console.log(JSON.stringify(info, null, 1))
await browser.close()
