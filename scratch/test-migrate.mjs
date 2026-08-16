import { chromium } from 'playwright-core'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1672, height: 941 } })
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' })
await sleep(500)
await page.evaluate(() => {
  localStorage.clear()
  localStorage.setItem('gg-auth', JSON.stringify({
    state: { mode: 'guest', user: { parent_id: 0, phone: '', children: [{ id: 1, name: '小明', age: 6, avatar_url: null }], active_child_id: 1 }, token: null, loading: false },
    version: 0,
  }))
  localStorage.setItem('gg-onboarding-done', '1')
  // OLD saved positions: node1 on left, all old narrow widths
  localStorage.setItem('gg-block-positions-classroom', JSON.stringify({
    cloudBanner:  { x: 378, y: 0, w: 640, h: 130 },
    taskBar:      { x: 0, y: 696, w: 378, h: 145 },
    chestBar:     { x: 393, y: 696, w: 698, h: 145 },
    aiPanel:      { x: 1134, y: 13, w: 320, h: 807 },
    node1_fiber:  { x: 244, y: 225, w: 160, h: 54 },
    node2_ferment:{ x: 746, y: 208, w: 155, h: 54 },
    node3_scfa:   { x: 498, y: 383, w: 175, h: 54 },
    node4_barrier:{ x: 222, y: 611, w: 175, h: 54 },
    node5_eco:    { x: 852, y: 620, w: 175, h: 54 },
  }))
})
await page.goto('http://localhost:3000/classroom', { waitUntil: 'networkidle' })
await sleep(3000)
const info = await page.evaluate(() => {
  const raw = localStorage.getItem('gg-block-positions-classroom')
  const parsed = JSON.parse(raw)
  return {
    node1: parsed.node1_fiber,
    node2: parsed.node2_ferment,
    node3: parsed.node3_scfa,
    node4: parsed.node4_barrier,
    node5: parsed.node5_eco,
  }
})
console.log('after migration:', JSON.stringify(info, null, 2))
await browser.close()
