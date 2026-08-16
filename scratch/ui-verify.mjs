// Browser UI verification for the demo registered account.
// Phase A (no SMS_CODE): open login, fill phone, send code, screenshot, exit.
// Phase B (SMS_CODE set): login, then screenshot home + all data pages.
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const BASE = 'http://localhost:3000'
const PHONE = process.env.SMOKE_PHONE || '13800006666'
const CODE = process.env.SMS_CODE || ''
const OUT = process.env.SHOTS_DIR || 'shots'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'

fs.mkdirSync(OUT, { recursive: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const shot = async (page, name) => {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false })
  console.log(`  📸 ${name}.png`)
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 })
page.on('console', (m) => { if (m.type() === 'error') console.log('  [console.error]', m.text().slice(0, 200)) })
page.on('response', (r) => { if (r.status() >= 400) console.log(`  [HTTP ${r.status()}]`, r.url()) })
page.on('pageerror', (e) => console.log('  [pageerror]', String(e).slice(0, 200)))

try {
  // ---------- Phase A ----------
  if (!CODE) {
    console.log('phase A: open login, send code')
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
    await sleep(800)
    await page.getByText('注册登录', { exact: false }).click()
    await sleep(400)
    await page.getByPlaceholder('输入11位手机号').fill(PHONE)
    await sleep(200)
    await page.getByText('发送验证码', { exact: true }).click()
    await sleep(1200)
    await shot(page, '01-login-sent')
    console.log(`DONE. read code from server log, then re-run with SMS_CODE`)
    await browser.close()
    process.exit(0)
  }

  // ---------- Phase B ----------
  console.log('phase B: login with demo account')
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await sleep(800)
  await page.getByText('注册登录', { exact: false }).click()
  await sleep(400)
  await page.getByPlaceholder('输入11位手机号').fill(PHONE)
  await page.getByPlaceholder('输入验证码').fill(CODE)
  await sleep(200)
  await page.getByText('登录/注册', { exact: false }).click()
  await sleep(2500)
  // Dismiss the first-run onboarding overlay (fresh browser profile has no gg-onboarding-done)
  const skip = page.getByText('跳过', { exact: true })
  if (await skip.count()) { await skip.click(); await sleep(600) }
  await shot(page, '02-home')

  const pages = [
    ['checkin', '03-checkin'],
    ['garden', '04-garden'],
    ['classroom', '05-classroom'],
    ['badges', '06-badges'],
    ['report', '07-report'],
    ['profile', '08-profile'],
  ]
  for (const [route, name] of pages) {
    await page.goto(`${BASE}/${route}`, { waitUntil: 'networkidle' })
    await sleep(1800)
    await shot(page, name)
  }

  // Settings
  await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle' })
  await sleep(1500)
  await shot(page, '09-settings')

  console.log('DONE. screenshots in', OUT)
} catch (e) {
  console.error('FAILED:', String(e))
  await shot(page, '99-error').catch(() => {})
  process.exit(1)
} finally {
  await browser.close()
}
