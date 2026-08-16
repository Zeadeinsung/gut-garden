import { chromium } from 'playwright-core'
const BASE = 'http://localhost:3000'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
async function guest() {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await sleep(500)
  const g = page.getByText('先看看', { exact: false })
  if (await g.count()) { await g.first().click(); await sleep(900) }
  const skip = page.getByText('跳过', { exact: true })
  if (await skip.count()) { await skip.click(); await sleep(400) }
}
try {
  await guest()
  // broken images on garden
  await page.goto(`${BASE}/garden`, { waitUntil: 'networkidle' })
  await sleep(1200)
  const broken = await page.evaluate(() =>
    [...document.querySelectorAll('img')]
      .map((im) => ({ src: im.getAttribute('src'), w: im.naturalWidth, h: im.naturalHeight }))
      .filter((i) => i.w === 0)
  )
  console.log('garden broken imgs:', JSON.stringify(broken))

  // dock label overlap on checkin (active tab)
  await page.goto(`${BASE}/checkin`, { waitUntil: 'networkidle' })
  await sleep(1200)
  const dock = await page.evaluate(() => {
    const nav = document.querySelector('nav') || [...document.querySelectorAll('div')].find((d) => {
      const kids = [...d.children]
      return kids.length >= 6 && kids.every((k) => k.tagName === 'BUTTON' || k.tagName === 'A')
    })
    if (!nav) return { nav: null }
    const btns = [...nav.querySelectorAll('button')].map((b) => {
      const r = b.getBoundingClientRect()
      const txt = b.textContent.replace(/\s+/g, ' ').trim().slice(0, 12)
      return { txt, top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height) }
    })
    return { navTag: nav.tagName, navH: Math.round(nav.getBoundingClientRect().height), btns }
  })
  console.log('dock:', JSON.stringify(dock, null, 1))
} finally { await browser.close() }
