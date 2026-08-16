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
        { code: 'fiber_square', title: '', description: '', card_count: 2, quiz_count: 1, progress: 100, unlocked: true, stars: 2 },
        { code: 'ferment_workshop', title: '', description: '', card_count: 2, quiz_count: 1, progress: 100, unlocked: true, stars: 3 },
        { code: 'scfa_spring', title: '', description: '', card_count: 2, quiz_count: 1, progress: 100, unlocked: true, stars: 2 },
        { code: 'barrier_wall', title: '', description: '', card_count: 2, quiz_count: 1, progress: 100, unlocked: true, stars: 3 },
        { code: 'eco_station', title: '', description: '', card_count: 2, quiz_count: 1, progress: 100, unlocked: true, stars: 2 },
      ],
      currentCard: null, currentQuiz: null, quizScore: 0,
    },
    version: 0,
  }))
  localStorage.removeItem('gg-block-positions-classroom')
})
await page.goto('http://localhost:3000/classroom', { waitUntil: 'networkidle' })
await sleep(3000)
const out = await page.evaluate(() => {
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } }
  const trees = [...document.querySelectorAll('svg')].filter((s) => s.viewBox.baseVal && s.viewBox.baseVal.width === 34)
  const ktText = [...document.querySelectorAll('p')].find((e) => e.textContent.includes('知识树成长'))
  let card = null
  if (ktText) { let c = ktText; for (let i = 0; i < 8; i++) { c = c.parentElement; const cr = c.getBoundingClientRect(); if (cr.width >= 300 && cr.height >= 80) { card = rect(c); break } } }
  const infoText = [...document.querySelectorAll('p')].find((e) => e.textContent.includes('已探索'))
  const rewardText = [...document.querySelectorAll('span')].find((e) => e.textContent.includes('下一阶段奖励'))
  const giftIcon = [...document.querySelectorAll('svg')].find((s) => { const iu = s.querySelector('use'); return iu && iu.getAttribute('href')?.includes('gift') })
  const setBtn = [...document.querySelectorAll('button')].find((b) => b.title === '设置')
  const aiPanel = (() => {
    const ai = [...document.querySelectorAll('h3')].find((h) => h.textContent.includes('菌小园老师'))
    if (!ai) return null
    let c = ai
    for (let i = 0; i < 6 && c.parentElement; i++) { c = c.parentElement; const cr = c.getBoundingClientRect(); if (cr.width > 300 && cr.height > 300) return rect(c) }
    return null
  })()
  return {
    card, treePositions: trees.map(rect),
    infoText: infoText ? rect(infoText) : null,
    rewardText: rewardText ? rect(rewardText) : null,
    giftIcon: giftIcon ? rect(giftIcon) : null,
    setBtn: setBtn ? rect(setBtn) : null,
    aiPanel,
  }
})
console.log(JSON.stringify(out, null, 2))
await page.screenshot({ path: 'D:/GutGardenBeta/scratch/ktree_final.png' })
await browser.close()
