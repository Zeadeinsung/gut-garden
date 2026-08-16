// Browser test: open AI chat modal on Classroom page, send a question, verify streaming reply.
import { chromium } from 'playwright-core'

const BASE = 'http://localhost:3000'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

try {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await sleep(400)
  await page.evaluate(() => localStorage.clear())

  // Enter guest browsing mode
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await sleep(800)
  const guest = page.getByText('先看看', { exact: false })
  if (!(await guest.count())) throw new Error('guest browse button not found')
  await guest.click()
  await sleep(800)
  console.log('after guest click URL:', page.url())

  await page.goto(`${BASE}/classroom`, { waitUntil: 'networkidle' })
  await sleep(1500)

  const skip = page.getByText('跳过', { exact: true })
  if (await skip.count()) { await skip.click(); await sleep(500) }

  const chatBtn = page.getByText('和我聊天', { exact: true })
  if (!(await chatBtn.count())) throw new Error('chat button not found on classroom page')
  await chatBtn.click()
  await sleep(600)

  await page.screenshot({ path: 'shots/ai-modal-open.png' })

  await page.getByPlaceholder('问问菌小园...').fill('为什么放屁会臭？')
  await page.getByText('发送', { exact: true }).click()
  await sleep(2500)

  await page.screenshot({ path: 'shots/ai-chat-reply.png' })

  const bubbles = await page.locator('.whitespace-pre-wrap').allTextContents()
  console.log('BUBBLES:', JSON.stringify(bubbles))
  const last = bubbles[bubbles.length - 1] || ''
  const ok = last.length > 0 && !last.includes('…')
  console.log(ok ? 'REPLY_OK' : 'REPLY_MISSING')
  process.exit(ok ? 0 : 1)
} catch (e) {
  console.error('FAILED:', String(e))
  process.exit(1)
} finally {
  await browser.close()
}
