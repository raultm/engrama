import { GoEngine }                     from './GoEngine.js'
import { parseSgfTree, findVariation, nodeMove } from './SgfTree.js'

// Palabras clave para clasificar variaciones del árbol SGF
const CORRECT_RE = /correct|right|good|○|◯|正解|✓|seikai/i
const WRONG_RE   = /wrong|incorrect|bad|✕|×|fail|mistake|失敗|悪手/i

// Clasificación basada solo en el comentario propio del nodo (sin heurísticas de árbol)
function ownClassification(node) {
  const comment = (node.props.get('C') ?? [])[0] ?? ''
  if (CORRECT_RE.test(comment)) return 'correct'
  if (WRONG_RE.test(comment))   return 'wrong'
  return null
}

/**
 * Gestiona el estado completo de un problema de tsumego:
 * - Modo solve: el jugador interactúa, el oponente responde automáticamente
 * - Modo review: navegación libre por el historial con anotaciones del árbol
 *
 * El historial almacena snapshots del tablero para navegación instantánea.
 */
export class TsumegoController {
  constructor({ boardSize, blackStones, whiteStones, playerToMove = 'B', sgf }) {
    this.boardSize    = boardSize
    this.playerToMove = playerToMove

    this._tree           = sgf ? parseSgfTree(sgf) : null
    this._treeHasMarkers = this._computeTreeHasMarkers()
    this._mainLine       = this._computeMainLine()

    // Historial: snapshot[i] = tablero tras i movimientos
    const initBoard = {}
    blackStones.forEach(c => { initBoard[c] = 'B' })
    whiteStones.forEach(c => { initBoard[c] = 'W' })

    this._snapshots = [initBoard]           // snapshot tras i movimientos
    this._nodes     = [this._tree]          // nodo SGF tras i movimientos
    this._moves     = []                    // movimiento i → snapshot[i+1]

    this.current    = 0    // posición que se muestra
    this.reached    = 0    // posición más lejana alcanzada

    this.mode       = 'solve'   // 'solve' | 'review'
    this.result     = null      // null | 'correct' | 'wrong'
    this._pathCorrect = true    // false si se jugó alguna variación incorrecta
    this.freeMode   = false     // true si se salió del árbol
  }

  // ── Estado del tablero ────────────────────────────────────────────────────

  get board() { return this._snapshots[this.current] }

  getBoardState() {
    const b = this.board
    return {
      blackStones: Object.entries(b).filter(([,c]) => c==='B').map(([k]) => k),
      whiteStones: Object.entries(b).filter(([,c]) => c==='W').map(([k]) => k),
    }
  }

  // ── Anotaciones para el renderizado ──────────────────────────────────────

  getAnnotations() {
    const node    = this._nodes[this.current]
    const lastMove = this.current > 0 ? this._moves[this.current - 1].coord : null
    const comment  = node ? ((node.props.get('C') ?? [])[0] ?? '') : ''

    const correct = [], wrong = [], neutral = []

    if (node && !this.freeMode) {
      ;(node.children ?? []).forEach((child) => {
        const m = nodeMove(child)
        if (!m) return
        const cls = this._resolveClassification(child)
        if      (cls === 'correct') correct.push(m.coord)
        else if (cls === 'wrong')   wrong.push(m.coord)
        else                        neutral.push(m.coord)
      })
    }

    return { lastMove, correctMoves: correct, wrongMoves: wrong, neutralMoves: neutral, comment }
  }

  // ── Jugadas (modo solve y review) ─────────────────────────────────────────

  handleMove(coord) {
    const color = this.currentMover()
    this._truncate()

    const node = this._nodes[this.current]
    let childNode     = null
    let classification = 'free'

    if (node && !this.freeMode) {
      const { child } = findVariation(node, coord, color)
      if (child) {
        childNode = child
        classification = this._resolveClassification(child)
      } else {
        classification = 'wrong_unknown'
        this.freeMode  = true
      }
    }

    if (classification !== 'correct') {
      this._pathCorrect = false
    }

    const engine = new GoEngine(this.boardSize, [], [])
    engine.board = { ...this.board }
    const captures = engine.place(coord, color)

    this._moves.push({ coord, color, captures, classification })
    this._snapshots.push({ ...engine.board })
    this._nodes.push(childNode)
    this.current++
    this.reached = this.current

    return { classification, captures, childNode }
  }

