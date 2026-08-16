// Verify: pulled assets render, no broken imgs, capture screenshots for vision.
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:3000'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const OUT = 'D:/GutGardenBeta/scratch/shots/assets'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

async function goto(path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' })
  await sleep(1200)
}

async function scan(label, path, opts = {}) {
  await goto(path)
  const skip = page.getByText('跳过', { exact: true })
  if (await skip.count()) { await skip.first().click(); await sleep(600) }
  if (opts.guestSkip) {
    const guest = page.getByText('先看看', { exact: false })
    if (await guest.count()) { await guest.first().click(); await sleep(900) }
  }

  const res = await page.evaluate(() => {
    const broken = []
    document.querySelectorAll('img').forEach((img) => {
      if (img.src && img.naturalWidth === 0) broken.push(img.src.replace(location.origin, ''))
    })
    return { total: document.querySelectorAll('img').length, broken }
  })
  console.log(`[${label}] imgs: ${res.total} | broken: ${res.broken.length}${res.broken.length ? ' -> ' + JSON.stringify(res.broken.slice(0, 8)) : ''}`)

  await page.screenshot({ path: `${OUT}/${label}-top.png` })
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight)
    const sc = document.querySelector('div.overflow-auto, main')
    if (sc) sc.scrollTop = sc.scrollHeight
  })
  await sleep(500)
  await page.screenshot({ path: `${OUT}/${label}-bottom.png` })
}

try {
  await goto('/login')
  const guest = page.getByText('先看看', { exact: false })
  if (await guest.count()) { await guest.first().click(); await sleep(900) }

  for (const [label, path] of [['01-login', '/login'], ['02-home', '/'], ['03-checkin', '/checkin'], ['04-classroom', '/classroom'], ['05-garden', '/garden'], ['06-badges', '/badges'], ['07-profile', '/profile']]) {
    await scan(label, path)
  }

  // settings needs parent gate
  await goto('/settings')
  const q = await page.$$eval('p', (els) => els.map((e) => e.textContent).find((t) => /^\s*\d+\s*\+\s*\d+\s*=\s*\?\s*$/.test(t ?? ''))).catch(() => null)
  if (q) {
    const m = q.match(/(\d+)\s*\+\s*(\d+)/)
    await page.fill('input[type="number"]', String(Number(m[1]) + Number(m[2])))
    await page.getByText('确认', { exact: true }).click()
    await sleep(900)
    const res = await page.evaluate(() => {
      const broken = []
      document.querySelectorAll('img').forEach((img) => { if (img.src && img.naturalWidth === 0) broken.push(img.src.replace(location.origin, '')) })
      return { total: document.querySelectorAll('img').length, broken }
    })
    console.log(`[08-settings] imgs: ${res.total} | broken: ${res.broken.length}${res.broken.length ? ' -> ' + JSON.stringify(res.broken) : ''}`)
    await page.screenshot({ path: `${OUT}/08-settings-top.png` })
  }

  console.log('JS_ERRORS:', errors.length ? errors.join(' | ') : 'none')
  console.log('DONE. →', OUT)
} catch (e) {
  console.error('FAILED:', String(e))
  process.exit(1)
} finally {
  await browser.close()
}
