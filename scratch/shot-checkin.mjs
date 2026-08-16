import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:3001'
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
const errors = []
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()
await page.addInitScript((auth) => {
  localStorage.setItem('gg-auth', JSON.stringify(auth))
  localStorage.setItem('gg-onboarding-done', '1')
}, GUEST_AUTH)
page.on('pageerror', (e) => errors.push(`pageerror: ${String(e)}`))
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`) })

await page.goto(`${BASE}/checkin`, { waitUntil: 'domcontentloaded', timeout: 20000 })
await sleep(4500)
await page.screenshot({ path: 'D:/GutGardenBeta/.shots/checkin-cards.png' })
console.log('Saved checkin-cards.png')

await browser.close()
if (errors.length > 0) {
  console.log('\nErrors:')
  errors.forEach((e) => console.log(`  ${e}`))
}
console.log('Done.')
