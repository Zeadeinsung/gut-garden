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

// scroll badge panel fully into view
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
  const sub = Array.from(document.querySelectorAll('p')).find((p) => p.textContent.includes('已成长'))
  const panel = title.closest('div[class*="h-full"]')
  const circles = Array.from(panel.querySelectorAll('span[class*="w-[40px]"]'))
  const segs = Array.from(panel.querySelectorAll('div[class*="h-[6px]"]')).filter((d) => d.className.includes('z-10'))
  const houseImg = panel.querySelector('img[src*="ui_reward_house"]')
  const labels = Array.from(panel.querySelectorAll('span')).filter((s) => ['幼苗期','成长期','繁荣期','茂盛期','丰收期','守护期'].includes(s.textContent))
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } }
  const vs = (el) => cs(el)?.fontSize + '/' + cs(el)?.fontWeight + '/' + cs(el)?.color
  return {
    panelRect: rect(panel),
    panelBg: cs(panel).backgroundImage.slice(0, 60),
    title: vs(title),
    sub: vs(sub),
    circles: circles.map((c) => ({ bg: cs(c).backgroundImage.slice(0, 50), border: cs(c).borderColor, icon: c.textContent.trim() })),
    segments: segs.map((s) => cs(s).backgroundImage.slice(0, 60)),
    house: houseImg ? { w: rect(houseImg).w, h: rect(houseImg).h, src: houseImg.src.split('/').pop() } : null,
    labels: labels.map((l) => l.textContent + ':' + vs(l)),
    center: Math.round((rect(panel).x + rect(panel).w / 2)),
  }
})
console.log(JSON.stringify(result, null, 1))

// screenshot the panel
const box = await page.evaluate(() => {
  const title = Array.from(document.querySelectorAll('p')).find((p) => p.textContent === '花园成长进度')
  const panel = title.closest('div[class*="h-full"]')
  const r = panel.getBoundingClientRect()
  return { x: r.x, y: r.y, width: r.width, height: r.height }
})
await page.screenshot({ path: 'D:/GutGardenBeta/.shots/badge-v2.png', clip: box })
console.log('saved badge-v2.png', JSON.stringify(box))
await browser.close()
