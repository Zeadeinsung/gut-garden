// Copy the subset of OpenMoji color SVGs used by the app into web/public/assets/openmoji/.
// Run: node scripts/extract-openmoji.mjs  (from web/)
import { cpSync, mkdirSync, readdirSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = resolve(root, 'node_modules/openmoji/color/svg')
const outDir = resolve(root, 'public/assets/openmoji')

// code = OpenMoji filename without .svg (uppercase hex, no FE0F)
const CODES = [
  // nature & food
  '1F331', '1F33F', '1F33C', '1F332', '1F33E', '1F957', '1F34E', '1F36C', '1F955',
  '1F4A7', '26F2', '2600', '1F319', '1F3C3', '1F91D',
  // places & modules
  '1F3DB', '1F3ED', '1F9F1', '1F52D', '1F3F0', '1F3E0',
  // content objects
  '1F430', '1F9E0', '1F3AE', '1F3AC', '1F37D', '1F30D', '1F381', '1F389', '1F3B2',
  '1F3B5', '1F3C6', '1F4DA', '1F4F7', '1F476', '1F4E2', '1F525', '1F6E1', '2728',
  '1F4F0', '1F3F7',
  // colored UI-ish
  '1F4C5', '23F1', '26A1', '1F50D', '1F4CA', '1F4C8', '1F4CB', '1F4DD', '1F4AC',
  '1F4A1', '2B50', '1F4CD', '1F5A8', '1F3AF', '1F916', '1F4F1', '1F522', '1F511',
  '1F440', '1F4FA', '1F527', '1F4CC', '1F4E4', '1F4E5', '270F', '1F464', '1F465',
  '1F6A7', '26A0', '1F512', '1F510', '2699', '1F50A', '1F507',
]

mkdirSync(outDir, { recursive: true })

const available = new Set(readdirSync(srcDir))
const missing = []
let copied = 0
for (const code of CODES) {
  const f = `${code}.svg`
  if (!available.has(f)) { missing.push(f); continue }
  cpSync(resolve(srcDir, f), resolve(outDir, f))
  copied++
}
console.log(`copied ${copied}/${CODES.length} → public/assets/openmoji/`)
if (missing.length) { console.warn('MISSING:', missing.join(', ')); process.exit(1) }
if (!existsSync(outDir)) process.exit(1)
console.log('OK.')
