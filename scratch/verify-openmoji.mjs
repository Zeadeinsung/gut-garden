// Verify: OpenMoji <img> assets load, Lucide line icons still render, no JS errors.
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:3000'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const OUT = 'D:/GutGardenBeta/scratch/shots/openmoji'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

const PAGES = [
  ['01-login', '/login', false],
  ['02-home', '/', true],
  ['03-checkin', '/checkin', true],
  ['04-classroom', '/classroom', true],
  ['05-garden', '/garden', true],
  ['06-badges', '/badges', true],
  ['07-profile', '/profile', true],
  ['08-report', '/report', true],
  ['09-settings', '/settings', true],
]

async function goto(path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' })
  await sleep(1000)
}

async function scan(label, path) {
  await goto(path)
  // skip onboarding if present
  const skip = page.getByText('跳过', { exact: true })
  if (await skip.count()) { await skip.first().click(); await sleep(600) }

  const res = await page.evaluate(() => {
    const broken = []
    document.querySelectorAll('img').forEach((img) => {
      if (img.src && img.naturalWidth === 0) broken.push(img.src.replace(location.origin, ''))
    })
    return {
      cute: document.querySelectorAll('img[src*="/assets/openmoji/"]').length,
      lucide: document.querySelectorAll('nav svg, header svg').length, // rough
      svgs: document.querySelectorAll('svg').length,
      broken,
    }
  })
  const imgs = await page.$$eval('img[src*="/assets/openmoji/"]', (els) =>
    els.map((el) => ({ src: el.getAttribute('src'), ok: el.naturalWidth > 0, w: el.width, h: el.height }))
  )
  const zero = imgs.filter((i) => !i.ok)
  const tiny = imgs.filter((i) => i.w === 0)
  console.log(`[${label}] cute img: ${imgs.length} | broken: ${zero.length} | zero-size: ${tiny.length}`)
  if (res.broken.length) console.log('   broken any-img:', JSON.stringify(res.broken.slice(0, 5)))

  await page.screenshot({ path: `${OUT}/${label}-top.png` })
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight)
    const sc = document.querySelector('div.overflow-auto, main')
    if (sc) sc.scrollTop = sc.scrollHeight
  })
  await sleep(400)
  await page.screenshot({ path: `${OUT}/${label}-bottom.png` })
  console.log(`   📸 ${label}`)
}

try {
  // guest quick-browse first so /home etc. are reachable
  await goto('/login')
  const guest = page.getByText('先看看', { exact: false })
  if (await guest.count()) { await guest.first().click(); await sleep(1000) }

  for (const [label, path] of PAGES) await scan(label, path)

  // settings needs parent gate answer
  await goto('/settings')
  const q = await page.$$eval('p', (els) => els.map((e) => e.textContent).find((t) => /^\s*\d+\s*\+\s*\d+\s*=\s*\?\s*$/.test(t ?? ''))).catch(() => null)
  if (q) {
    const m = q.match(/(\d+)\s*\+\s*(\d+)/)
    await page.fill('input[type="number"]', String(Number(m[1]) + Number(m[2])))
    await page.getByText('确认', { exact: true }).click()
    await sleep(900)
    const imgs = await page.$$eval('img[src*="/assets/openmoji/"]', (els) => els.map((el) => ({ src: el.getAttribute('src'), ok: el.naturalWidth > 0 })))
    console.log(`[10-settings] cute img: ${imgs.length} | broken: ${imgs.filter((i) => !i.ok).length}`)
    await page.screenshot({ path: `${OUT}/10-settings-top.png` })
  }

  // stool modal
  await goto('/')
  const stoolBtn = page.locator('button:has-text("拍便便")').first()
  if (await stoolBtn.count()) { await stoolBtn.click(); await sleep(800) }
  const modalImgs = await page.$$eval('img[src*="/assets/openmoji/"]', (els) => els.map((el) => ({ src: el.getAttribute('src'), ok: el.naturalWidth > 0 })))
  console.log(`[11-stool-modal] cute img: ${modalImgs.length} | broken: ${modalImgs.filter((i) => !i.ok).length}`)
  await page.screenshot({ path: `${OUT}/11-stool-modal.png` })

  console.log('JS_ERRORS:', errors.length ? errors.join(' | ') : 'none')
  console.log('DONE. →', OUT)
} catch (e) {
  console.error('FAILED:', String(e))
  process.exit(1)
} finally {
  await browser.close()
}
