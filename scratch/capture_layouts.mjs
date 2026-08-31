// 轮询 3000 的 /__debug/positions 缓存，把每种不同的布局存到 scratch/layouts/
import http from 'node:http'
import fs from 'node:fs'

const OUT = 'D:/GutGardenBeta/scratch/layouts'
fs.mkdirSync(OUT, { recursive: true })

function getJson(url) {
  return new Promise((res, rej) => {
    http.get(url, (r) => { let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => { try { res(JSON.parse(d)) } catch (e) { rej(e) } }) }).on('error', rej)
  })
}

const seen = new Map() // sig -> index
const TARGET = 8
const DEADLINE = Date.now() + 300000
let count = 0

while (Date.now() < DEADLINE) {
  let body
  try { body = await getJson('http://localhost:3000/__debug/positions') } catch { await sleep(400); continue }
  const keys = Object.keys(body).filter((k) => k !== 'blocks' && k !== 'version')
  const sig = keys.sort().join(',')
  if (sig && !seen.has(sig)) {
    count++
    seen.set(sig, count)
    fs.writeFileSync(`${OUT}/${count}.json`, JSON.stringify(body, null, 2))
    console.log('CAPTURED', count, 'keys=', keys.length, 'sig=', sig.slice(0, 120))
  }
  if (count >= TARGET) break
  await sleep(400)
}
console.log('DONE collected', count)

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }
