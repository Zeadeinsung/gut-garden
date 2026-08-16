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
await sleep(2500)

const info = await page.evaluate(() => {
  // scene canvas = div.absolute.inset-0.z-10 (the one with ref containerRef)
  const scene = [...document.querySelectorAll('div.absolute.inset-0')].find((el) => String(el.className).includes('z-10'))
  const wrapper = scene ? scene.parentElement : null
  const rec = (el) => { const r = el.getBoundingClientRect(); return { left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) } }
  return {
    scene: scene ? rec(scene) : null,
    wrapper: wrapper ? rec(wrapper) : null,
    doc: { w: document.documentElement.clientWidth, h: document.documentElement.clientHeight },
    bodyClass: document.body.className,
  }
})
console.log(JSON.stringify(info, null, 2))
await browser.close()
