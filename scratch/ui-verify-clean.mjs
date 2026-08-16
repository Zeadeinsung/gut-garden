// Verify clean test account (豆豆 13900001111) shows NO records after the fake-data fixes.
import { chromium } from 'playwright-core'

const BASE = 'http://localhost:3000'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const PHONE = process.env.PHONE || '13900001111'
const CODE = process.env.CODE || ''

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

async function visit(route, shotName) {
  await page.goto(`${BASE}/${route}`, { waitUntil: 'networkidle' })
  await sleep(2200)
  await page.screenshot({ path: `shots/clean-${shotName}.png` })
  console.log(`  📸 clean-${shotName}.png`)
}

try {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await sleep(400)
  await page.evaluate(() => localStorage.clear())

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await sleep(600)
  await page.getByText('注册登录', { exact: false }).click()
  await sleep(300)
  await page.getByPlaceholder('输入11位手机号').fill(PHONE)
  await page.getByPlaceholder('输入验证码').fill(CODE)
  await sleep(150)
  await page.getByText('登录/注册', { exact: false }).click()
  await sleep(2500)
  const skip = page.getByText('跳过', { exact: true })
  if (await skip.count()) { await skip.click(); await sleep(500) }
  console.log(`logged in ${PHONE}`)

  await visit('checkin', 'checkin')
  await visit('classroom', 'classroom')
  await visit('profile', 'profile')
  await visit('garden', 'garden')

  console.log('DONE.')
} catch (e) {
  console.error('FAILED:', String(e))
  process.exit(1)
} finally {
  await browser.close()
}
