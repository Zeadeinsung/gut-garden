/** Replace converted asset refs (.png/.jpg -> .webp) in source + public html/css. */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const webDir = path.dirname(fileURLToPath(import.meta.url))
const manifest = JSON.parse(fs.readFileSync(path.resolve(webDir, '..', '.shots', 'image_optimization_manifest.json'), 'utf8'))
const map = new Map(manifest.files.map((f) => [f.ref, f.newRef]))

const files = []
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (/node_modules|(^|[\\/])assets([\\/]|$)/.test(p)) continue
      walk(p)
    } else if (/\.(tsx?|jsx?|html?|css)$/i.test(e.name)) {
      files.push(p)
    }
  }
}
walk(path.join(webDir, 'src'))
walk(path.join(webDir, 'public'))

let changed = 0
for (const f of files) {
  let txt = fs.readFileSync(f, 'utf8')
  const orig = txt
  for (const [ref, newRef] of map) txt = txt.split(ref).join(newRef)
  if (txt !== orig) {
    fs.writeFileSync(f, txt)
    changed++
    console.log('updated', path.relative(webDir, f))
  }
}
console.log('changed files:', changed)
