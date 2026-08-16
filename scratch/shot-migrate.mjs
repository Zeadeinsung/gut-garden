import { chromium } from 'playwright-core'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const BASE = 'http://localhost:3000'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1672, height: 941 } })
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await sleep(500)

// Setup: auth + OLD stale position for node1_fiber (left side)
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
  // Old saved positions — node1 on the left
  localStorage.setItem('gg-block-positions-classroom', JSON.stringify({
    node1_fiber: { x: 244, y: 225, w: 135, h: 44 },
    node2_ferment: { x: 746, y: 208, w: 130, h: 44 },
    node3_scfa: { x: 498, y: 383, w: 150, h: 44 },
    node4_barrier: { x: 222, y: 611, w: 150, h: 44 },
    node5_eco: { x: 852, y: 620, w: 150, h: 44 },
  }))
})

await page.goto(`${BASE}/classroom`, { waitUntil: 'networkidle' })
await sleep(3000)

// Verify migration: node1 should now be at center
const info = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('button')]
  const node1Btn = buttons.find(b => {
    const span = b.querySelector('span')
    return span && span.textContent?.trim() === '1' && span.className?.includes('rounded-full')
  })
  if (!node1Btn) return { error: 'node1 not found' }
  const wrapper = node1Btn.parentElement?.closest('.absolute')
  if (!wrapper) return { error: 'no wrapper' }
  return {
    styleLeft: wrapper.style.left,
    styleTop: wrapper.style.top,
  }
})
console.log('after migration:', JSON.stringify(info))

// Also verify the saved positions were updated in localStorage
const ls = await page.evaluate(() => {
  const raw = localStorage.getItem('gg-block-positions-classroom')
  const parsed = raw ? JSON.parse(raw) : null
  return parsed?.node1_fiber
})
console.log('saved node1 pos:', JSON.stringify(ls))

await page.screenshot({ path: 'D:/GutGardenBeta/scratch/classroom_node1_center.png' })
console.log('saved classroom_node1_center.png')

await browser.close()
