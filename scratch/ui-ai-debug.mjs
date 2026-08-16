import { chromium } from 'playwright-core'
const BASE = 'http://localhost:3000'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await sleep(400)
await page.evaluate(() => localStorage.clear())
await page.goto(`${BASE}/classroom`, { waitUntil: 'networkidle' })
await sleep(1800)
console.log('URL:', page.url())
const text = await page.evaluate(() => document.body.innerText.slice(0, 400))
console.log('TEXT:', JSON.stringify(text))
const hasChat = await page.getByText('和我聊天', { exact: true }).count()
console.log('chat btn count:', hasChat)
await browser.close()
