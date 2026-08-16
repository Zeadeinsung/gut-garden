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

const info = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('button')]
  const results = {}
  for (let i = 1; i <= 5; i++) {
    const btn = buttons.find(b => {
      const span = b.querySelector('span')
      return span && span.textContent?.trim() === String(i) && span.className?.includes('rounded-full')
    })
    if (!btn) { results['node'+i] = 'not found'; continue }
    const wrapper = btn.closest('.absolute') || btn.parentElement
    const rect = wrapper.getBoundingClientRect()
    results['node'+i] = {
      left: Math.round(rect.left), top: Math.round(rect.top),
      w: Math.round(rect.width), h: Math.round(rect.height),
      styleLeft: wrapper.style.left, styleTop: wrapper.style.top,
    }
  }
  return results
})
console.log(JSON.stringify(info, null, 2))
await browser.close()
