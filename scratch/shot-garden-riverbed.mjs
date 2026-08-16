import { chromium } from 'playwright-core'

const BASE = 'http://localhost:3001'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

try {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await sleep(400)
  await page.evaluate(() => localStorage.clear())

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await sleep(800)
  const guest = page.getByText('先看看', { exact: false })
  if (!(await guest.count())) throw new Error('guest browse button not found')
  await guest.click()
  await sleep(800)

  await page.goto(`${BASE}/garden`, { waitUntil: 'networkidle' })
  await sleep(2000)
  const skip = page.getByText('跳过', { exact: true })
  if (await skip.count()) { await skip.click(); await sleep(500) }

  // Capture scene container box + all POI sprite boxes
  const info = await page.evaluate(() => {
    const scene = document.querySelector('.overflow-hidden.rounded-2xl')
    const rect = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }
    }
    const pois = Array.from(document.querySelectorAll('img[src^="/assets/garden-poi/"]')).map((img) => ({
      src: img.getAttribute('src'),
      rect: rect(img),
    }))
    return { scene: rect(scene), pois }
  })
  console.log('SCENE_INFO:', JSON.stringify(info, null, 2))

  await page.screenshot({ path: 'shots/garden-riverbed.png' })
  console.log('SCREENSHOT_SAVED shots/garden-riverbed.png')
  console.log('JS_ERRORS:', errors.length ? errors.join(' | ') : 'none')
} catch (e) {
  console.error('FAILED:', String(e))
  process.exit(1)
} finally {
  await browser.close()
}
