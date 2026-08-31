// 用 CDP 驱动 headless Chrome：注入游客会话 → 依次截取主页面
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

// 等待 debugger 就绪
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

// 先到登录页注入游客会话
await send('Page.navigate', { url: BASE + '/login' })
await sleep(3000)
const gg = JSON.stringify({
  state: { mode: 'guest', user: { parent_id: 0, phone: '', children: [{ id: 1, name: '小园丁', age: 6, avatar_url: null }], active_child_id: 1 }, token: null, loading: false },
  version: 0,
})
await send('Runtime.evaluate', { expression: `localStorage.setItem('gg-auth', ${JSON.stringify(gg)}); 'ok'` })

fs.mkdirSync(OUT, { recursive: true })
const routes = {
  home: '/',
  garden: '/garden',
  checkin: '/checkin',
  stool: '/stool',
  classroom: '/classroom',
  badges: '/badges',
  report: '/report',
  profile: '/profile',
  settings: '/settings',
}

for (const [name, route] of Object.entries(routes)) {
  await send('Page.navigate', { url: BASE + route })
  await sleep(4500)
  const { data } = await send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from(data, 'base64'))
  console.log('shot', name, `${OUT}/${name}.png`)
}

ws.close()
console.log('done')
