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
  const all = Array.from(document.querySelectorAll('*'))
  const title = all.find((e) => e.textContent === '花园成长进度')
  // bar container = nearest ancestor with h-full class
  let bar = title
  while (bar && !(typeof bar.className === 'string' && bar.className.includes('h-full'))) bar = bar.parentElement
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), bottom: Math.round(r.bottom) } }
  const circles = Array.from(document.querySelectorAll('span[class*="w-[36px]"]')).map(rect)
  const labels = Array.from(document.querySelectorAll('span')).filter((s) => ['幼苗期','成长期','繁荣期','茂盛期','丰收期','守护期'].includes(s.textContent)).map(rect)
  return {
    scrollY: window.scrollY,
    bodyH: document.body.scrollHeight,
    bar: bar ? rect(bar) : null,
    title: title ? rect(title) : null,
    circles,
    labels,
  }
})
console.log(JSON.stringify(info, null, 1))
await browser.close()
