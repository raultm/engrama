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
  interactive  = false,
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

    // Extender hasta los 2 bordes de tablero más cercanos para orientar al jugador
    ;[
      { dist: c0,     snap: () => { c0 = 0   } },
      { dist: N-1-c1, snap: () => { c1 = N-1 } },
      { dist: r0,     snap: () => { r0 = 0   } },
      { dist: N-1-r1, snap: () => { r1 = N-1 } },
    ].sort((a,b) => a.dist - b.dist).slice(0,2).forEach(e => e.snap())
  }

  // Qué lados son bordes reales vs cortes del interior del tablero
  const edgeL = c0 === 0,  edgeR = c1 === N-1
  const edgeT = r0 === 0,  edgeB = r1 === N-1

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
  // Borde del recorte: sólido y grueso = borde real del tablero, discontinuo = corte interior
  ;[
    [pxC(c0), pxR(r0), pxC(c1), pxR(r0), edgeT],
    [pxC(c0), pxR(r1), pxC(c1), pxR(r1), edgeB],
    [pxC(c0), pxR(r0), pxC(c0), pxR(r1), edgeL],
    [pxC(c1), pxR(r0), pxC(c1), pxR(r1), edgeR],
  ].forEach(([x1,y1,x2,y2,isEdge]) => lines.push(isEdge
    ? `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${LINE_COLOR}" stroke-width="2.5"/>`
    : `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${LINE_COLOR}" stroke-width="1.2" stroke-dasharray="5,4" opacity="0.5"/>`)
  )

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

  // ── Targets interactivos ──────────────────────────────────────────────────
  const occupiedT = new Set([...blackStones, ...whiteStones])
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

  // Degradados en lados cortados: de transparente (borde del grid) a oscuro (borde SVG)
  const cutDefs = [], cutFades = []
  const F = CELL * 0.4
  ;[
    { id:'ct', skip:edgeT, g:'x1="0" y1="1" x2="0" y2="0"', x:0,          y:0,          w:SIZEW,              h:pxR(r0)+F          },
    { id:'cb', skip:edgeB, g:'x1="0" y1="0" x2="0" y2="1"', x:0,          y:pxR(r1)-F, w:SIZEW,              h:SIZEH-pxR(r1)+F    },
    { id:'cl', skip:edgeL, g:'x1="1" y1="0" x2="0" y2="0"', x:0,          y:0,          w:pxC(c0)+F,          h:SIZEH              },
    { id:'cr', skip:edgeR, g:'x1="0" y1="0" x2="1" y2="0"', x:pxC(c1)-F, y:0,          w:SIZEW-pxC(c1)+F,   h:SIZEH              },
  ].forEach(({ id, skip, g, x, y, w, h }) => {
    if (skip) return
    cutDefs.push(`<linearGradient id="${id}" ${g}><stop offset="0%" stop-color="${LINE_COLOR}" stop-opacity="0"/><stop offset="100%" stop-color="${LINE_COLOR}" stop-opacity="0.2"/></linearGradient>`)
    cutFades.push(`<rect x="${Math.max(0,x).toFixed(1)}" y="${Math.max(0,y).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="url(#${id})"/>`)
  })

  return `<svg viewBox="0 0 ${SIZEW} ${SIZEH}" xmlns="http://www.w3.org/2000/svg"
              style="width:100%;max-width:${SIZEW}px;display:block;border-radius:4px"
              role="img" aria-label="Tablero de Go">
    ${cutDefs.length ? `<defs>${cutDefs.join('')}</defs>` : ''}
    <rect width="${SIZEW}" height="${SIZEH}" fill="${BOARD_COLOR}" rx="3"/>
    ${cutFades.join('')}
    ${lines.join('')}
    ${hoshi.join('')}
    ${stonesSvg.join('')}
    ${annotationSvg}
    ${lastMoveSvg}
    ${targetsSvg}
  </svg>`
}

function _stone(cx, cy, r, fill, stroke, sw) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`
}
