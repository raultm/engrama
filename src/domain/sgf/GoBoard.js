/**
 * Renderizador SVG de tablero de Go para tsumego.
 * El recorte se calcula automáticamente a partir de las piedras presentes.
 */

const BOARD_COLOR = '#dcb560'
const LINE_COLOR  = '#5a3a1a'
const BLACK_FILL  = '#111'
const WHITE_FILL  = '#f5f0e0'
const MARK_COLOR  = '#22c55e'
const WRONG_COLOR = '#ef4444'

const HOSHI = {
  9:  [[2,2],[6,2],[2,6],[6,6],[4,4]],
  13: [[3,3],[9,3],[3,9],[9,9],[6,6]],
  19: [[3,3],[9,3],[15,3],[3,9],[9,9],[15,9],[3,15],[9,15],[15,15]],
}

export function renderGoBoard({
  boardSize,
  blackStones,
  whiteStones,
  playerToMove = 'B',
  markedMoves  = [],
  interactive  = false,
  wrongMove    = null,
  lastMove     = null,
  correctMoves = [],
  wrongMoves   = [],
  neutralMoves = [],
}) {
  const N = boardSize

  // ── Recorte automático ────────────────────────────────────────────────────
  const allStones = [...blackStones, ...whiteStones]
  let c0 = 0, c1 = N-1, r0 = 0, r1 = N-1
  if (allStones.length) {
    const MARGIN = 1
    const cols = allStones.map(s => s.charCodeAt(0) - 97)
    const rows = allStones.map(s => s.charCodeAt(1) - 97)
    c0 = Math.max(0,   Math.min(...cols) - MARGIN)
    c1 = Math.min(N-1, Math.max(...cols) + MARGIN)
    r0 = Math.max(0,   Math.min(...rows) - MARGIN)
    r1 = Math.min(N-1, Math.max(...rows) + MARGIN)
  }

  const subW = c1 - c0 + 1
  const subH = r1 - r0 + 1
  const CELL  = Math.max(14, Math.floor(256 / Math.max(subW - 1, subH - 1, 1)))
  const PAD   = Math.round(CELL * 0.75)
  const SIZEW = PAD * 2 + (subW - 1) * CELL
  const SIZEH = PAD * 2 + (subH - 1) * CELL
  const R     = CELL * 0.44

  const pxC  = (col) => PAD + (col - c0) * CELL
  const pxR  = (row) => PAD + (row - r0) * CELL
  const inCrop = (col, row) => col >= c0 && col <= c1 && row >= r0 && row <= r1
  const decode = (s) => ({ col: s.charCodeAt(0) - 97, row: s.charCodeAt(1) - 97 })

  // ── Grid ──────────────────────────────────────────────────────────────────
  const lines = []
  for (let c = c0; c <= c1; c++)
    lines.push(`<line x1="${pxC(c)}" y1="${pxR(r0)}" x2="${pxC(c)}" y2="${pxR(r1)}" stroke="${LINE_COLOR}" stroke-width="0.8"/>`)
  for (let r = r0; r <= r1; r++)
    lines.push(`<line x1="${pxC(c0)}" y1="${pxR(r)}" x2="${pxC(c1)}" y2="${pxR(r)}" stroke="${LINE_COLOR}" stroke-width="0.8"/>`)
  lines.push(`<rect x="${pxC(c0)}" y="${pxR(r0)}" width="${(c1-c0)*CELL}" height="${(r1-r0)*CELL}" fill="none" stroke="${LINE_COLOR}" stroke-width="1.5"/>`)

  // ── Hoshi ─────────────────────────────────────────────────────────────────
  const hoshi = (HOSHI[N] ?? []).filter(([c,r]) => inCrop(c,r)).map(([c,r]) =>
    `<circle cx="${pxC(c)}" cy="${pxR(r)}" r="${Math.max(2, CELL*0.08)}" fill="${LINE_COLOR}"/>`
  )

  // ── Piedras ───────────────────────────────────────────────────────────────
  const stonesSvg = [
    ...blackStones.filter(s => { const {col,row}=decode(s); return inCrop(col,row) }).map(s => {
      const {col,row} = decode(s)
      return _stone(pxC(col), pxR(row), R, BLACK_FILL, '#444', '0.5')
    }),
    ...whiteStones.filter(s => { const {col,row}=decode(s); return inCrop(col,row) }).map(s => {
      const {col,row} = decode(s)
      return _stone(pxC(col), pxR(row), R, WHITE_FILL, '#888', '1')
    }),
  ]

  // ── Jugadas marcadas image-occlusion (verde con anillo) ───────────────────
  const marksSvg = markedMoves.filter(s => { const {col,row}=decode(s); return inCrop(col,row) }).map(s => {
    const {col,row} = decode(s)
    const fill   = playerToMove==='B' ? BLACK_FILL : WHITE_FILL
    const stroke = playerToMove==='B' ? '#444' : '#888'
    const sw     = playerToMove==='B' ? '0.5' : '1'
    return `${_stone(pxC(col),pxR(row),R,fill,stroke,sw)}
      <circle cx="${pxC(col)}" cy="${pxR(row)}" r="${R*0.42}" fill="none" stroke="${MARK_COLOR}" stroke-width="${Math.max(1.5,CELL*0.07)}"/>`
  })

  // ── Jugada incorrecta image-occlusion (rojo con anillo) ──────────────────
  const wrongMoveSvg = wrongMove ? (() => {
    const {col,row} = decode(wrongMove)
    if (!inCrop(col,row)) return ''
    const fill   = playerToMove==='B' ? BLACK_FILL : WHITE_FILL
    const stroke = playerToMove==='B' ? '#444' : '#888'
    const sw     = playerToMove==='B' ? '0.5' : '1'
    return `${_stone(pxC(col),pxR(row),R,fill,stroke,sw)}
      <circle cx="${pxC(col)}" cy="${pxR(row)}" r="${R*0.42}" fill="none" stroke="${WRONG_COLOR}" stroke-width="${Math.max(1.5,CELL*0.07)}"/>`
  })() : ''

  // ── Targets interactivos ──────────────────────────────────────────────────
  const occupiedT = new Set([...blackStones, ...whiteStones, ...markedMoves])
  const targetsSvg = interactive
    ? Array.from({length: N}, (_,c) => Array.from({length: N}, (_,r) => {
        if (!inCrop(c,r)) return ''
        const coord = String.fromCharCode(97+c) + String.fromCharCode(97+r)
        if (occupiedT.has(coord)) return ''
        const half = CELL/2
        return `<rect x="${(pxC(c)-half).toFixed(1)}" y="${(pxR(r)-half).toFixed(1)}" width="${CELL}" height="${CELL}" fill="transparent" class="go-target" data-move="${coord}"/>`
      }).join('')).join('')
    : ''

  // ── Anotaciones tsumego ───────────────────────────────────────────────────
  const occupied = new Set([...blackStones, ...whiteStones])

  // Último movimiento: cuadrado blanco/negro en el centro de la piedra
  const lastMoveSvg = lastMove ? (() => {
    if (!occupied.has(lastMove)) return ''
    const {col,row} = decode(lastMove)
    if (!inCrop(col,row)) return ''
    const isBlack = blackStones.includes(lastMove)
    const side = R * 0.45
    return `<rect x="${(pxC(col)-side/2).toFixed(1)}" y="${(pxR(row)-side/2).toFixed(1)}" width="${side.toFixed(1)}" height="${side.toFixed(1)}" fill="${isBlack?'rgba(255,255,255,0.7)':'rgba(0,0,0,0.45)'}" rx="1"/>`
  })() : ''

  // Círculos de anotación en intersecciones vacías del área recortada
  const annotationSvg = [
    ...correctMoves .filter(s => !occupied.has(s) && inCrop(decode(s).col, decode(s).row))
                    .map(s => { const {col,row}=decode(s); return `<circle cx="${pxC(col)}" cy="${pxR(row)}" r="${R*0.42}" fill="${MARK_COLOR}" opacity="0.82"/>` }),
    ...wrongMoves   .filter(s => !occupied.has(s) && inCrop(decode(s).col, decode(s).row))
                    .map(s => { const {col,row}=decode(s); return `<circle cx="${pxC(col)}" cy="${pxR(row)}" r="${R*0.42}" fill="${WRONG_COLOR}" opacity="0.82"/>` }),
    ...neutralMoves .filter(s => !occupied.has(s) && inCrop(decode(s).col, decode(s).row))
                    .map(s => { const {col,row}=decode(s); return `<circle cx="${pxC(col)}" cy="${pxR(row)}" r="${R*0.42}" fill="#94a3b8" opacity="0.7"/>` }),
  ].join('')

  return `<svg viewBox="0 0 ${SIZEW} ${SIZEH}" xmlns="http://www.w3.org/2000/svg"
              style="width:100%;max-width:${SIZEW}px;display:block;border-radius:4px"
              role="img" aria-label="Tablero de Go">
    <rect width="${SIZEW}" height="${SIZEH}" fill="${BOARD_COLOR}" rx="3"/>
    ${lines.join('')}
    ${hoshi.join('')}
    ${stonesSvg.join('')}
    ${marksSvg.join('')}
    ${wrongMoveSvg}
    ${annotationSvg}
    ${lastMoveSvg}
    ${targetsSvg}
  </svg>`
}

function _stone(cx, cy, r, fill, stroke, sw) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`
}
