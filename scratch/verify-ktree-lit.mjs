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
  localStorage.setItem('gg-classroom', JSON.stringify({
    state: {
      modules: [
        { code: 'fiber_square', title: '膳食纤维广场', description: '', card_count: 2, quiz_count: 1, progress: 100, unlocked: true, stars: 2 },
        { code: 'ferment_workshop', title: '菌菌发酵坊', description: '', card_count: 2, quiz_count: 1, progress: 100, unlocked: true, stars: 3 },
        { code: 'scfa_spring', title: '短链脂肪酸泉', description: '', card_count: 2, quiz_count: 1, progress: 100, unlocked: true, stars: 2 },
        { code: 'barrier_wall', title: '肠道屏障城', description: '', card_count: 2, quiz_count: 1, progress: 100, unlocked: true, stars: 3 },
        { code: 'eco_station', title: '生态观察站', description: '', card_count: 2, quiz_count: 1, progress: 100, unlocked: true, stars: 2 },
      ],
      currentCard: null,
      currentQuiz: null,
      quizScore: 0,
    },
    version: 0,
  }))
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
  if (trees[0]) {
    result.firstTree = rect(trees[0])
    const img = trees[0].cloneNode(true)
    const ctx = new OffscreenCanvas(34, 24).getContext('2d')
    const svgStr = new XMLSerializer().serializeToString(img)
    result.firstTreeInnerSvg = svgStr.slice(0, 120)
  }
  return result
})
console.log(JSON.stringify(out, null, 2))
await page.screenshot({ path: 'D:/GutGardenBeta/scratch/ktree_lit.png' })
console.log('saved')
await browser.close()
