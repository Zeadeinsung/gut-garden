import { chromium } from 'playwright-core'
const BASE = 'http://localhost:3000'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await sleep(400)
await page.evaluate(() => localStorage.clear())
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
await sleep(800)
await page.getByText('先看看', { exact: false }).click()
await sleep(800)
await page.goto(`${BASE}/classroom`, { waitUntil: 'networkidle' })
await sleep(1800)
await page.screenshot({ path: 'shots/ai-classroom-state.png' })
const overlayBtns = await page.locator('button, [role=button]').allTextContents()
console.log('BUTTONS:', JSON.stringify(overlayBtns.filter(t => t.trim()).slice(0, 20)))
await browser.close()
