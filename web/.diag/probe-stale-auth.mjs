/* 模拟旧版 gg-auth（mode='registered' 但 user 缺 active_child_id）下点击卡片 */
import { spawn } from 'node:child_process'

const EXE = 'C:/Users/33273/AppData/Local/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-win64/chrome-headless-shell.exe'
const PORT = 9259
const BASE = 'http://localhost:3000'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const proc = spawn(EXE, [`--remote-debugging-port=${PORT}`, '--no-first-run', '--no-default-browser-check', '--no-sandbox', `--user-data-dir=D:/GutGardenBeta/web/.diag/cdp-stale-${Date.now()}`, 'about:blank'], { stdio: 'ignore' })
await sleep(2000)
const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
const page = targets.find((t) => t.type === 'page')
const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })

let id = 0
function send(method, params = {}) {
  const mid = ++id
  ws.send(JSON.stringify({ id: mid, method, params }))
  return new Promise((resolve) => { const onMsg = (e) => { const m = JSON.parse(e.data); if (m.id === mid) { ws.removeEventListener('message', onMsg); resolve(m) } }; ws.addEventListener('message', onMsg) })
}
async function evl(expr) {
  const m = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })
  if (m.result?.exceptionDetails) return '(ERR) ' + JSON.stringify(m.result.exceptionDetails.exception?.description || m.result.exceptionDetails.text)
  return m.result?.result?.value
}

await send('Page.enable'); await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false })

await send('Page.navigate', { url: `${BASE}/login` }); await sleep(2500)
// 旧版数据结构：mode='registered'，user 对象没有 active_child_id
const stale = JSON.stringify({ state: { mode: 'registered', user: { id: 1, name: '小明', phone: '13800000001' }, token: 'stale-token', loading: false }, version: 0 })
await evl(`localStorage.setItem('token','stale-token');localStorage.setItem('gg-auth',${JSON.stringify(stale)});localStorage.setItem('gg-onboarding-done','1');'ok'`)
await send('Page.navigate', { url: `${BASE}/checkin` }); await sleep(4500)

console.log('mode:', await evl(`(JSON.parse(localStorage.getItem('gg-auth')).state.mode)`) )
console.log('active_child_id:', await evl(`(JSON.parse(localStorage.getItem('gg-auth')).state.user?.active_child_id)`) )
console.log('页面有卡片:', await evl(`[...document.querySelectorAll('article')].filter(a=>(a.innerText||'').includes('去完成')).length`))

const pt = await evl(`(() => { const a=[...document.querySelectorAll('article')].find(x=>(x.innerText||'').includes('去完成')); if(!a)return null; const r=a.getBoundingClientRect(); return { x: r.left+r.width/2, y: r.top+r.height/2 } })()`)
console.log('点击前 pill:', await evl(`(() => { const a=[...document.querySelectorAll('article')].find(x=>(x.innerText||'').includes('去完成')); const p=[...a.querySelectorAll('span')].find(s=>(s.innerText||'').trim()==='去完成'); return p?.innerText?.trim() })()`))
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 })
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 })
await sleep(2000)
console.log('点击后 pill:', await evl(`(() => { const a=[...document.querySelectorAll('article')].find(x=>(x.innerText||'').includes('去完成')||(x.innerText||'').includes('已完成')); const p=[...a.querySelectorAll('span')].find(s=>['去完成','已完成','已补卡'].includes((s.innerText||'').trim())); return p?.innerText?.trim() })()`))
console.log('是否被踢到登录页:', await evl(`location.pathname`))

ws.close(); proc.kill(); console.log('\nDONE')
