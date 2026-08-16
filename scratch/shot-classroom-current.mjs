import { chromium } from 'playwright-core'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const BASE = 'http://localhost:3000'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1672, height: 941 } })
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await sleep(500)
await page.evaluate(() => {
  localStorage.clear()
  localStorage.setItem('gg-auth', JSON.stringify({
    state: {
      mode: 'guest',
      user: {
        parent_id: 0, phone: '',
        children: [{ id: 1, name: '小明', age: 6, avatar_url: null }],
        active_child_id: 1,
      },
      token: null, loading: false,
    },
    version: 0,
  }))
  // mark onboarding complete (uiStore reads gg-onboarding-done directly)
  localStorage.setItem('gg-onboarding-done', '1')
})
await page.goto(`${BASE}/classroom`, { waitUntil: 'networkidle' })
await sleep(3000)
await page.screenshot({ path: 'D:/GutGardenBeta/scratch/current_classroom_1672.png' })
console.log('saved current_classroom_1672.png, url=', page.url())
await browser.close()
