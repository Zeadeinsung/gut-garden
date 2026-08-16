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
  const all = Array.from(document.querySelectorAll('span, p'))
  const find = (txt) => all.find((e) => e.textContent.includes(txt) && e.textContent.length < 20)
  const cs = (el) => el ? { color: getComputedStyle(el).color, size: getComputedStyle(el).fontSize, weight: getComputedStyle(el).fontWeight } : null
  const title = find('花园成长进度')
  const subP = Array.from(document.querySelectorAll('p')).find((p) => p.textContent.includes('已成长'))
  const subNum = subP ? Array.from(subP.querySelectorAll('span')).find((s) => /^\d+$/.test(s.textContent.trim())) : null
  const right = Array.from(document.querySelectorAll('span')).find((s) => s.textContent.includes('下一份惊喜'))
  const houseIcon = right ? right.querySelector('svg, img, span[class*="emoji"]') : null
  return {
    title: cs(title),
    subP: cs(subP),
    subNumColor: cs(subNum),
    right: cs(right),
    rightHasIcon: !!houseIcon,
  }
})
console.log(JSON.stringify(info, null, 1))
await browser.close()
