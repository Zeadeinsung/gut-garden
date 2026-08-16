import { chromium } from 'playwright-core'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const BASE = 'http://localhost:3003'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1672, height: 941 } })
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await sleep(500)
await page.evaluate(() => {
  localStorage.clear()
  localStorage.setItem('gg-auth', JSON.stringify({
    state: {
      mode: 'guest',
      user: {
        parent_id: 0, phone: '',
        children: [{ id: 1, name: '小明', age: 6, avatar_url: null }],
        active_child_id: 1,
      },
      token: null, loading: false,
    },
    version: 0,
  }))
  localStorage.setItem('gg-onboarding-done', '1')
})
await page.goto(`${BASE}/classroom`, { waitUntil: 'networkidle' })
await sleep(2500)

const info = await page.evaluate(() => {
  const p = [...document.querySelectorAll('p')].find((el) => el.textContent?.includes('知识树成长'))
  if (!p) return { error: 'card title p not found' }
  // Climb to the card div: the one with rounded-[24px] class
  let el = p
  for (let i = 0; i < 6 && el; i++) {
    el = el.parentElement
    if (el && el.className && el.className.includes && String(el.className).includes('rounded-[24px]')) break
  }
  if (!el) return { error: 'card div not found' }
  const r = el.getBoundingClientRect()
  const header = document.querySelector('header')
  const hr = header ? header.getBoundingClientRect() : null
  const scene = document.querySelector('.absolute.inset-0') // scene canvas candidates
  return {
    card: { left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height), right: Math.round(r.right), bottom: Math.round(r.bottom) },
    viewport: { w: window.innerWidth, h: window.innerHeight },
    headerRect: hr ? { left: Math.round(hr.left), top: Math.round(hr.top), width: Math.round(hr.width), height: Math.round(hr.height) } : null,
  }
})
console.log('card:', JSON.stringify(info, null, 2))

// Also screenshot for visual reference
await page.screenshot({ path: 'D:/GutGardenBeta/scratch/tree_before.png' })
console.log('saved tree_before.png')
await browser.close()
