import { copyFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const assets = ['src/config/faq-presets.json']
for (const rel of assets) {
  const dest = path.join(root, 'dist', rel.replace(/^src\//, ''))
  mkdirSync(path.dirname(dest), { recursive: true })
  copyFileSync(path.join(root, rel), dest)
  console.log(`[copy-assets] ${rel} -> dist/`)
}
