/**
 * Genera apple-touch-icon.png (180x180) y icon-512.png (512x512)
 * usando la API Canvas de Node.js (disponible sin dependencias extra desde Node 21,
 * o con `npm install canvas` para versiones anteriores).
 *
 * Uso: node scripts/generate-icons.mjs
 */
import { createCanvas } from '@napi-rs/canvas'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir    = path.join(__dirname, '..', 'public')

const BG    = '#21222c'
const COLOR = '#bd93f9'

function drawIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx    = canvas.getContext('2d')

  // Fondo con esquinas redondeadas
  const r = size * 0.18
  ctx.fillStyle = BG
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(size - r, 0)
  ctx.quadraticCurveTo(size, 0, size, r)
  ctx.lineTo(size, size - r)
  ctx.quadraticCurveTo(size, size, size - r, size)
  ctx.lineTo(r, size)
  ctx.quadraticCurveTo(0, size, 0, size - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
  ctx.fill()

  // Escalar el logo (diseñado en 20x20) con padding del 30% del size
  const pad  = size * 0.19
  const scale = (size - pad * 2) / 20

  ctx.save()
  ctx.translate(pad, pad)
  ctx.scale(scale, scale)

  ctx.fillStyle   = COLOR
  ctx.strokeStyle = COLOR
  ctx.lineCap     = 'round'

  // Círculo central
  ctx.beginPath(); ctx.arc(8, 10, 3, 0, Math.PI * 2); ctx.fill()

  // Línea derecha + nodo
  ctx.lineWidth = 1.8
  ctx.beginPath(); ctx.moveTo(11, 10); ctx.lineTo(19, 10); ctx.stroke()
  ctx.beginPath(); ctx.arc(19, 10, 1.5, 0, Math.PI * 2); ctx.fill()

  // Brazos superiores e inferior
  ctx.lineWidth = 1.5
  const lines = [
    [6.2, 7.6, 2.5, 3],
    [8,   7,   8,   1.5],
    [9.8, 7.6, 13.5, 3],
    [6.2, 12.4, 3.5, 17],
  ]
  lines.forEach(([x1,y1,x2,y2]) => {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
  })

  // Nodos terminales
  const nodes = [[2.5,3,1.3],[8,1.5,1.3],[13.5,3,1.3],[3.5,17,1.3]]
  nodes.forEach(([cx,cy,cr]) => {
    ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.fill()
  })

  ctx.restore()
  return canvas
}

async function save(canvas, filename) {
  const out  = path.join(outDir, filename)
  const buf  = await canvas.encode('png')
  fs.writeFileSync(out, buf)
  console.log(`✓ ${filename} (${(buf.length / 1024).toFixed(1)} KB)`)
}

await save(drawIcon(180), 'apple-touch-icon.png')
await save(drawIcon(512), 'icon-512.png')
