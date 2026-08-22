/**
 * Batch image optimizer for Gut Garden.
 *
 * Scans web/src + web/public for every referenced raster asset (/assets/...png|jpg),
 * resizes each to a usage-appropriate width and re-encodes it as WebP.
 *
 * Originals are left untouched (git tracks them), so this is fully reversible:
 *   - to keep the new .webp: nothing to do
 *   - to revert: `git checkout -- web/src web/public` + remove the generated .webp
 *
 * Usage:  cd web && node optimize-images.mjs
 * Requires: sharp  (npm install --no-save sharp)
 */
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const webDir = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(webDir, 'public')
const srcDir = path.join(webDir, 'src')

/* 1. Collect referenced raster assets ------------------------------------- */
const refs = new Set()
function scanText(dir) {
  let entries
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (/node_modules|(^|[\\/])assets([\\/]|$)/.test(p)) continue
      scanText(p)
    } else if (/\.(tsx?|jsx?|html?|css)$/i.test(e.name)) {
      const txt = fs.readFileSync(p, 'utf8')
      for (const m of txt.matchAll(/\/assets\/[A-Za-z0-9_/.-]+\.(png|jpe?g)/gi)) refs.add(m[0])
    }
  }
}
scanText(srcDir)
scanText(publicDir)
console.log(`Found ${refs.size} referenced raster assets.`)

/* 2. Size targets per usage ------------------------------------------------ */
function targetFor(ref) {
  if (ref.startsWith('/assets/scenes/'))   return { w: 1400, q: 80, label: 'scene-bg' }
  if (ref.includes('/ui/ui_kingkong_'))    return { w: 640,  q: 82, label: 'kingkong' }
  if (ref.includes('ui_badge_cabinet'))    return { w: 960,  q: 82, label: 'badge-cabinet' }
  if (ref.includes('/ui/chest_'))          return { w: 320,  q: 82, label: 'chest' }
  if (ref.includes('/badges/icons/'))      return { w: 192,  q: 85, label: 'badge-icon' }
  if (ref.includes('/badges/frames/'))     return { w: 256,  q: 85, label: 'badge-frame' }
  if (ref.includes('/characters/'))        return { w: 256,  q: 82, label: 'character' }
  if (ref.includes('/tasks/'))             return { w: 400,  q: 82, label: 'task' }
  if (ref.includes('/stools/'))            return { w: 256,  q: 85, label: 'stool' }
  if (ref.includes('/foods/'))             return { w: 160,  q: 85, label: 'food' }
  if (ref.includes('/cards/'))             return { w: 480,  q: 82, label: 'card' }
  if (ref.includes('/ui/'))                return { w: 480,  q: 82, label: 'ui' }
  return                                     { w: 800,  q: 82, label: 'default' }
}

/* 3. Convert ----------------------------------------------------------------- */
const manifest = []
let totalBefore = 0, totalAfter = 0
for (const ref of [...refs].sort()) {
  const abs = path.join(publicDir, ref.replace(/^\//, ''))
  if (!fs.existsSync(abs)) { console.warn('  MISSING:', ref); continue }
  const meta = await sharp(abs).metadata()
  if (meta.pages && meta.pages > 1) { console.log('  SKIP animated:', ref); continue }

  const newRef = ref.replace(/\.(png|jpe?g)$/i, '.webp')
  const outAbs = path.join(publicDir, newRef.replace(/^\//, ''))
  const t = targetFor(ref)

  let pipe = sharp(abs)
  if (meta.width && meta.width > t.w) pipe = pipe.resize({ width: t.w, withoutEnlargement: true })
  const buf = await pipe.webp({ quality: t.q, effort: 4 }).toBuffer()
  fs.writeFileSync(outAbs, buf)

  const before = fs.statSync(abs).size
  const after = buf.length
  totalBefore += before; totalAfter += after
  manifest.push({ ref, newRef, label: t.label, targetW: t.w, beforeKB: Math.round(before / 1024), afterKB: Math.round(after / 1024), pct: Math.round(100 - (100 * after) / before) })
  console.log(`  ${ref.padEnd(52)} ${String(Math.round(before / 1024)).padStart(5)}KB -> ${String(Math.round(after / 1024)).padStart(5)}KB  (${Math.round(100 - (100 * after) / before)}% smaller)`)
}

const outJson = path.resolve(webDir, '..', '.shots', 'image_optimization_manifest.json')
fs.mkdirSync(path.dirname(outJson), { recursive: true })
fs.writeFileSync(outJson, JSON.stringify({
  generatedAt: new Date().toISOString(),
  totalBeforeKB: Math.round(totalBefore / 1024),
  totalAfterKB: Math.round(totalAfter / 1024),
  savedKB: Math.round((totalBefore - totalAfter) / 1024),
  files: manifest,
}, null, 2))
console.log(`\nDONE. ${Math.round(totalBefore / 1024)} KB -> ${Math.round(totalAfter / 1024)} KB (saved ${Math.round((totalBefore - totalAfter) / 1024)} KB, ${Math.round(100 - (100 * totalAfter) / totalBefore)}% smaller).`)
console.log('Manifest:', outJson)
