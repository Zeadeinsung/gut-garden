// Probe: what overlays/modals are present on home, and the container box of the bg img.
import { chromium } from 'playwright-core'

const BASE = 'http://localhost:3000'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
page.on('pageerror', (e) => console.log('PAGEERROR:', String(e)))

try {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await sleep(1200)
  const skip = page.getByText('跳过', { exact: true })
  console.log('skip count:', await skip.count())
  if (await skip.count()) { await skip.first().click(); await sleep(600) }
  const guest = page.getByText('先看看', { exact: false })
  console.log('guest count:', await guest.count())
  if (await guest.count()) { await guest.first().click(); await sleep(1200) }

  const info = await page.evaluate(() => {
    // Find the home bg img
    const bg = document.querySelector('img[src*="scene_home_bg"]')
    const bgBox = bg ? bg.getBoundingClientRect() : null
    // Find the absolute container (parent of bg)
    const cont = bg ? bg.parentElement : null
    const contBox = cont ? cont.getBoundingClientRect() : null
    // Any fixed overlay / modal root
    const fixed = [...document.querySelectorAll('body *')].filter((el) => {
      const s = getComputedStyle(el)
      return s.position === 'fixed' && (s.zIndex !== 'auto' && +s.zIndex >= 40)
    }).map((el) => ({
      cls: el.className?.toString?.().slice(0, 80),
      z: getComputedStyle(el).zIndex,
      rect: el.getBoundingClientRect().toJSON(),
      text: el.textContent?.slice(0, 60),
    }))
    return {
      url: location.pathname,
      bgBox: bgBox ? { x: bgBox.x, y: bgBox.y, w: bgBox.width, h: bgBox.height } : null,
      contBox: contBox ? { x: contBox.x, y: contBox.y, w: contBox.width, h: contBox.height } : null,
      overlays: fixed,
      bodyH: document.body.scrollHeight,
      docH: document.documentElement.scrollHeight,
    }
  })
  console.log(JSON.stringify(info, null, 2))
} catch (e) {
  console.error('FAILED:', String(e))
} finally {
  await browser.close()
}
