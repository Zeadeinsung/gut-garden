import { chromium } from 'playwright-core'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const BASE = 'http://localhost:3000'
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
await sleep(3000)

const info = await page.evaluate(() => {
  const container = document.querySelector('[style*="position"]') // fallback
  const buttons = [...document.querySelectorAll('button')]
  const node1Btn = buttons.find(b => {
    const span = b.querySelector('span')
    return span && span.textContent?.trim() === '1' && span.className?.includes('rounded-full')
  })
  if (!node1Btn) return { error: 'node1 button not found' }
  const wrapper = node1Btn.closest('.absolute')
  if (!wrapper) return { error: 'no absolute wrapper found' }
  const rect = wrapper.getBoundingClientRect()
  return {
    styleLeft: wrapper.style.left,
    styleTop: wrapper.style.top,
    rectLeft: Math.round(rect.left),
    rectTop: Math.round(rect.top),
    rectWidth: Math.round(rect.width),
    rectHeight: Math.round(rect.height),
    // container ref — the scene canvas should be the phone-frame content area
    containerInfo: (() => {
      // find the visible absolute inset-0 container that holds nodes
      const all = [...document.querySelectorAll('.absolute')]
      return null
    })(),
  }
})
console.log('node1_fiber:', JSON.stringify(info, null, 2))

// Get viewport size and phone frame bounds
const layout = await page.evaluate(() => {
  const body = document.body.getBoundingClientRect()
  return {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    bodyRect: { left: Math.round(body.left), top: Math.round(body.top), width: Math.round(body.width), height: Math.round(body.height) },
  }
})
console.log('layout:', JSON.stringify(layout, null, 2))

await page.screenshot({ path: 'D:/GutGardenBeta/scratch/classroom_center.png' })
console.log('saved classroom_center.png')

await browser.close()
