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
  // totalStars = 5 → chests 1, 3, 5 lit; 8, 12 locked
  const codes = ['fiber_square', 'ferment_workshop', 'scfa_spring', 'barrier_wall', 'eco_station']
  const stars = [2, 1, 1, 1, 0]
  localStorage.setItem('gg-classroom', JSON.stringify({
    state: {
      modules: codes.map((code, i) => ({
        code,
        title: code,
        description: '',
        card_count: 6,
        quiz_count: 3,
        progress: stars[i] / 6,
        unlocked: true,
        stars: stars[i],
      })),
      currentCard: null,
      currentQuiz: null,
      quizScore: 0,
    }, version: 0,
  }))
  localStorage.setItem('gg-onboarding-done', '1')
})
await page.goto(`${BASE}/classroom`, { waitUntil: 'networkidle' })
await sleep(2500)
await page.screenshot({ path: 'D:/GutGardenBeta/scratch/current_classroom_lit.png' })
const chest = await page.evaluate(() => {
  const img = [...document.querySelectorAll('img')].find((el) => (el.getAttribute('src') || '').includes('chest'))
  let el = img
  for (let i = 0; i < 10 && el; i++) {
    el = el.parentElement
    if (el && el.className && String(el.className).includes('rounded-')) break
  }
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }
})
console.log('chest bar bounds:', JSON.stringify(chest))
await browser.close()
