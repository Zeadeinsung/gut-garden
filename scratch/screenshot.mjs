import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

// 1. BadgePage
await page.goto('http://localhost:3001/badges', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.screenshot({ path: 'D:/GutGardenBeta/.shots/shot_badge.png', fullPage: true });
console.log('BadgePage done');

// 2. CheckinPage
await page.goto('http://localhost:3001/checkin', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.screenshot({ path: 'D:/GutGardenBeta/.shots/shot_checkin.png', fullPage: true });
console.log('CheckinPage done');

// 3. ClassroomPage
await page.goto('http://localhost:3001/classroom', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.screenshot({ path: 'D:/GutGardenBeta/.shots/shot_classroom.png', fullPage: true });
console.log('ClassroomPage done');

await browser.close();
console.log('All screenshots captured');
