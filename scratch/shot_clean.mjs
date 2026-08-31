// 捕获干净首页/花园：跳过引导、清空布局存档、多视口对比
import http from 'node:http'
import fs from 'node:fs'

const CDP = 'http://127.0.0.1:9222'
const BASE = 'http://localhost:5174'
const OUT = 'D:/GutGardenBeta/scratch/shots/current'

function getJson(url) {
  return new Promise((res, rej) => {
    http.get(url, (r) => { let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => { try { res(JSON.parse(d)) } catch (e) { rej(e) } }) }).on('error', rej)
  })
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let page
for (let i = 0; i < 30; i++) {
  try {
    const targets = await getJson(CDP + '/json')
    page = targets.find((t) => t.type === 'page')
    if (page) break
  } catch { /* retry */ }
  await sleep(500)
}
if (!page) throw new Error('CDP not ready')

const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j })
let id = 0
const pending = new Map()
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) {
    const p = pending.get(m.id); pending.delete(m.id)
    m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result)
  }
}
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const msgId = ++id; pending.set(msgId, { resolve, reject })
  ws.send(JSON.stringify({ id: msgId, method, params }))
})

await send('Page.enable')
await send('Runtime.enable')
await send('Network.enable')

const gg = JSON.stringify({
  state: { mode: 'guest', user: { parent_id: 0, phone: '', children: [{ id: 1, name: '小园丁', age: 6, avatar_url: null }], active_child_id: 1 }, token: null, loading: false },
  version: 0,
})

fs.mkdirSync(OUT, { recursive: true })

async function shot(name, route, w, h) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: BASE + '/login' })
  await sleep(2500)
  await send('Runtime.evaluate', { expression: `localStorage.setItem('gg-auth', ${JSON.stringify(gg)}); localStorage.setItem('gg-onboarding-done','1'); localStorage.removeItem('gg-block-positions-home'); localStorage.removeItem('gg-block-positions-garden'); 'ok'` })
  await send('Page.navigate', { url: BASE + route })
  await sleep(4500)
  const { data } = await send('Page.captureScreenshot', { format: 'png' })
  const file = `${OUT}/${name}.png`
  fs.writeFileSync(file, Buffer.from(data, 'base64'))
  console.log('shot', name, `${w}x${h}`, file)
}

await shot('home_1440', '/', 1440, 900)
await shot('home_1024', '/', 1024, 768)
await shot('garden_1440', '/garden', 1440, 900)
await shot('garden_1024', '/garden', 1024, 768)

ws.close()
console.log('done')
