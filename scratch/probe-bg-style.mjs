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
    const bg = [...document.querySelectorAll('div')].find((d) => d.style.backgroundImage && d.style.backgroundImage.includes('scene_home_bg'))
    const cs = bg ? getComputedStyle(bg) : null
    const r = bg ? bg.getBoundingClientRect() : null
    const root = bg ? bg.parentElement : null
    const rr = root ? root.getBoundingClientRect() : null
    return {
      bgRect: r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } : null,
      rootRect: rr ? { x: Math.round(rr.x), y: Math.round(rr.y), w: Math.round(rr.width), h: Math.round(rr.height) } : null,
      bgSize: cs ? cs.backgroundSize : null,
      bgPos: cs ? cs.backgroundPosition : null,
      bgImg: cs ? cs.backgroundImage.slice(0, 80) : null,
    }
  })
  console.log(JSON.stringify(info, null, 2))
} catch (e) { console.error('FAILED:', String(e)) } finally { await browser.close() }
