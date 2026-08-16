// Verify garden 3-layer scene srcs for high_sugar and dry states by seeding localStorage.
import { chromium } from 'playwright-core'

const BASE = 'http://localhost:3000'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const STATE = process.env.STATE || 'high_sugar'

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

// Seed garden store before every page load so Zustand persist hydrates with the target state.
await page.addInitScript((state) => {
  localStorage.setItem('gg-garden', JSON.stringify({
    state: { currentState: state, moistureLevel: 50, gardenLevel: 1, gardenXp: 0, interactionCount: 0 },
    version: 0,
  }))
}, STATE)

try {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await sleep(800)
  const guest = page.getByText('先看看', { exact: false })
  if (await guest.count()) { await guest.click(); await sleep(800) }

  await page.goto(`${BASE}/garden`, { waitUntil: 'networkidle' })
  await sleep(1800)
  const skip = page.getByText('跳过', { exact: true })
  if (await skip.count()) { await skip.click(); await sleep(500) }

  await page.screenshot({ path: `shots/garden-${STATE}.png` })

  const srcs = await page.locator('img[data-parallax]').evaluateAll((imgs) =>
    imgs.map((img) => img.getAttribute('src'))
  )
  console.log(`STATE=${STATE} LAYERS:`, JSON.stringify(srcs))

  const suffix = STATE === 'high_sugar' ? '_high_sugar' : STATE === 'dry' ? '_dry' : ''
  const expected = [
    `/assets/scenes/scene_garden_sky${suffix}.png`,
    `/assets/scenes/scene_garden_mid${suffix}.png`,
    `/assets/scenes/scene_garden_front${suffix}.png`,
  ]
  const ok = srcs.every((s, i) => s === expected[i])
  if (!ok) {
    console.error(`MISMATCH: expected ${JSON.stringify(expected)}`)
    process.exit(1)
  }
  console.log(`VARIANT_${STATE.toUpperCase()}_SRCS_OK`)
  console.log('JS_ERRORS:', errors.length ? errors.join(' | ') : 'none')
  if (errors.length) process.exit(1)
  console.log('DONE.')
} catch (e) {
  console.error('FAILED:', String(e))
  process.exit(1)
} finally {
  await browser.close()
}
