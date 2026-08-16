// Probe clean home: bg box, container box, where wallpaper green content starts.
import { chromium } from 'playwright-core'

const BASE = 'http://localhost:3000'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
try {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await sleep(1500)
  let skip = page.getByText('跳过', { exact: true })
  if (await skip.count()) { await skip.first().click(); await sleep(500) }
  let guest = page.getByText('先看看', { exact: false })
  if (await guest.count()) { await guest.first().click(); await sleep(1200) }
  skip = page.getByText('跳过', { exact: true })
  if (await skip.count()) { await skip.first().click(); await sleep(600) }
  const start = page.getByText('开始探索', { exact: false })
  if (await start.count()) { await start.first().click(); await sleep(600) }

  const info = await page.evaluate(() => {
    const bg = document.querySelector('img[src*="scene_home_bg"]')
    const cont = bg ? bg.parentElement : null
    const shell = document.querySelector('div.rounded-\\[2rem\\]') || document.querySelector('.w-\\[min\\(calc\\(100vw-2rem\\),calc\\((100vh-2rem\\)\\*16\\/10\\)\\)\\]')
    const dock = document.querySelector('nav')
    const header = document.querySelector('header')
    const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), bottom: Math.round(r.bottom) } }
    return {
      url: location.pathname,
      bg: rect(bg),
      container: rect(cont),
      shell: rect(shell),
      dock: rect(dock),
      header: rect(header),
      overlaysNow: document.querySelectorAll('.fixed, [class*="z-50"], [class*="z-40"]').length,
    }
  })
  console.log(JSON.stringify(info, null, 2))
} catch (e) {
  console.error('FAILED:', String(e))
} finally {
  await browser.close()
}
