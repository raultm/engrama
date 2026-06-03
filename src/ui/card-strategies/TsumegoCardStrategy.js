import { CardStrategy } from './CardStrategy.js'
import { renderGoBoard } from '../../domain/sgf/GoBoard.js'
import { GoEngine } from '../../domain/sgf/GoEngine.js'
import { parseSgfTree, findVariation, nodeMove } from '../../domain/sgf/SgfTree.js'

export class TsumegoCardStrategy extends CardStrategy {
  // Estado de la partida en curso (singleton — solo una carta activa a la vez)
  _lastResult = null   // 'correct' | 'wrong' | null

  async renderQuestion(card) {
    this._lastResult = null

    const { boardSize, blackStones, whiteStones, playerToMove, comment } = card.extraData

    const ptmLabel = playerToMove === 'W'
      ? '<span class="tsumego-ptm tsumego-ptm--white">⚪ Blancas juegan</span>'
      : '<span class="tsumego-ptm tsumego-ptm--black">⚫ Negras juegan</span>'

    const commentHtml = comment
      ? `<p class="tsumego-comment">${escapeHtml(comment)}</p>`
      : ''

    const board = renderGoBoard({
      boardSize, blackStones, whiteStones, playerToMove,
      interactive: true,
    })

    return `${ptmLabel}${commentHtml}<div class="tsumego-board" id="tsumego-live">${board}</div>
      <p class="tsumego-hint">Toca el tablero para hacer tu jugada o pulsa "Mostrar respuesta".</p>`
  }

  postRender(card, containerEl, onReveal) {
    const { boardSize, blackStones, whiteStones, playerToMove = 'B' } = card.extraData
    const sgf = card.extraData.sgf

    // Motor de juego y posición actual en el árbol SGF
    const engine = new GoEngine(boardSize, blackStones, whiteStones)
    let treeNode  = sgf ? parseSgfTree(sgf) : null
    let mover     = playerToMove   // quién mueve ahora
    let done      = false

    const boardEl = () => containerEl.querySelector('#tsumego-live')

    const redrawBoard = (marked = [], wrong = null) => {
      const el = boardEl()
      if (!el) return
      const bStones = Object.entries(engine.board).filter(([,c]) => c==='B').map(([k]) => k)
      const wStones = Object.entries(engine.board).filter(([,c]) => c==='W').map(([k]) => k)
      el.innerHTML = renderGoBoard({
        boardSize, playerToMove: mover,
        blackStones: bStones, whiteStones: wStones,
        markedMoves: marked, wrongMove: wrong,
        interactive: !done,
      })
      if (!done) attachTargets()
    }

    const attachTargets = () => {
      const el = boardEl()
      if (!el) return
      el.querySelectorAll('.go-target').forEach(rect => {
        rect.addEventListener('click', () => {
          if (done) return
          const coord = rect.dataset.move
          handleMove(coord)
        }, { once: true })
      })
    }

    const handleMove = (coord) => {
      if (!engine.isEmpty(coord)) return

      // Navegar el árbol para saber si la jugada es correcta
      let isMain = true
      if (treeNode) {
        const result = findVariation(treeNode, coord, mover)
        if (!result.child) {
          // Jugada no está en ninguna variación → incorrecto
          engine.place(coord, mover)
          done = true
          this._lastResult = 'wrong'
          redrawBoard(card.extraData.correctMoves ?? [], coord)
          setTimeout(() => onReveal?.(), 600)
          return
        }
        isMain = result.isMain
        treeNode = result.child
      }

      // Colocar piedra y actualizar capturas
      engine.place(coord, mover)
      mover = mover === 'B' ? 'W' : 'B'

      // ¿Hay movimiento del oponente en la siguiente variación?
      const opMove = treeNode?.children?.length ? nodeMove(treeNode.children[0]) : null

      if (opMove) {
        // Redibujar con piedra del usuario
        redrawBoard()
        // Esperar 350ms y jugar respuesta automática del oponente
        setTimeout(() => {
          treeNode = treeNode.children[0]
          engine.place(opMove.coord, opMove.color)
          mover = opMove.color === 'B' ? 'W' : 'B'
          // ¿Hay más movimientos disponibles?
          const hasMore = treeNode?.children?.length > 0
          redrawBoard()
          if (!hasMore) {
            // Secuencia completada
            done = true
            this._lastResult = isMain ? 'correct' : 'wrong'
            setTimeout(() => onReveal?.(), 600)
          }
        }, 350)
      } else {
        // Sin respuesta → fin de la secuencia
        done = true
        this._lastResult = isMain ? 'correct' : 'wrong'
        redrawBoard()
        setTimeout(() => onReveal?.(), 600)
      }
    }

    attachTargets()
  }

  async renderAnswer(card) {
    const { boardSize, blackStones, whiteStones, playerToMove, correctMoves = [] } = card.extraData

    const board = renderGoBoard({
      boardSize, blackStones, whiteStones, playerToMove,
      markedMoves: correctMoves,
    })

    let feedback = ''
    if (this._lastResult === 'correct') {
      feedback = `<p class="tsumego-answer tsumego-answer--ok">✓ ¡Correcto!</p>`
    } else if (this._lastResult === 'wrong') {
      const corrLabel = correctMoves.map(m => _sgfToLabel(m, boardSize)).join(', ')
      feedback = `<p class="tsumego-answer tsumego-answer--ko">✗ Incorrecto — la jugada correcta era <strong>${escapeHtml(corrLabel)}</strong></p>`
    } else {
      // Reveló sin jugar
      const corrLabel = correctMoves.map(m => _sgfToLabel(m, boardSize)).join(', ')
      feedback = corrLabel
        ? `<p class="tsumego-answer">Jugada correcta: <strong>${escapeHtml(corrLabel)}</strong></p>`
        : ''
    }

    return `<div class="tsumego-board">${board}</div>${feedback}`
  }

  getLabels() { return { question: 'Tsumego', answer: 'Solución' } }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function _sgfToLabel(sgfCoord, boardSize) {
  if (!sgfCoord || sgfCoord.length < 2) return sgfCoord
  const COLS = 'ABCDEFGHJKLMNOPQRST'
  const col  = sgfCoord.charCodeAt(0) - 97
  const row  = sgfCoord.charCodeAt(1) - 97
  return `${COLS[col] ?? '?'}${boardSize - row}`
}

function escapeHtml(str) {
  const d = document.createElement('div')
  d.textContent = str ?? ''
  return d.innerHTML
}
