import { chromium } from 'playwright-core'
const BASE = 'http://localhost:3000'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
try {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await sleep(500)
  const g = page.getByText('先看看', { exact: false })
  if (await g.count()) { await g.first().click(); await sleep(900) }
  const skip = page.getByText('跳过', { exact: true })
  if (await skip.count()) { await skip.click(); await sleep(400) }
  await page.goto(`${BASE}/checkin`, { waitUntil: 'networkidle' })
  await sleep(1000)
  const info = await page.evaluate(() => {
    const links = [...document.querySelectorAll('nav a')]
    const active = links.find((a) => a.className.baseVal ? a.classList.contains('text-\[\#9F62B3\]') : false) || links.find((a) => {
      // find the one whose label matches 每日打卡
      return a.textContent.includes('每日打卡')
    })
    const out = []
    for (const a of links) {
      const labelSpan = [...a.querySelectorAll('span')].find((s) => s.textContent.trim() === a.querySelector('span:last-child')?.textContent.trim() && /[一-龥]/.test(s.textContent))
      const spans = [...a.querySelectorAll('span')]
      const label = spans[spans.length - 1]
      const iconWrap = spans[0]
      const archSvg = a.querySelector('svg[width="44"]')
      const iconSvg = a.querySelector('svg[width="44"] + span svg, span.relative svg')
      const lr = label?.getBoundingClientRect()
      const wr = iconWrap?.getBoundingClientRect()
      const ar = archSvg?.getBoundingClientRect()
      const ir = iconSvg?.getBoundingClientRect()
      out.push({
        label: a.textContent.replace(/\s+/g, '').slice(0, 6),
        labelRect: lr ? { top: Math.round(lr.top), bottom: Math.round(lr.bottom) } : null,
        iconWrapRect: wr ? { top: Math.round(wr.top), bottom: Math.round(wr.bottom) } : null,
        archRect: ar ? { top: Math.round(ar.top), bottom: Math.round(ar.bottom) } : null,
        iconRect: ir ? { top: Math.round(ir.top), bottom: Math.round(ir.bottom) } : null,
        hasArch: !!archSvg,
      })
    }
    return out
  })
  console.log(JSON.stringify(info, null, 1))
} finally { await browser.close() }
