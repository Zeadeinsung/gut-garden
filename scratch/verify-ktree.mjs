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
  localStorage.removeItem('gg-block-positions-classroom')
})
await page.goto('http://localhost:3000/classroom', { waitUntil: 'networkidle' })
await sleep(3000)
const out = await page.evaluate(() => {
  const rect = (el) => {
    const r = el.getBoundingClientRect()
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }
  }
  const result = {}
  const ktText = [...document.querySelectorAll('p')].find((e) => e.textContent.includes('知识树成长'))
  if (ktText) {
    result.ktText = rect(ktText)
    let c = ktText
    for (let i = 0; i < 8; i++) {
      c = c.parentElement
      const cr = c.getBoundingClientRect()
      if (cr.width >= 300 && cr.height >= 80) { result.ktCard = rect(c); break }
    }
  }
  const trees = [...document.querySelectorAll('svg')].filter((s) => s.viewBox.baseVal && s.viewBox.baseVal.width === 34)
  result.treeCount = trees.length
  if (trees[0]) result.firstTree = rect(trees[0])
  if (trees[1]) result.secondTree = rect(trees[1])
  const setBtn = [...document.querySelectorAll('button')].find((b) => b.title === '设置')
  if (setBtn) result.settingsBtn = rect(setBtn)
  const aiTitle = [...document.querySelectorAll('h3')].find((h) => h.textContent.includes('菌小园老师'))
  if (aiTitle) {
    let c = aiTitle
    for (let i = 0; i < 6 && c.parentElement; i++) {
      c = c.parentElement
      const cr = c.getBoundingClientRect()
      if (cr.width > 300 && cr.height > 300) { result.aiPanel = rect(c); break }
    }
  }
  return result
})
console.log(JSON.stringify(out, null, 2))
await page.screenshot({ path: 'D:/GutGardenBeta/scratch/ktree_new.png' })
console.log('saved')
await browser.close()
