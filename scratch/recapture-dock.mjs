import { chromium } from 'playwright-core'
const BASE = 'http://localhost:3000'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
try {
  // login decorative icons probe
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await sleep(900)
  const deco = await page.evaluate(() => {
    const layer = document.querySelector('div.absolute.inset-0.z-0')
    if (!layer) return { layer: null }
    const svgs = [...layer.querySelectorAll('svg')]
    return { svgCount: svgs.length, sizes: svgs.map((s) => s.getAttribute('width')) }
  })
  console.log('login deco svgs:', JSON.stringify(deco))
  await page.screenshot({ path: 'D:/GutGardenBeta/scratch/shots/icons/01-login-top.png' })
  console.log('📸 01-login-top recaptured')

  // guest
  const g = page.getByText('先看看', { exact: false })
  if (await g.count()) { await g.first().click(); await sleep(900) }
  const skip = page.getByText('跳过', { exact: true })
  if (await skip.count()) { await skip.click(); await sleep(400) }

  await page.goto(`${BASE}/checkin`, { waitUntil: 'networkidle' })
  await sleep(1100)
  await page.screenshot({ path: 'D:/GutGardenBeta/scratch/shots/icons/04-checkin-top.png' })
  console.log('📸 04-checkin-top recaptured')

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await sleep(1100)
  await page.screenshot({ path: 'D:/GutGardenBeta/scratch/shots/icons/02-home-bottom.png' })
  console.log('📸 02-home-bottom recaptured')
} finally { await browser.close() }
