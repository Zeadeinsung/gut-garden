// Reproduce: use demo account (with data), logout, login as clean test account → check for stale data.
import { chromium } from 'playwright-core'

const BASE = 'http://localhost:3000'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const DEMO_CODE = process.env.DEMO_CODE || ''
const TEST_CODE = process.env.TEST_CODE || ''

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
function ok(l, c) { console.log(`${c ? '✅' : '❌'} ${l}`) }

async function reset() {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await sleep(400)
  await page.evaluate(() => localStorage.clear())
}
async function login(phone, code) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await sleep(600)
  await page.getByText('注册登录', { exact: false }).click()
  await sleep(300)
  await page.getByPlaceholder('输入11位手机号').fill(phone)
  await page.getByPlaceholder('输入验证码').fill(code)
  await sleep(150)
  await page.getByText('登录/注册', { exact: false }).click()
  await sleep(2500)
  const skip = page.getByText('跳过', { exact: true })
  if (await skip.count()) { await skip.click(); await sleep(500) }
}
async function visit(route, shotName) {
  await page.goto(`${BASE}/${route}`, { waitUntil: 'networkidle' })
  await sleep(1800)
  await page.screenshot({ path: `shots/bleed-${shotName}.png` })
  console.log(`  📸 bleed-${shotName}.png`)
}

try {
  await reset()
  console.log('== 1. login demo 小明 (has data) ==')
  await login('13800006666', DEMO_CODE)
  await visit('checkin', 'demo-checkin')
  await visit('garden', 'demo-garden')

  console.log('== 2. logout from profile ==')
  await page.goto(`${BASE}/profile`, { waitUntil: 'networkidle' })
  await sleep(1500)
  const logoutBtn = page.getByText('退出登录', { exact: true })
  ok('profile has logout button', (await logoutBtn.count()) > 0)
  await logoutBtn.click()
  await sleep(1500)
  ok('after logout → at login page', page.url().includes('/login'))

  console.log('== 3. login clean test 豆豆 ==')
  await login('13900001111', TEST_CODE)
  await visit('checkin', 'test-checkin')
  await visit('garden', 'test-garden')
  await visit('classroom', 'test-classroom')

  console.log('DONE.')
} catch (e) {
  console.error('FAILED:', String(e))
  process.exit(1)
} finally {
  await browser.close()
}
