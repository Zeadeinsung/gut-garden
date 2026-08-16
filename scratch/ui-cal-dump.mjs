// Dump the checkin calendar cells for a given account to verify day/status mapping.
import { chromium } from 'playwright-core'

const BASE = 'http://localhost:3000'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const PHONE = process.env.PHONE || '13800006666'
const CODE = process.env.CODE || ''

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

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

  await page.goto(`${BASE}/checkin`, { waitUntil: 'networkidle' })
  await sleep(2200)

  const cells = await page.evaluate(() => {
    const grid = document.querySelector('.grid.grid-cols-7')
    if (!grid) return []
    return Array.from(grid.querySelectorAll('span')).map((el) => ({
      text: el.textContent,
      cls: el.className,
    }))
  })
  // Find the calendar grid specifically (the one after the weekday headers 日一二三四五六)
  console.log(JSON.stringify(cells, null, 1))
  console.log('DONE.')
} catch (e) {
  console.error('FAILED:', String(e))
  process.exit(1)
} finally {
  await browser.close()
}
