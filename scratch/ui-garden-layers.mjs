// Verify garden 3-layer scene renders with state-dependent srcs for all 3 layers.
import { chromium } from 'playwright-core'

const BASE = 'http://localhost:3000'
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

  // Enter guest browsing mode
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await sleep(800)
  const guest = page.getByText('先看看', { exact: false })
  if (!(await guest.count())) throw new Error('guest browse button not found')
  await guest.click()
  await sleep(800)

  await page.goto(`${BASE}/garden`, { waitUntil: 'networkidle' })
  await sleep(1800)
  const skip = page.getByText('跳过', { exact: true })
  if (await skip.count()) { await skip.click(); await sleep(500) }

  await page.screenshot({ path: 'shots/garden-layers.png' })

  // Read the 3 parallax layer img srcs
  const srcs = await page.locator('img[data-parallax]').evaluateAll((imgs) =>
    imgs.map((img) => ({ src: img.getAttribute('src'), parallax: img.getAttribute('data-parallax') }))
  )
  console.log('LAYERS:', JSON.stringify(srcs, null, 2))

  const expected = [
    { layer: 'garden_sky', src: '/assets/scenes/scene_garden_sky.png' },
    { layer: 'garden_mid', src: '/assets/scenes/scene_garden_mid.png' },
    { layer: 'garden_front', src: '/assets/scenes/scene_garden_front.png' },
  ]
  for (const [i, e] of expected.entries()) {
    const got = srcs[i]?.src
    if (got !== e.src) {
      console.error(`MISMATCH layer ${e.layer}: expected ${e.src}, got ${got}`)
      process.exit(1)
    }
  }
  console.log('HEALTHY_STATE_SRCS_OK')
  console.log('JS_ERRORS:', errors.length ? errors.join(' | ') : 'none')
  if (errors.length) process.exit(1)
  console.log('DONE.')
} catch (e) {
  console.error('FAILED:', String(e))
  process.exit(1)
} finally {
  await browser.close()
}
