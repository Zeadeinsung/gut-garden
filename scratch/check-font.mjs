import { chromium } from 'playwright-core'

const BASE = 'http://localhost:3001'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
try {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await sleep(1500)
  const info = await page.evaluate(async () => {
    const loaded = await Promise.all([
      document.fonts.load('600 20px "JiangChengYuanTi"'),
      document.fonts.load('400 20px "JiangChengYuanTi"'),
    ]).catch(() => [])
    return {
      bodyFont: getComputedStyle(document.body).fontFamily,
      fontReady: document.fonts.check('20px "JiangChengYuanTi"'),
      fontCount: document.fonts.size,
    }
  })
  console.log('FONT_INFO:', JSON.stringify(info, null, 2))
  await page.screenshot({ path: 'shots/check-font-login.png' })
  console.log('SCREENSHOT_SAVED shots/check-font-login.png')
} catch (e) {
  console.error('FAILED:', String(e))
  process.exit(1)
} finally {
  await browser.close()
}
