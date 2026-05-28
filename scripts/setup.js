import { copyFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

mkdirSync(resolve(root, 'public'), { recursive: true })

const files = [
  ['node_modules/sql.js/dist/sql-wasm-browser.wasm', 'public/sql-wasm-browser.wasm'],
  ['node_modules/sql.js/dist/sql-wasm-browser.js', 'public/sql-wasm-browser.js'],
]

for (const [src, dest] of files) {
  copyFileSync(resolve(root, src), resolve(root, dest))
  console.log(`✓ ${dest}`)
}

console.log('Setup completado.')
