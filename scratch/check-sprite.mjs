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
  // Sprite: the absolute-positioned block div containing the bighead img
  const spriteImg = [...document.querySelectorAll('img[src*="char_bighead_home"]')][0]
  if (spriteImg) {
    const block = spriteImg.closest('div.absolute')
    result.spriteBlock = rect(block)
    result.spriteImg = rect(spriteImg)
    // speech bubble = sibling white rounded div of the img's parent
    const bubble = block?.querySelector('div.bg-white')
    if (bubble) result.bubble = rect(bubble)
  }
  // TaskBar: block div containing '今日小任务'
  const taskTitle = [...document.querySelectorAll('h3')].find((h) => h.textContent.includes('今日小任务'))
  if (taskTitle) {
    const block = taskTitle.closest('div.absolute')
    result.taskBar = rect(block)
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('查看任务'))
    if (btn) result.taskBtn = rect(btn)
    const icon = taskTitle.closest('div.glass-card')?.querySelector('img')
    if (icon) result.taskIcon = rect(icon)
  }
  return result
})
console.log(JSON.stringify(out, null, 2))
await browser.close()
