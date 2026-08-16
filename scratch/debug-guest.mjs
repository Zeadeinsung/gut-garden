import { chromium } from 'playwright-core'

const BASE = 'http://localhost:3001'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE ERR:', m.text()) })
page.on('pageerror', (e) => console.log('PAGE ERR:', String(e)))

await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 20000 })
await sleep(3000)

// Find all buttons with their text
const buttons = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('button')).map((b) => b.textContent.trim().slice(0, 30))
})
console.log('Buttons:', JSON.stringify(buttons))

// Click the guest browse button by exact match
const r = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button'))
  const guest = btns.find((b) => b.textContent.includes('先看看'))
  if (guest) { guest.click(); return 'clicked' }
  return 'not found'
})
console.log('Click result:', r)
await sleep(3000)

console.log('URL after click:', page.url())
const ls = await page.evaluate(() => JSON.stringify(localStorage))
console.log('localStorage:', ls.slice(0, 300))

await browser.close()
