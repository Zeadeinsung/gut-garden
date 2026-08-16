import { chromium } from 'playwright-core'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const BASE = 'http://localhost:5173'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const errors = []
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
page.on('pageerror', (err) => errors.push('PAGEERROR: ' + err.message))
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await sleep(500)
await page.evaluate(() => {
  localStorage.clear()
  localStorage.setItem('gg-auth', JSON.stringify({ state: { mode: 'guest', user: { parent_id: 0, phone: '', children: [{ id: 1, name: '小明', age: 6, avatar_url: null }], active_child_id: 1 }, token: null, loading: false }, version: 0 }))
  localStorage.setItem('gg-ui', JSON.stringify({ state: { onboardingComplete: true, soundEnabled: true, editing: false, aiChatOpen: false, stoolModalOpen: false }, version: 0 }))
})
await page.goto(`${BASE}/classroom`, { waitUntil: 'networkidle' })
await sleep(3000)
const title = await page.title()
const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500))
console.log('TITLE:', title)
console.log('URL:', page.url())
console.log('BODY TEXT:', JSON.stringify(bodyText))
console.log('ERRORS:', errors.slice(0, 10))
// Check if scene image loaded
const imgState = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')].map(i => ({ src: i.src, complete: i.complete, nw: i.naturalWidth, nh: i.naturalHeight }))
  return imgs
})
console.log('IMGS:', JSON.stringify(imgState))
await page.screenshot({ path: 'D:/GutGardenBeta/scratch/debug_classroom.png' })
await browser.close()
