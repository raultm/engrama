import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const dir  = path.join(root, 'sgf', 'TSUMEGO BASIC 150 SELECTED PROBLEMS')
const out  = path.join(root, 'src', 'data', 'seeds', 'tsumego-150-basicos.md')

const files = fs.readdirSync(dir).filter(f => f.endsWith('.sgf')).sort()

const lines = [
  '---',
  'name: Tsumego — 150 Problemas Básicos',
  'description: 150 problemas seleccionados de captura y vida — nivel básico a intermedio',
  'schedulerType: sm2',
  '---',
  '',
]

files.forEach((file, i) => {
  const n   = i + 1
  const elo = n <= 50 ? 1300 : n <= 100 ? 1500 : 1700
  const sgf = fs.readFileSync(path.join(dir, file), 'utf8').replace(/\r\n/g, '\n').trim()

  lines.push(`## Problema ${String(n).padStart(3, '0')}`)
  lines.push('')
  lines.push('```sgf')
  lines.push(sgf)
  lines.push('```')
  lines.push('')
  lines.push(`<!-- cardType:tsumego elo:${elo} tags:go,tsumego,basico -->`)
  lines.push('')
})

fs.writeFileSync(out, lines.join('\n'), 'utf8')
console.log(`✓ ${files.length} problemas → ${out}`)
console.log(`  Tamaño: ${(fs.statSync(out).size / 1024).toFixed(1)} KB`)
