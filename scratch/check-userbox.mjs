import { chromium } from 'playwright-core'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1672, height: 941 } })
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' })
await new Promise(r => setTimeout(r, 400))
await page.evaluate(() => {
  localStorage.clear()
  localStorage.setItem('gg-auth', JSON.stringify({
    state: { mode: 'guest', user: { parent_id: 0, phone: '', children: [{ id: 1, name: '小明', age: 6, avatar_url: null }], active_child_id: 1 }, token: null, loading: false },
    version: 0,
  }))
  localStorage.setItem('gg-onboarding-done', '1')
})
await page.goto('http://localhost:3000/classroom', { waitUntil: 'networkidle' })
await new Promise(r => setTimeout(r, 2000))
const info = await page.evaluate(() => {
  const hasAvatar = !!document.querySelector('img[src*="ui_avatar_default_child"]')
  const nameShown = [...document.querySelectorAll('p')].some(p => p.textContent.includes('小明'))
  // userBox normal-mode div: contains the avatar img
  const avatarImg = document.querySelector('img[src*="ui_avatar_default_child"]')
  const userBox = avatarImg ? avatarImg.closest('div[class*="absolute"]') : null
  const cloud = [...document.querySelectorAll('p')].find(p => p.textContent.includes('探索课堂'))?.closest('[class*="rounded-b-"]')
  const out = { hasAvatar, nameShown }
  if (userBox) {
    const r = userBox.getBoundingClientRect()
    out.userBox = { left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: r.width, h: r.height }
  }
  if (cloud) {
    const r = cloud.getBoundingClientRect()
    out.cloud = { left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: r.width, h: r.height }
  }
  return out
})
console.log(JSON.stringify(info, null, 2))
await browser.close()
