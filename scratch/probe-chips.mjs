import { chromium } from 'playwright-core'
const BASE = 'http://localhost:3000'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
try {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await sleep(600)
  const guest = page.getByText('先看看', { exact: false })
  if (await guest.count()) { await guest.first().click(); await sleep(1000) }
  const skip = page.getByText('跳过', { exact: true })
  if (await skip.count()) { await skip.click(); await sleep(500) }
  const info = await page.evaluate(() => {
    const h = [...document.querySelectorAll('h3')].find((x) => x.textContent === '今日任务')
    const card = h ? h.closest('.glass-card') : null
    if (!card) return { card: null }
    const cardRect = card.getBoundingClientRect()
    const labels = [...card.querySelectorAll('span')].filter((s) => {
      const t = (s.textContent || '').trim()
      return t === '水分充足' || t === '菌群活跃' || t === '屏障稳固'
    })
    const chips = labels.map((lb) => {
      const chip = lb.closest('.rounded-full')
      const r = chip ? chip.getBoundingClientRect() : null
      const lr = lb.getBoundingClientRect()
      return {
        label: lb.textContent,
        chipW: r ? Math.round(r.width) : null,
        chipRight: r ? Math.round(r.right) : null,
        labelW: Math.round(lr.width),
        labelH: Math.round(lr.height),
        wraps: lr.height > 14,
      }
    })
    return { cardW: Math.round(cardRect.width), cardRight: Math.round(cardRect.right), chips }
  })
  console.log(JSON.stringify(info, null, 2))
} finally { await browser.close() }
