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
  // Find the rail element: the absolute div with bg-[#E2DCC6]
  const rail = [...document.querySelectorAll('div')].find((el) => {
    const bg = getComputedStyle(el).backgroundColor
    return bg === 'rgb(226, 220, 198)'
  })
  if (!rail) return { error: 'rail not found' }
  const rr = rail.getBoundingClientRect()
  const chestRow = rail.parentElement
  const cr = chestRow.getBoundingClientRect()
  const card = chestRow.parentElement.parentElement // chestRow -> card-inner? walk up
  const chain = []
  let el = rail
  for (let i=0;i<5 && el;i++){ chain.push({ cls:String(el.className).slice(0,60), r: Math.round(el.getBoundingClientRect().width) }); el=el.parentElement }
  return {
    rail: { l: Math.round(rr.left), r: Math.round(rr.right), w: Math.round(rr.width), top: Math.round(rr.top), h: Math.round(rr.height) },
    chestRow: { l: Math.round(cr.left), r: Math.round(cr.right), w: Math.round(cr.width) },
    chain,
    // card: find the element with rounded-[20px] (the card outer)
    card: (() => {
      let el = rail
      for (let i=0;i<10 && el;i++){
        if (String(el.className).includes('rounded-[20px]')) { const r=el.getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width), cls: String(el.className).slice(0,50) } }
        el = el.parentElement
      }
      return null
    })(),
  }
})
console.log(JSON.stringify(info, null, 2))
await browser.close()
