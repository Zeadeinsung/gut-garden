// Verify fresh guest shows clean classroom after the fix.
import { chromium } from 'playwright-core'

const BASE = 'http://localhost:3000'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

try {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await sleep(400)
  await page.evaluate(() => localStorage.clear())

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await sleep(600)
  await page.getByPlaceholder('输入宝宝的名字或昵称').fill('小游客')
  await page.getByText('开始探索', { exact: false }).click()
  await sleep(1800)

  await page.goto(`${BASE}/classroom`, { waitUntil: 'networkidle' })
  await sleep(2200)
  await page.screenshot({ path: 'shots/guest-clean-classroom.png' })
  console.log('  📸 guest-clean-classroom.png')
  console.log('DONE.')
} catch (e) {
  console.error('FAILED:', String(e))
  process.exit(1)
} finally {
  await browser.close()
}
