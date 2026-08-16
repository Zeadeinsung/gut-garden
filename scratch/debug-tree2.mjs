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
      user: { parent_id: 0, phone: '', children: [{ id: 1, name: '小明', age: 6, avatar_url: null }], active_child_id: 1 },
      token: null, loading: false,
    }, version: 0,
  }))
  localStorage.setItem('gg-onboarding-done', '1')
})
await page.goto(`${BASE}/classroom`, { waitUntil: 'networkidle' })
await sleep(2000)
await page.keyboard.press('Control+e')
await sleep(600)

// 1) elementFromPoint at various targets
const hits = await page.evaluate(() => {
  const q = (x, y) => {
    const el = document.elementFromPoint(x, y)
    return el ? { tag: el.tagName, cls: String(el.className).slice(0, 70), hasGrab: String(el.className).includes('grab'), hasCoral: String(el.className).includes('coral') } : null
  }
  const labels = [...document.querySelectorAll('div')].filter((el) => el.className && String(el.className).includes('cursor-grab'))
  const treeLabel = labels.find((el) => el.textContent?.includes('knowledgeTree'))
  const treeBox = treeLabel ? treeLabel.parentElement.getBoundingClientRect() : null
  const res = {}
  if (treeBox) {
    res.treeSe = q(treeBox.right - 5, treeBox.bottom - 5)
    res.treeLabelBottom = q(treeBox.left + 40, treeBox.top - 2)
    res.treeBody = q(treeBox.left + 40, treeBox.top + 40)
  }
  // node2 label (mid page)
  const node2Label = labels.find((el) => el.textContent?.includes('node2_ferment'))
  if (node2Label) {
    const r = node2Label.getBoundingClientRect()
    res.node2Label = q(r.left + 30, r.top + 10)
    res.node2Box = { left: Math.round(node2Label.parentElement.getBoundingClientRect().left), top: Math.round(node2Label.parentElement.getBoundingClientRect().top) }
  }
  return res
})
console.log('hits:', JSON.stringify(hits, null, 2))

// 2) Try dragging node2 (mid page, no banner overlap)
const node2Label = page.locator('div', { hasText: 'node2_ferment' }).last()
const n2 = await node2Label.boundingBox()
console.log('node2 label bbox:', JSON.stringify(n2))
if (n2) {
  await page.mouse.move(n2.x + 30, n2.y + 10)
  await page.mouse.down()
  await page.mouse.move(n2.x + 30 + 150, n2.y + 10 + 90, { steps: 12 })
  await page.mouse.up()
  await sleep(500)
  const moved = await page.evaluate(() => {
    const label = [...document.querySelectorAll('div')].find((el) => el.textContent?.includes('node2_ferment') && el.className && String(el.className).includes('cursor-grab'))
    return label ? label.parentElement.getAttribute('style') : null
  })
  console.log('node2 block style after drag:', moved)
}

// 3) Try resizing tree card se handle with elementFromPoint check first
const tb = hits.treeBox ?? null
await page.evaluate(() => {
  // log whether the se handle is present
  const label = [...document.querySelectorAll('div')].find((el) => el.textContent?.includes('knowledgeTree') && el.className && String(el.className).includes('cursor-grab'))
  const se = label?.parentElement?.querySelector('.bg-garden-coral.rounded-full')
  return null
})

await browser.close()
