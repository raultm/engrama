/**
 * Renderizador SVG de tablero de Go para tsumego.
 *
 * Coordenadas SGF: dos letras minúsculas.
 * Primera letra = columna (a=0, b=1, ...), segunda = fila (a=0, b=1, ...).
 * El eje Y del SVG y el eje de filas del SGF coinciden (arriba = fila 0).
 */

const BOARD_COLOR  = '#dcb560'
const LINE_COLOR   = '#5a3a1a'
const BLACK_FILL   = '#111'
const WHITE_FILL   = '#f5f0e0'
const MARK_COLOR   = '#22c55e'   // verde para la jugada correcta
const WRONG_COLOR  = '#ef4444'   // rojo (para el Enfoque B futuro)

// Posiciones de los puntos de estrella (hoshi) por tamaño de tablero (0-indexed)
const HOSHI = {
  9:  [[2,2],[6,2],[2,6],[6,6],[4,4]],
  13: [[3,3],[9,3],[3,9],[9,9],[6,6]],
  19: [[3,3],[9,3],[15,3],[3,9],[9,9],[15,9],[3,15],[9,15],[15,15]],
}

/**
 * @param {object} params
 * @param {number}   params.boardSize      - Tamaño del tablero (9, 13, 19...)
 * @param {string[]} params.blackStones    - Coordenadas SGF de piedras negras
 * @param {string[]} params.whiteStones    - Coordenadas SGF de piedras blancas
 * @param {string}   params.playerToMove  - 'B' | 'W'
 * @param {string[]} [params.markedMoves] - Jugadas a marcar como correctas
 * @param {boolean}  [params.interactive] - Si true, añade targets clicables
 * @param {string}   [params.wrongMove]   - Jugada incorrecta del usuario (muestra en rojo)
 * @returns {string} SVG string
 */
