import { chromium } from 'playwright-core'
const BASE = 'http://localhost:3000'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const PAGES = ['/', '/garden', '/checkin', '/classroom', '/badges', '/profile', '/report', '/stool', '/settings']
try {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await sleep(500)
  const g = page.getByText('先看看', { exact: false })
  if (await g.count()) { await g.first().click(); await sleep(900) }
  const skip = page.getByText('跳过', { exact: true })
  if (await skip.count()) { await skip.click(); await sleep(400) }

  for (const p of PAGES) {
    await page.goto(`${BASE}${p}`, { waitUntil: 'networkidle' })
    await sleep(1000)
    if (p === '/settings') {
      const q = await page.$$eval('p', (els) => els.map((e) => e.textContent).find((t) => /^\s*\d+\s*\+\s*\d+\s*=\s*\?\s*$/.test(t ?? ''))).catch(() => null)
      if (q) {
        const m = q.match(/(\d+)\s*\+\s*(\d+)/)
        await page.fill('input[type="number"]', String(Number(m[1]) + Number(m[2])))
        await page.getByText('确认', { exact: true }).click()
        await sleep(700)
      }
    }
    const r = await page.evaluate(() => {
      const svgs = [...document.querySelectorAll('svg')]
      const zeroSvgs = svgs.filter((s) => s.getBoundingClientRect().width === 0 && s.getBoundingClientRect().height === 0)
      const brokenImgs = [...document.querySelectorAll('img')].filter((im) => im.naturalWidth === 0)
      return {
        svgCount: svgs.length,
        zeroSvgs: zeroSvgs.map((s) => (s.getAttribute('class') || 'svg').slice(0, 40)).slice(0, 5),
        brokenImgs: brokenImgs.map((im) => im.getAttribute('src')).slice(0, 8),
      }
    })
    console.log(p, JSON.stringify(r))
  }
} finally { await browser.close() }