  playOpponentResponse() {
    const node = this._nodes[this.current]
    if (!node?.children?.length) return null
    const m = nodeMove(node.children[0])
    if (!m) return null

    this._truncate()

    const engine = new GoEngine(this.boardSize, [], [])
    engine.board = { ...this.board }
    const captures = engine.place(m.coord, m.color)

    this._moves.push({ coord: m.coord, color: m.color, captures, classification: 'opponent' })
    this._snapshots.push({ ...engine.board })
    this._nodes.push(node.children[0])
    this.current++
    this.reached = this.current

    const hasMore = (node.children[0]?.children?.length ?? 0) > 0
    return { coord: m.coord, color: m.color, captures, hasMore }
  }

  hasOpponentResponse() {
    const node = this._nodes[this.current]
    return !!(node?.children?.length && nodeMove(node.children[0]))
  }

  isSequenceEnd() {
    const node = this._nodes[this.current]
    return !node || !node.children?.length || !nodeMove(node.children[0])
  }

  finalizeResult() {
    this.result = this._pathCorrect ? 'correct' : 'wrong'
return this.result
  }

  // ── Navegación ────────────────────────────────────────────────────────────

  stepBack() {
    if (this.current <= 0) return false
    this.current--
    if (this._nodes[this.current] !== null) this.freeMode = false
    return true
  }

  stepForward() {
    if (this.current >= this.reached) return false
    this.current++
    if (this._nodes[this.current] === null) this.freeMode = true
    return true
  }

  resetToStart() {
    this.current  = 0
    this.freeMode = false
  }

  goToEnd() {
    this.current  = this.reached
    this.freeMode = this._nodes[this.current] === null
  }

  enterReview() {
    this.mode = 'review'
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  currentMover() {
    // Los turnos se alternan a partir del jugador inicial
    let color = this.playerToMove
    for (let i = 0; i < this.current; i++) {
      color = color === 'B' ? 'W' : 'B'
    }
    return color
  }

  // Clasifica un nodo según su comentario propio; si no tiene marcador,
  // hereda la clasificación de su primera variación (línea principal),
  // de modo que un marcador profundo (p.ej. solo en el nodo final de una
  // secuencia) "ilumina" en verde/rojo todos los pasos previos del camino
  // que conduce a él — y no solo el último movimiento.
  _resolveClassification(node) {
    const own = ownClassification(node)
    if (own) return own
    if (node.children?.length) return this._resolveClassification(node.children[0])
    // Hoja sin marcador: si en todo el árbol no hay ninguna anotación
    // RIGHT/WRONG, la convención es que la línea principal (siempre la
    // primera variación en cada bifurcación) es la respuesta correcta.
    return (!this._treeHasMarkers && this._mainLine.has(node)) ? 'correct' : 'neutral'
  }

  // true si existe algún marcador RIGHT/WRONG en cualquier punto del árbol
  // (no solo en las variaciones de primer nivel, donde rara vez aparecen).
  _computeTreeHasMarkers() {
    if (!this._tree?.children?.length) return false
    const check = (node) => ownClassification(node) !== null || (node.children ?? []).some(check)
    return this._tree.children.some(check)
  }

  // Conjunto de nodos alcanzados siguiendo siempre la primera variación desde la raíz
  _computeMainLine() {
    const set = new Set()
    let node = this._tree
    while (node) { set.add(node); node = node.children?.[0] ?? null }
    return set
  }

  _truncate() {
    if (this.current < this.reached) {
      this._moves.splice(this.current)
      this._snapshots.splice(this.current + 1)
      this._nodes.splice(this.current + 1)
      this.reached = this.current
    }
  }

  get canStepBack()    { return this.current > 0 }
  get canStepForward() { return this.current < this.reached }
  get currentStep()    { return this.current }
  get totalSteps()     { return this.reached }
}
