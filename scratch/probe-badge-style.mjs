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
  const find = (text) => els.find((e) => e.textContent === text)
  const st = (el) => getComputedStyle(el)

  const title = find('花园成长进度')
  const subSpan = find('已成长')
  const right = find('下一份惊喜')
  // circles: the rounded-full with border-2
  const circles = Array.from(document.querySelectorAll('span[class*="w-[36px]"]'))
  const lineSegs = Array.from(document.querySelectorAll('div[class*="flex-1 h-[4px]"]'))
  const labelEls = Array.from(document.querySelectorAll('span[class*="text-[9px]"]'))
    .filter((s) => s.textContent.length <= 3)

  return {
    panelBg: (() => {
      const bar = title?.closest('div')
      // walk up to the bar container
      let cur = title
      for (let i = 0; i < 6 && cur; i++) {
        const bg = st(cur).backgroundImage
        if (bg && bg !== 'none' && bg.includes('gradient')) return { tag: cur.tagName, bg }
        cur = cur.parentElement
      }
      return null
    })(),
    title: title ? { font: st(title).fontSize, weight: st(title).fontWeight, color: st(title).color } : null,
    sub: subSpan ? { font: st(subSpan).fontSize, weight: st(subSpan).fontWeight, color: st(subSpan).color } : null,
    right: right ? { font: st(right).fontSize, weight: st(right).fontWeight, color: st(right).color } : null,
    circles: circles.map((c) => ({
      bg: st(c).backgroundImage || st(c).backgroundColor,
      border: st(c).borderColor,
      txt: st(c).color,
      rect: (() => { const r = c.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width)] })()
    })),
    lineSegs: lineSegs.map((l) => ({ bg: st(l).backgroundColor, h: st(l).height, rect: (() => { const r = l.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] })() })),
    labels: labelEls.map((s) => ({ txt: s.textContent, color: st(s).color, weight: st(s).fontWeight })),
  }
})
console.log(JSON.stringify(info, null, 1))
await browser.close()
