// 生成原创音效（celebrate / coin）→ web/public/audio/*.wav
// 全部由正弦/谐波合成，无任何采样来源，可自由商用（相当于 CC0 / 公共领域）。
// 用法：node scripts/generate-sfx.mjs
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '../public/audio')
mkdirSync(outDir, { recursive: true })

const SR = 44100
const NOTE = { C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.5, E6: 1318.51, B5: 987.77 }

function writeWav(path, samples) {
  const n = samples.length
  const buf = Buffer.alloc(44 + n * 2)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + n * 2, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(1, 22)
  buf.writeUInt32LE(SR, 24)
  buf.writeUInt32LE(SR * 2, 28)
  buf.writeUInt16LE(2, 32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(n * 2, 40)
  for (let i = 0; i < n; i++) {
    let v = Math.max(-1, Math.min(1, samples[i]))
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2)
  }
  writeFileSync(path, buf)
}

// 带谐波 + 指数衰减 + 短起音的单音
function note(freq, dur, amp, decay, attack = 0.004) {
  const n = Math.floor(dur * SR)
  const out = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const env = Math.exp(-t * decay) * Math.min(1, t / attack)
    const f = 2 * Math.PI * freq * t
    out[i] = (Math.sin(f) + 0.35 * Math.sin(2 * f) + 0.12 * Math.sin(3 * f)) * amp * env
  }
  return out
}

function addAt(mix, src, offsetSec) {
  const off = Math.floor(offsetSec * SR)
  for (let i = 0; i < src.length; i++) {
    const j = off + i
    if (j < mix.length) mix[j] += src[i]
  }
}

function normalize(mix) {
  let peak = 0
  for (const v of mix) peak = Math.max(peak, Math.abs(v))
  if (peak > 0) {
    const g = 0.9 / peak
    for (let i = 0; i < mix.length; i++) mix[i] *= g
  }
  return mix
}

// ── celebrate：C 大调上行琶音 + 结尾高音点缀（庆典） ──
{
  const dur = 1.6
  const mix = new Float64Array(Math.floor(dur * SR))
  const seq = [
    { f: NOTE.C5, t: 0.00, amp: 1.0, decay: 2.6, len: 0.6 },
    { f: NOTE.E5, t: 0.13, amp: 0.9, decay: 2.6, len: 0.6 },
    { f: NOTE.G5, t: 0.26, amp: 0.85, decay: 2.6, len: 0.6 },
    { f: NOTE.C6, t: 0.39, amp: 0.95, decay: 2.2, len: 0.9 },
    { f: NOTE.E6, t: 0.60, amp: 0.5, decay: 3.0, len: 0.7 },
  ]
  for (const s of seq) addAt(mix, note(s.f, s.len, s.amp, s.decay), s.t)
  writeWav(join(outDir, 'celebrate.wav'), normalize(mix))
}

// ── coin：轻快双音“叮叮”（金币） ──
{
  const dur = 0.55
  const mix = new Float64Array(Math.floor(dur * SR))
  addAt(mix, note(NOTE.B5, 0.4, 1.0, 6.0), 0.00)
  addAt(mix, note(NOTE.E6, 0.45, 0.9, 6.5), 0.10)
  writeWav(join(outDir, 'coin.wav'), normalize(mix))
}

console.log('done:', join(outDir, 'celebrate.wav'), join(outDir, 'coin.wav'))
