import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:3000'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
mkdirSync('D:/GutGardenBeta/.shots', { recursive: true })

const GUEST_AUTH = {
  state: {
    mode: 'guest',
    user: { parent_id: 0, phone: '', children: [{ id: 1, name: '小园丁', age: 6, avatar_url: null }], active_child_id: 1 },
    token: null,
    loading: false,
  },
  version: 0,
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
await sleep(6000)
await page.screenshot({ path: 'D:/GutGardenBeta/.shots/home-current.png' })
console.log('Saved home-current.png')

const bg = await page.evaluate(() => {
  const all = Array.from(document.querySelectorAll('*')).filter((d) => getComputedStyle(d).backgroundImage !== 'none')
  return all.slice(0, 8).map((d) => getComputedStyle(d).backgroundImage)
})
console.log('BG images:', JSON.stringify(bg, null, 1).slice(0, 500))

await browser.close()
console.log('Done.')
