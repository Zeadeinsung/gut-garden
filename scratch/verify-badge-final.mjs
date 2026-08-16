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
  const bar = title.parentElement.parentElement
  bar.scrollIntoView({ block: 'center' })
})
await page.waitForTimeout(500)

const result = await page.evaluate(() => {
  const cs = (el) => el ? getComputedStyle(el) : null
  const all = Array.from(document.querySelectorAll('*'))
  const title = all.find((e) => e.textContent === '花园成长进度')
  const subP = Array.from(document.querySelectorAll('p')).find((p) => p.textContent.includes('已成长'))
  const right = Array.from(document.querySelectorAll('span')).find((s) => s.textContent.includes('下一份惊喜'))
  const circles = Array.from(document.querySelectorAll('span[class*="w-[36px]"]'))
  const segs = Array.from(document.querySelectorAll('div[class*="h-[4px]"]')).filter((d) => d.className.includes('z-10'))
  const labels = Array.from(document.querySelectorAll('span')).filter((s) => ['幼苗期','成长期','繁荣期','茂盛期','丰收期','守护期'].includes(s.textContent))
  const bar = title ? title.closest('div[class*="h-full"]') : null

  return {
    title: { color: cs(title)?.color, size: cs(title)?.fontSize, weight: cs(title)?.fontWeight },
    sub: subP ? { color: cs(subP).color, size: cs(subP).fontSize } : null,
    right: right ? { color: cs(right).color, hasIcon: !!right.querySelector('svg') } : null,
    barBg: bar ? cs(bar).backgroundImage : null,
    circles: circles.map((c) => ({ color: cs(c).backgroundImage || cs(c).backgroundColor, icon: c.textContent.trim() })),
    segments: segs.map((s) => cs(s).backgroundColor),
    labels: labels.map((l) => ({ txt: l.textContent, color: cs(l).color, weight: cs(l).fontWeight })),
    rect: bar ? (() => { const r = bar.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } })() : null,
  }
})

console.log(JSON.stringify(result, null, 1))

// screenshot the bar now that it's scrolled to center
const box = await page.evaluate(() => {
  const title = Array.from(document.querySelectorAll('p')).find((p) => p.textContent === '花园成长进度')
  const bar = title.closest('div[class*="h-full"]')
  const r = bar.getBoundingClientRect()
  return { x: r.x, y: r.y, width: r.width, height: r.height }
})
await page.screenshot({ path: 'D:/GutGardenBeta/.shots/badge-final.png', clip: box })
console.log('saved badge-final.png', JSON.stringify(box))
await browser.close()
