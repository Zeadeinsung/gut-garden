// Screenshot BadgePage, CheckinPage, ClassroomPage as guest
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:3001'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
mkdirSync('D:/GutGardenBeta/.shots', { recursive: true })

const GUEST_AUTH = {
  state: {
    mode: 'guest',
    user: { parent_id: 0, phone: '', children: [{ id: 1, name: '小园丁', age: 6, avatar_url: null }], active_child_id: 1 },
    token: null,
    loading: false,
  },
  version: 0,
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const errors = []
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()
// Inject guest auth before every page load
await page.addInitScript((auth) => {
  localStorage.setItem('gg-auth', JSON.stringify(auth))
  localStorage.setItem('gg-onboarding-done', '1')
}, GUEST_AUTH)
page.on('pageerror', (e) => errors.push(`pageerror: ${String(e)}`))
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`) })

async function shot(name, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 20000 })
  await sleep(5000)
  const url = page.url()
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 200))
  console.log(`${name}: URL=${url}`)
  console.log(`  TEXT: ${bodyText.replace(/\n/g, ' | ')}`)
  await page.screenshot({ path: `D:/GutGardenBeta/.shots/${name}.png` })
  console.log(`  Saved ${name}.png`)
}

await shot('badge', '/badges')
await shot('checkin', '/checkin')
await shot('classroom', '/classroom')

await browser.close()
if (errors.length > 0) {
  console.log('\nErrors:')
  errors.forEach((e) => console.log(`  ${e}`))
}
console.log('Done.')
