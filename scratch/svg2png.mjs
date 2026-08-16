import { chromium } from 'playwright-core'
import { pathToFileURL } from 'node:url'
const CHROME = 'C:/Users/33273/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 600, height: 650 } })
await page.goto(pathToFileURL('D:/GutGardenBeta/scratch/kk-preview2.svg').href)
await page.waitForTimeout(300)
await page.screenshot({ path: 'D:/GutGardenBeta/.shots/kk-preview2.png' })
await browser.close()
console.log('saved kk-preview2.png')
