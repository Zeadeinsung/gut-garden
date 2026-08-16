// Screenshot all key pages after emoji→Lucide replacement for visual verification.
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:3000'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const OUT = 'D:/GutGardenBeta/scratch/shots/icons'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

async function shot(name) {
  await page.screenshot({ path: `${OUT}/${name}.png` })
  console.log('  📸', name)
}

async function scrollBottom() {
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight)
    const sc = document.querySelector('div.overflow-auto, main')
    if (sc) sc.scrollTop = sc.scrollHeight
  })
  await sleep(400)
}

async function goto(path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' })
  await sleep(1200)
}

try {
  // 1. Login
  await goto('/login')
  await shot('01-login-top')

  // 2. Guest quick-browse → home
  const guest = page.getByText('先看看', { exact: false })
  if (await guest.count()) { await guest.first().click(); await sleep(1200) }
  const skip = page.getByText('跳过', { exact: true })
  if (await skip.count()) { await skip.click(); await sleep(500) }
  await shot('02-home-top')
  await scrollBottom()
  await shot('02-home-bottom')

  // 3. Garden
  await goto('/garden')
  await shot('03-garden-top')
  await scrollBottom()
  await shot('03-garden-bottom')

  // 4. Checkin
  await goto('/checkin')
  await shot('04-checkin-top')
  await scrollBottom()
  await shot('04-checkin-bottom')

  // 5. Classroom
  await goto('/classroom')
  await shot('05-classroom-top')
  await scrollBottom()
  await shot('05-classroom-bottom')

  // 6. Badges
  await goto('/badges')
  await shot('06-badges-top')
  await scrollBottom()
  await shot('06-badges-bottom')

  // 7. Profile
  await goto('/profile')
  await shot('07-profile-top')
  await scrollBottom()
  await shot('07-profile-bottom')

  // 8. Report
  await goto('/report')
  await shot('08-report-top')
  await scrollBottom()
  await shot('08-report-bottom')

  // 9. Stool
  await goto('/stool')
  await shot('09-stool-top')
  await scrollBottom()
  await shot('09-stool-bottom')

  // 10. Settings (parent gate: solve the math question)
  await goto('/settings')
  const q = await page.$$eval('p', (els) => els.map((e) => e.textContent).find((t) => /^\s*\d+\s*\+\s*\d+\s*=\s*\?\s*$/.test(t ?? ''))).catch(() => null)
  if (q) {
    const m = q.match(/(\d+)\s*\+\s*(\d+)/)
    await page.fill('input[type="number"]', String(Number(m[1]) + Number(m[2])))
    await page.getByText('确认', { exact: true }).click()
    await sleep(1000)
  }
  await shot('10-settings-top')
  await scrollBottom()
  await shot('10-settings-bottom')

  console.log('JS_ERRORS:', errors.length ? errors.join(' | ') : 'none')
  console.log('DONE. →', OUT)
} catch (e) {
  console.error('FAILED:', String(e))
  process.exit(1)
} finally {
  await browser.close()
}