export function renderGoBoard({
  boardSize,
  blackStones,
  whiteStones,
  playerToMove  = 'B',
  markedMoves   = [],      // image occlusion: verde con anillo
  interactive   = false,
  wrongMove     = null,    // image occlusion: rojo con anillo
  // Tsumego annotations:
  lastMove      = null,    // cuadrado en la última piedra jugada
  correctMoves  = [],      // círculo verde en intersecciones vacías
  wrongMoves    = [],      // círculo rojo en intersecciones vacías
  neutralMoves  = [],      // círculo gris en intersecciones vacías
}) {
  const N    = boardSize
  // Escalar para que el tablero quepa siempre en ~280px
  const CELL = Math.max(12, Math.floor(256 / Math.max(N - 1, 1)))
  const PAD  = Math.round(CELL * 0.75)
  const SIZE = PAD * 2 + (N - 1) * CELL
  const R    = CELL * 0.44   // radio de la piedra

  function px(n) { return PAD + n * CELL }
  function sgfToColRow(coord) {
    return {
      col: coord.charCodeAt(0) - 97,
      row: coord.charCodeAt(1) - 97,
    }
  }

  // ── Grid ─────────────────────────────────────────────────────────────────
  const lines = []
  for (let i = 0; i < N; i++) {
    lines.push(`<line x1="${px(0)}" y1="${px(i)}" x2="${px(N-1)}" y2="${px(i)}" stroke="${LINE_COLOR}" stroke-width="0.8"/>`)
    lines.push(`<line x1="${px(i)}" y1="${px(0)}" x2="${px(i)}" y2="${px(N-1)}" stroke="${LINE_COLOR}" stroke-width="0.8"/>`)
  }

  // ── Borde exterior más grueso ─────────────────────────────────────────────
  lines.push(`<rect x="${px(0)}" y="${px(0)}" width="${px(N-1)-px(0)}" height="${px(N-1)-px(0)}" fill="none" stroke="${LINE_COLOR}" stroke-width="1.5"/>`)

  // ── Hoshi ─────────────────────────────────────────────────────────────────
  const hoshi = (HOSHI[N] ?? []).map(([c, r]) =>
    `<circle cx="${px(c)}" cy="${px(r)}" r="${Math.max(2, CELL * 0.08)}" fill="${LINE_COLOR}"/>`
  )

  // ── Piedras ───────────────────────────────────────────────────────────────
  const stonesSvg = [
    ...blackStones.map(s => {
      const { col, row } = sgfToColRow(s)
      return _stone(px(col), px(row), R, BLACK_FILL, '#444', '0.5')
    }),
    ...whiteStones.map(s => {
      const { col, row } = sgfToColRow(s)
      return _stone(px(col), px(row), R, WHITE_FILL, '#888', '1')
    }),
  ]

  // ── Jugadas marcadas (respuesta correcta en verde) ────────────────────────
  const marksSvg = markedMoves.map(s => {
    const { col, row } = sgfToColRow(s)
    const fill   = playerToMove === 'B' ? BLACK_FILL : WHITE_FILL
    const stroke = playerToMove === 'B' ? '#444' : '#888'
    const sw     = playerToMove === 'B' ? '0.5' : '1'
    const markR  = R * 0.42
    return `
      ${_stone(px(col), px(row), R, fill, stroke, sw)}
      <circle cx="${px(col)}" cy="${px(row)}" r="${markR}" fill="none" stroke="${MARK_COLOR}" stroke-width="${Math.max(1.5, CELL * 0.07)}"/>
    `
  })

  // ── Jugada incorrecta del usuario (en rojo) ────────────────────────────
  const wrongSvg = wrongMove ? (() => {
    const { col, row } = sgfToColRow(wrongMove)
    const fill   = playerToMove === 'B' ? BLACK_FILL : WHITE_FILL
    const stroke = playerToMove === 'B' ? '#444' : '#888'
    const sw     = playerToMove === 'B' ? '0.5' : '1'
    const markR  = R * 0.42
    return `
      ${_stone(px(col), px(row), R, fill, stroke, sw)}
      <circle cx="${px(col)}" cy="${px(row)}" r="${markR}" fill="none" stroke="${WRONG_COLOR}" stroke-width="${Math.max(1.5, CELL * 0.07)}"/>
    `
  })() : ''

  // ── Targets interactivos (intersecciones vacías clicables) ────────────────
  const occupiedForTargets = new Set([...blackStones, ...whiteStones, ...markedMoves])
  const targetsSvg = interactive
    ? Array.from({ length: N }, (_, c) =>
        Array.from({ length: N }, (_, r) => {
          const coord = String.fromCharCode(97 + c) + String.fromCharCode(97 + r)
          if (occupiedForTargets.has(coord)) return ''
          const half = CELL / 2
          return `<rect x="${(px(c) - half).toFixed(1)}" y="${(px(r) - half).toFixed(1)}" width="${CELL}" height="${CELL}" fill="transparent" class="go-target" data-move="${coord}"/>`
        }).join('')
      ).join('')
    : ''

  // ── Anotaciones tsumego ─────────────────────────────────────────────────
  const occupied = new Set([...blackStones, ...whiteStones])

  // Indicador de última jugada: cuadrado pequeño dentro de la piedra
  const lastMoveSvg = lastMove ? (() => {
    if (!occupied.has(lastMove)) return ''
    const { col, row } = sgfToColRow(lastMove)
    const isBlack = blackStones.includes(lastMove)
    const side    = R * 0.45
    return `<rect x="${(px(col) - side/2).toFixed(1)}" y="${(px(row) - side/2).toFixed(1)}"
                  width="${side.toFixed(1)}" height="${side.toFixed(1)}"
                  fill="${isBlack ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.45)'}" rx="1"/>`
  })() : ''

  // Círculos de anotación en intersecciones vacías
  const annotationSvg = [
    ...correctMoves.filter(c => !occupied.has(c)).map(c => {
      const { col, row } = sgfToColRow(c)
      return `<circle cx="${px(col)}" cy="${px(row)}" r="${R * 0.42}"
                      fill="${MARK_COLOR}" opacity="0.82"/>`
    }),
    ...wrongMoves.filter(c => !occupied.has(c)).map(c => {
      const { col, row } = sgfToColRow(c)
      return `<circle cx="${px(col)}" cy="${px(row)}" r="${R * 0.42}"
                      fill="${WRONG_COLOR}" opacity="0.82"/>`
    }),
    ...neutralMoves.filter(c => !occupied.has(c)).map(c => {
      const { col, row } = sgfToColRow(c)
      return `<circle cx="${px(col)}" cy="${px(row)}" r="${R * 0.42}"
                      fill="#94a3b8" opacity="0.7"/>`
    }),
  ].join('')

  return `<svg viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg"
              style="width:100%;max-width:${SIZE}px;display:block;border-radius:4px"
              role="img" aria-label="Tablero de Go">
    <rect width="${SIZE}" height="${SIZE}" fill="${BOARD_COLOR}" rx="3"/>
    ${lines.join('')}
    ${hoshi.join('')}
    ${stonesSvg.join('')}
    ${marksSvg.join('')}
    ${wrongSvg}
    ${annotationSvg}
    ${lastMoveSvg}
    ${targetsSvg}
  </svg>`
}

function _stone(cx, cy, r, fill, stroke, sw) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`
}
