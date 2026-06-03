/**
 * Parser mínimo de SGF para tsumego.
 * Extrae posición inicial y jugada(s) correcta(s).
 *
 * Convenciones asumidas (estándar en la mayoría de colecciones tsumego):
 *   - Primera variación del árbol = línea correcta
 *   - AB = piedras negras iniciales, AW = piedras blancas
 *   - PL[B|W] = jugador que mueve (si no, se infiere del primer movimiento)
 *   - Coordenadas SGF: dos letras minúsculas, columna + fila ('a'=1)
 */

export function parseSgf(sgfText) {
  // Normalizar y limpiar
  const text = sgfText.replace(/\r\n/g, '\n').trim()

  const boardSize = _parseInt(_first(text, 'SZ')) ?? 9
  const blackStones = _multiValue(text, 'AB')
  const whiteStones = _multiValue(text, 'AW')
  const comment = _first(text, 'C') ?? ''

  // Jugador que mueve
  const pl = _first(text, 'PL')
  const playerToMove = pl === 'W' ? 'W' : pl === 'B' ? 'B' : _inferPlayer(text)

  // Jugada correcta: primer movimiento de la primera variación
  const correctMoves = _findCorrectMoves(text, playerToMove)

  return { boardSize, blackStones, whiteStones, playerToMove, correctMoves, comment }
}

// ── Helpers internos ────────────────────────────────────────────────────────

function _first(text, prop) {
  // Extrae el primer valor de una propiedad SGF
  // Evita falsos positivos con AB/AW usando lookbehind negativo
  const m = text.match(new RegExp(`(?<![A-Z])${prop}\\[([^\\]]*)\\]`))
  return m ? m[1] : null
}

function _multiValue(text, prop) {
  // Extrae todos los valores de una propiedad multi-valor: AB[aa][bb][cc]
  const results = []
  const propRe = new RegExp(`(?<![A-Z])${prop}((?:\\[[a-s]{0,2}\\])+)`, 'g')
  let m
  while ((m = propRe.exec(text)) !== null) {
    const inner = m[1]
    let v
    const valRe = /\[([a-s]{2})\]/g
    while ((v = valRe.exec(inner)) !== null) results.push(v[1])
  }
  return [...new Set(results)]
}

function _parseInt(str) {
  if (!str) return null
  const n = parseInt(str.split(':')[0])  // SZ[9] o SZ[9:9]
  return isNaN(n) ? null : n
}

function _inferPlayer(text) {
  // Busca el primer movimiento de juego (;B o ;W, no setup como AB/AW)
  const m = text.match(/;([BW])\[[a-s]{2}\]/)
  return m ? m[1] : 'B'
}

function _findCorrectMoves(text, playerToMove) {
  const moveChar = playerToMove  // 'B' o 'W'

  // Buscar la primera variación: patrón (;B[xy] o (;W[xy]
  // que aparece directamente después del nodo raíz
  const varRe = /\(;[BW]\[([a-s]{2})\]/g
  const m = varRe.exec(text)
  if (m) return [m[1]]

  // Fallback: primer movimiento en la línea principal (;B[xy] sin paréntesis)
  const mainRe = new RegExp(`;${moveChar}\\[([a-s]{2})\\]`)
  const m2 = mainRe.exec(text)
  if (m2) return [m2[1]]

  return []
}
