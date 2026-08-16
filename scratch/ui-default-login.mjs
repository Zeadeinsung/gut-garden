// Verify: fresh visit lands on /login; guest quick-browse works; session persists; registered login works.
import { chromium } from 'playwright-core'

const BASE = 'http://localhost:3000'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const PHONE = process.env.SMOKE_PHONE || '13800006666'
const CODE = process.env.SMS_CODE || ''
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

function ok(label, cond) { console.log(`${cond ? '✅' : '❌'} ${label}${cond ? '' : '  (unexpected!)'}`) }

try {
  // 1. Fresh visit → should land on /login
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await sleep(800)
  ok('fresh visit → URL is /login', page.url().includes('/login'))

  // 2. Guest quick-browse
  await page.getByText('先看看', { exact: false }).first().click()
  await sleep(1200)
  ok('guest 先看看 → URL is / (home)', page.url().endsWith('/') || page.url().endsWith('/garden'))
  const hasWelcome = await page.getByText('欢迎回来', { exact: false }).count()
  ok('guest home shows welcome banner', hasWelcome > 0)

  // 3. Reload → session persists, stays on home
  await page.reload({ waitUntil: 'networkidle' })
  await sleep(1200)
  ok('reload stays on home (session persisted)', !page.url().includes('/login'))

  // 4. Registered login flow
  await page.evaluate(() => localStorage.clear())
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await sleep(800)
  ok('after clear → back to /login', page.url().includes('/login'))

  if (CODE) {
    await page.getByText('注册登录', { exact: false }).click()
    await sleep(400)
    await page.getByPlaceholder('输入11位手机号').fill(PHONE)
    await page.getByPlaceholder('输入验证码').fill(CODE)
    await sleep(200)
    await page.getByText('登录/注册', { exact: false }).click()
    await sleep(2500)
    ok('registered login → URL is /', page.url().endsWith('/'))
    const skip = page.getByText('跳过', { exact: true })
    if (await skip.count()) { await skip.click(); await sleep(500) }
    await page.screenshot({ path: 'shots/10-default-home.png' })
    console.log('  📸 10-default-home.png')
  } else {
    console.log('  (no SMS_CODE — skipping registered login; pass SMS_CODE to test it)')
  }
} catch (e) {
  console.error('FAILED:', String(e))
  process.exit(1)
} finally {
  await browser.close()
}
