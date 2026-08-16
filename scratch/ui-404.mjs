import { chromium } from 'playwright-core'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage()
page.on('requestfailed', (r) => console.log('FAILED', r.url()))
page.on('response', (r) => { if (r.status() >= 400) console.log(`HTTP ${r.status()}`, r.url()) })
await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' })
// use stored session from phase B (localStorage persists per origin in same profile? no — fresh profile each launch)
// So login again via stored token is not present. Instead just load report page directly and check 404s on any page.
// The 404 likely comes from data-driven asset. Load report without auth will redirect? Let's just go and watch.
await page.goto('http://localhost:3000/report', { waitUntil: 'networkidle' })
await new Promise(r => setTimeout(r, 3000))
await browser.close()
