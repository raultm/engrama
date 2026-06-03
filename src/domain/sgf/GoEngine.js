/**
 * Motor básico de Go: coloca piedras y aplica reglas de captura.
 * No implementa ko (simplificación válida para tsumego).
 */
export class GoEngine {
  /**
   * @param {number} boardSize
   * @param {string[]} blackStones - coordenadas SGF iniciales
   * @param {string[]} whiteStones
   */
  constructor(boardSize, blackStones = [], whiteStones = []) {
    this.size  = boardSize
    this.board = {}  // coord → 'B' | 'W'
    blackStones.forEach(c => { this.board[c] = 'B' })
    whiteStones.forEach(c => { this.board[c] = 'W' })
  }

  /** Copia del estado actual del tablero */
  snapshot() {
    return { ...this.board }
  }

  /**
   * Coloca una piedra en `coord` con `color` ('B'|'W').
   * Elimina los grupos enemigos sin libertades.
   * @returns {string[]} coordenadas de las piedras capturadas
   */
  place(coord, color) {
    this.board[coord] = color
    const enemy    = color === 'B' ? 'W' : 'B'
    const captured = []

    // Comprobar grupos enemigos adyacentes que hayan quedado sin libertades
    for (const nb of this._neighbors(coord)) {
      if (this.board[nb] === enemy) {
        const group = this._getGroup(nb)
        if (this._liberties(group).size === 0) {
          group.forEach(c => {
            delete this.board[c]
            captured.push(c)
          })
        }
      }
    }

    return captured
  }

  /** ¿Está la intersección vacía? */
  isEmpty(coord) {
    return !this.board[coord]
  }

  /** Todas las intersecciones vacías */
  emptyPoints() {
    const empty = []
    for (let c = 0; c < this.size; c++) {
      for (let r = 0; r < this.size; r++) {
        const coord = String.fromCharCode(97 + c) + String.fromCharCode(97 + r)
        if (!this.board[coord]) empty.push(coord)
      }
    }
    return empty
  }

  // ── Internos ─────────────────────────────────────────────────────────────

  _neighbors(coord) {
    const c = coord.charCodeAt(0) - 97
    const r = coord.charCodeAt(1) - 97
    const nb = []
    if (c > 0)            nb.push(String.fromCharCode(96 + c) + coord[1])
    if (c < this.size-1)  nb.push(String.fromCharCode(98 + c) + coord[1])
    if (r > 0)            nb.push(coord[0] + String.fromCharCode(96 + r))
    if (r < this.size-1)  nb.push(coord[0] + String.fromCharCode(98 + r))
    return nb
  }

  _getGroup(coord) {
    const color = this.board[coord]
    if (!color) return new Set()
    const group   = new Set([coord])
    const queue   = [coord]
    while (queue.length) {
      for (const nb of this._neighbors(queue.pop())) {
        if (!group.has(nb) && this.board[nb] === color) {
          group.add(nb)
          queue.push(nb)
        }
      }
    }
    return group
  }

  _liberties(group) {
    const libs = new Set()
    for (const coord of group) {
      for (const nb of this._neighbors(coord)) {
        if (!this.board[nb]) libs.add(nb)
      }
    }
    return libs
  }
}
