// Screenshot badge page with delivered icons (guest mode, seeded store).
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:3000'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
mkdirSync('D:/GutGardenBeta/shots', { recursive: true })

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

const ICON = (f) => `/assets/badges/icons/${f}.png`

const RAW = [
  ['first_checkin', '初来乍到', 'persistence', 'badge_first_checkin_icon'],
  ['persist_3d', '初露锋芒', 'persistence', 'badge_persist_3d_icon'],
  ['persist_7d', '一周之星', 'persistence', 'badge_persist_7d_icon'],
  ['persist_30d', '月度冠军', 'persistence', 'badge_persist_30d_icon'],
  ['persist_100d', '百日守护', 'persistence', 'badge_persist_100d_icon'],
  ['first_feed', '初次投喂', 'exploration', 'badge_first_feed_icon'],
  ['feed_50', '小小农夫', 'exploration', 'badge_feed_50_icon'],
  ['first_magnifier', '小小科学家', 'exploration', 'badge_first_magnifier_icon'],
  ['magnifier_20', '放大镜专家', 'exploration', 'badge_magnifier_20_icon'],
  ['garden_doctor', '花园医生', 'exploration', 'badge_garden_doctor_icon'],
  ['first_quiz', '好奇宝宝', 'knowledge', 'badge_first_quiz_icon'],
  ['quiz_10', '答题小能手', 'knowledge', 'badge_quiz_10_icon'],
  ['first_stool', '便便观察员', 'knowledge', 'badge_first_stool_icon'],
  ['stool_streak_7', '持续观察', 'knowledge', 'badge_stool_streak_7_icon'],
  ['module_fiber', '纤维专家', 'knowledge', 'badge_module_fiber_icon'],
  ['module_all_5', '知识全能王', 'knowledge', 'badge_module_all_5_icon'],
  ['type4_streak_5', '超级便便', 'special', 'badge_type4_streak_5_icon'],
  ['perfect_week', '完美一周', 'special', 'badge_perfect_week_icon'],
  ['all_sub_7d', '全能小冠军', 'special', 'badge_all_sub_7d_icon'],
  ['birthday', '花园生日', 'special', 'badge_birthday_icon'],
  ['spring_festival', '春节彩蛋', 'special', 'badge_spring_festival_icon'],
]

const DEFS = RAW.map(([code, name, category, file], i) => ({
  id: i + 1, code, name, description: name, category, icon_url: ICON(file),
}))

const AWARDED = [
  { id: 1, badge_id: 1,  code: 'first_checkin',   name: '初来乍到',   rarity: 'bronze', awarded_at: new Date().toISOString() },
  { id: 2, badge_id: 7,  code: 'feed_50',         name: '小小农夫',   rarity: 'silver', awarded_at: new Date().toISOString() },
  { id: 3, badge_id: 4,  code: 'persist_30d',     name: '月度冠军',   rarity: 'gold',   awarded_at: new Date().toISOString() },
  { id: 4, badge_id: 18, code: 'perfect_week',    name: '完美一周',   rarity: 'gold',   awarded_at: new Date().toISOString() },
  { id: 5, badge_id: 15, code: 'module_fiber',    name: '纤维专家',   rarity: 'bronze', awarded_at: new Date().toISOString() },
  { id: 6, badge_id: 14, code: 'stool_streak_7',  name: '持续观察',   rarity: 'silver', awarded_at: new Date().toISOString() },
  { id: 7, badge_id: 12, code: 'quiz_10',         name: '答题小能手', rarity: 'silver', awarded_at: new Date().toISOString() },
  { id: 8, badge_id: 21, code: 'spring_festival', name: '春节彩蛋',   rarity: 'bronze', awarded_at: new Date().toISOString() },
]

try {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await sleep(500)
  const guest = page.getByText('先看看', { exact: false })
  if (await guest.count()) { await guest.click(); await sleep(800) }

  await page.evaluate(([defs, awarded]) => {
    localStorage.setItem('gg-badges', JSON.stringify({ state: { awarded, pending: [], defs }, version: 0 }))
    localStorage.removeItem('gg-block-positions-badges')
  }, [DEFS, AWARDED])

  await page.goto(`${BASE}/badges`, { waitUntil: 'networkidle' })
  await sleep(1500)

  const skip = page.getByText('跳过', { exact: true })
  if (await skip.count()) { await skip.click(); await sleep(500) }

  const imgs = await page.$$eval('img[src*="badges/icons"]', (els) =>
    els.map((el) => ({ src: el.getAttribute('src'), ok: el.naturalWidth > 0 }))
  )
  const broken = imgs.filter((i) => !i.ok)
  console.log('rendered badge icon imgs:', imgs.length, '| broken:', broken.length, JSON.stringify(broken.slice(0, 3)))

  const catChips = await page.$$eval('span.text-amber-800', (els) => els.map((e) => e.textContent))
  console.log('category labels:', JSON.stringify(catChips))

  await page.screenshot({ path: 'D:/GutGardenBeta/shots/badges-delivered.png', fullPage: true })

  // Scroll the frame's scroll area to the bottom to reveal shelf 4 + bottom cards
  const scrolled = await page.evaluate(() => {
    const el = document.querySelector('div.overflow-auto')
    if (!el) return false
    el.scrollTop = el.scrollHeight
    return el.scrollHeight - el.scrollTop - el.clientHeight < 2
  })
  await sleep(400)
  await page.screenshot({ path: 'D:/GutGardenBeta/shots/badges-delivered-bottom.png', fullPage: true })
  console.log('scrolled to bottom:', scrolled)

  console.log('JS_ERRORS:', errors.length ? errors.join(' | ') : 'none')
  console.log('DONE.')
} catch (e) {
  console.error('FAILED:', String(e))
  process.exit(1)
} finally {
  await browser.close()
}
