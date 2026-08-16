// Verify the three test accounts: admin, registered parent, guest.
import { chromium } from 'playwright-core'

const BASE = 'http://localhost:3000'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const ADMIN_CODE = process.env.ADMIN_CODE || ''
const PARENT_CODE = process.env.PARENT_CODE || ''

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
function ok(l, c) { console.log(`${c ? '✅' : '❌'} ${l}`) }
async function reset() {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await sleep(400)
  await page.evaluate(() => localStorage.clear())
}
async function login(phone, code, label) {
  await reset()
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await sleep(600)
  await page.getByText('注册登录', { exact: false }).click()
  await sleep(300)
  await page.getByPlaceholder('输入11位手机号').fill(phone)
  await page.getByPlaceholder('输入验证码').fill(code)
  await sleep(150)
  await page.getByText('登录/注册', { exact: false }).click()
  await sleep(2500)
  const landedHome = page.url().endsWith('/') || page.url().includes('/garden')
  ok(`${label} 登录 → 首页`, landedHome)
  const skip = page.getByText('跳过', { exact: true })
  if (await skip.count()) { await skip.click(); await sleep(500) }
  await page.screenshot({ path: `shots/11-${label}.png` })
  console.log(`  📸 11-${label}.png`)
}
async function guest(label) {
  await reset()
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await sleep(600)
  await page.getByPlaceholder('输入宝宝的名字或昵称').fill('小游客')
  await page.getByText('开始探索', { exact: false }).click()
  await sleep(1500)
  ok(`${label} 游客登录 → 首页`, !page.url().includes('/login'))
  await page.screenshot({ path: `shots/11-${label}.png` })
  console.log(`  📸 11-${label}.png`)
}

try {
  await guest('guest')
  if (ADMIN_CODE) await login('13800008888', ADMIN_CODE, 'admin')
  if (PARENT_CODE) await login('13900001111', PARENT_CODE, 'parent')
  console.log('DONE.')
} catch (e) {
  console.error('FAILED:', String(e))
  process.exit(1)
} finally {
  await browser.close()
}
