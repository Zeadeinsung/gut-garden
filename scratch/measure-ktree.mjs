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
  // Knowledge tree module: find text '知识树成长'
  const els = [...document.querySelectorAll('span,div,h3,p')].filter((e) => e.textContent.includes('知识树成长') && e.textContent.length < 20)
  if (els[0]) {
    result.knowledgeTreeText = rect(els[0])
    // its closest container
    let c = els[0]
    for (let i = 0; i < 5 && c.parentElement; i++) {
      c = c.parentElement
      const cr = c.getBoundingClientRect()
      if (cr.width > 150 && cr.height > 20) { result.knowledgeTreeContainer = rect(c); break }
    }
  }
  // header
  const header = document.querySelector('header')
  if (header) result.header = rect(header)
  // back button + logo
  const backBtn = [...document.querySelectorAll('button')].find((b) => b.title === '返回' || b.title === 'back')
  if (backBtn) result.backBtn = rect(backBtn)
  const logo = document.querySelector('img[src*="ui_logo"]')
  if (logo) result.logo = rect(logo)
  // settings button
  const setBtn = [...document.querySelectorAll('button')].find((b) => b.title === '设置')
  if (setBtn) result.settingsBtn = rect(setBtn)
  // ai panel
  const aiTitle = [...document.querySelectorAll('h3')].find((h) => h.textContent.includes('菌小园老师'))
  if (aiTitle) {
    result.aiTitle = rect(aiTitle)
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
await page.screenshot({ path: 'D:/GutGardenBeta/scratch/ktree_current.png' })
console.log('saved screenshot')
await browser.close()
