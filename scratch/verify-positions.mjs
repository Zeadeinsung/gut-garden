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

// Save moved positions for node1_fiber
const savedPositions = {
  cloudBanner:  { x: 378, y: 0, w: 640, h: 130 },
  taskBar:      { x: 0, y: 696, w: 378, h: 145 },
  chestBar:     { x: 393, y: 696, w: 698, h: 145 },
  aiPanel:      { x: 1134, y: 13, w: 320, h: 807 },
  node1_fiber:  { x: 304, y: 265, w: 135, h: 44 },
  node2_ferment:{ x: 746, y: 208, w: 130, h: 44 },
  node3_scfa:   { x: 498, y: 383, w: 150, h: 44 },
  node4_barrier:{ x: 222, y: 611, w: 150, h: 44 },
  node5_eco:    { x: 852, y: 620, w: 150, h: 44 },
}
await page.evaluate((pos) => {
  localStorage.setItem('gg-block-positions-classroom', JSON.stringify(pos))
}, savedPositions)

await page.goto(`${BASE}/classroom`, { waitUntil: 'networkidle' })
await sleep(3000)

// Extract the computed left/top style of node1_fiber's wrapper div
const nodeInfo = await page.evaluate(() => {
  // In normal mode, the nodes are inside absolute-positioned divs
  // Find the div that contains the button with #1 circle
  const buttons = [...document.querySelectorAll('button')]
  const node1Btn = buttons.find(b => {
    const span = b.querySelector('span')
    return span && span.textContent?.trim() === '1' && span.className?.includes('rounded-full')
  })
  if (!node1Btn) return { error: 'node1 button not found' }
  const wrapper = node1Btn.closest('.absolute')
  if (!wrapper) return { error: 'no absolute wrapper found' }
  const style = wrapper.style
  return {
    left: style.left,
    top: style.top,
    transform: style.transform,
    computedLeft: getComputedStyle(wrapper).left,
    computedTop: getComputedStyle(wrapper).top,
  }
})
console.log('node1_fiber in normal mode:', JSON.stringify(nodeInfo, null, 2))

// Also get the saved localStorage value
const lsVal = await page.evaluate(() => localStorage.getItem('gg-block-positions-classroom'))
console.log('localStorage positions:', lsVal)

await browser.close()
