import { CardStrategy }        from './CardStrategy.js'
import { renderGoBoard }       from '../../domain/sgf/GoBoard.js'
import { TsumegoController }   from '../../domain/sgf/TsumegoController.js'

export class TsumegoCardStrategy extends CardStrategy {
  // El controlador se guarda como estado de instancia (singleton de la estrategia).
  // Una sola carta activa a la vez — esto es suficiente.
  _ctrl = null

  // ── renderQuestion ────────────────────────────────────────────────────────

  async renderQuestion(card) {
    this._ctrl = null   // reset al mostrar tarjeta nueva

    const { boardSize, blackStones, whiteStones, playerToMove = 'B', comment } = card.extraData
    return _html(boardSize, blackStones, whiteStones, playerToMove, comment, {
      interactive: true,
    })
  }

  // ── postRender: setup completo del modo solve ────────────────────────────

  postRender(card, containerEl, onReveal) {
    const ctrl = new TsumegoController({ ...card.extraData })
    this._ctrl = ctrl
    _attachSolve(containerEl, ctrl, onReveal)
  }

  // ── renderAnswer: usado cuando el usuario pulsa "Mostrar respuesta" ───────
  // También es invocado por fillAnswerContent tras onReveal.
  // Si el controlador ya está en review, devuelve el estado actual del tablero.

  async renderAnswer(card) {
    if (this._ctrl?.mode === 'review') {
      return _reviewHtml(this._ctrl)
    }
    // Fallback: posición inicial con primeras jugadas correctas marcadas
    const { boardSize, blackStones, whiteStones, playerToMove = 'B', comment } = card.extraData
    const tmpCtrl = new TsumegoController({ ...card.extraData })
    const { correctMoves } = tmpCtrl.getAnnotations()
    return _html(boardSize, blackStones, whiteStones, playerToMove, comment, { correctMoves })
  }

  // ── postReveal: re-engancha listeners tras fillAnswerContent ──────────────

  postReveal(card, containerEl) {
    const ctrl = this._ctrl
    if (!ctrl) return
    if (ctrl.mode === 'review') {
      _attachReview(containerEl, ctrl)
    }
  }

  getLabels() { return { question: 'Tsumego', answer: 'Solución' } }
}

// ── Construcción de HTML ──────────────────────────────────────────────────────

function _html(boardSize, blackStones, whiteStones, playerToMove, comment, boardOpts = {}) {
  const ptm = playerToMove === 'W'
    ? '<span class="tsumego-ptm tsumego-ptm--white">⚪ Blancas juegan</span>'
    : '<span class="tsumego-ptm tsumego-ptm--black">⚫ Negras juegan</span>'
  const commentHtml = comment
    ? `<p class="tsumego-comment" id="tsumego-comment">${escapeHtml(comment)}</p>`
    : '<p class="tsumego-comment" id="tsumego-comment"></p>'

  const board = renderGoBoard({ boardSize, blackStones, whiteStones, playerToMove, ...boardOpts })

  return `${ptm}${commentHtml}
    <div class="tsumego-board" id="tsumego-live">${board}</div>
    <div class="tsumego-nav" id="tsumego-nav" hidden>
      <button class="tsumego-nav-btn" id="t-start" title="Inicio">⟨⟨</button>
      <button class="tsumego-nav-btn" id="t-prev"  title="Anterior">‹</button>
      <span   class="tsumego-nav-pos" id="t-pos">0 / 0</span>
      <button class="tsumego-nav-btn" id="t-next"  title="Siguiente">›</button>
      <button class="tsumego-nav-btn" id="t-end"   title="Final">⟩⟩</button>
    </div>
    <p class="tsumego-result" id="tsumego-result"></p>`
}

function _reviewHtml(ctrl) {
  const { blackStones, whiteStones }                            = ctrl.getBoardState()
  const { lastMove, correctMoves, wrongMoves, neutralMoves, comment } = ctrl.getAnnotations()
  const board = renderGoBoard({
    boardSize: ctrl.boardSize,
    playerToMove: ctrl.currentMover(),
    blackStones, whiteStones,
    lastMove, correctMoves, wrongMoves, neutralMoves,
    interactive: true,
  })

  const ptm = ctrl.currentMover() === 'W'
    ? '<span class="tsumego-ptm tsumego-ptm--white">⚪ Blancas juegan</span>'
    : '<span class="tsumego-ptm tsumego-ptm--black">⚫ Negras juegan</span>'

  const commentHtml = `<p class="tsumego-comment" id="tsumego-comment">${escapeHtml(comment)}</p>`
  const resultHtml  = _resultText(ctrl.result)
  const posHtml     = `${ctrl.currentStep} / ${ctrl.totalSteps}`

  return `${ptm}${commentHtml}
    <div class="tsumego-board" id="tsumego-live">${board}</div>
    <div class="tsumego-nav" id="tsumego-nav">
      <button class="tsumego-nav-btn" id="t-start" title="Inicio">⟨⟨</button>
      <button class="tsumego-nav-btn" id="t-prev"  title="Anterior">‹</button>
      <span   class="tsumego-nav-pos" id="t-pos">${posHtml}</span>
      <button class="tsumego-nav-btn" id="t-next"  title="Siguiente">›</button>
      <button class="tsumego-nav-btn" id="t-end"   title="Final">⟩⟩</button>
    </div>
    <p class="tsumego-result" id="tsumego-result">${resultHtml}</p>`
}

function _resultText(result) {
  if (result === 'correct') return '<span class="tsumego-ok">✓ Correcto</span>'
  if (result === 'wrong')   return '<span class="tsumego-ko">✗ Incorrecto</span>'
  return ''
}

// ── Modo solve ────────────────────────────────────────────────────────────────

function _attachSolve(containerEl, ctrl, onReveal) {
  const boardEl  = () => containerEl.querySelector('#tsumego-live')
  const commentEl = () => containerEl.querySelector('#tsumego-comment')

  const redraw = () => {
    const el = boardEl()
    if (!el) return
    const { blackStones, whiteStones }                            = ctrl.getBoardState()
    const { lastMove, correctMoves, wrongMoves, neutralMoves, comment } = ctrl.getAnnotations()
    el.innerHTML = renderGoBoard({
      boardSize: ctrl.boardSize,
      playerToMove: ctrl.currentMover(),
      blackStones, whiteStones,
      lastMove, correctMoves, wrongMoves, neutralMoves,
      interactive: ctrl.mode === 'solve',
    })
    const cEl = commentEl()
    if (cEl) cEl.textContent = comment
    if (ctrl.mode === 'solve') attachTargets()
  }

  const attachTargets = () => {
    boardEl()?.querySelectorAll('.go-target').forEach(rect => {
      rect.addEventListener('click', () => handleMove(rect.dataset.move), { once: true })
    })
  }

  const enterReview = () => {
    ctrl.finalizeResult()
    ctrl.enterReview()
    const navEl    = containerEl.querySelector('#tsumego-nav')
    const resultEl = containerEl.querySelector('#tsumego-result')
    if (navEl)    navEl.removeAttribute('hidden')
    if (resultEl) resultEl.innerHTML = _resultText(ctrl.result)
    redraw()
    _attachReview(containerEl, ctrl)
    onReveal?.()
  }

  const handleMove = async (coord) => {
    const result = ctrl.handleMove(coord)
    redraw()

    if (result.classification === 'wrong_unknown') {
      await _delay(100)
      enterReview()
      return
    }

    if (ctrl.hasOpponentResponse()) {
      await _delay(350)
      const opResult = ctrl.playOpponentResponse()
      redraw()
      if (!opResult?.hasMore || ctrl.isSequenceEnd()) {
        await _delay(200)
        enterReview()
      }
    } else if (ctrl.isSequenceEnd()) {
      await _delay(200)
      enterReview()
    }
  }

  attachTargets()
}

// ── Modo review ───────────────────────────────────────────────────────────────

function _attachReview(containerEl, ctrl) {
  const boardEl   = () => containerEl.querySelector('#tsumego-live')
  const commentEl = () => containerEl.querySelector('#tsumego-comment')
  const posEl     = () => containerEl.querySelector('#t-pos')

  const redraw = () => {
    const el = boardEl()
    if (!el) return
    const { blackStones, whiteStones }                             = ctrl.getBoardState()
    const { lastMove, correctMoves, wrongMoves, neutralMoves, comment } = ctrl.getAnnotations()
    el.innerHTML = renderGoBoard({
      boardSize: ctrl.boardSize,
      playerToMove: ctrl.currentMover(),
      blackStones, whiteStones,
      lastMove, correctMoves, wrongMoves, neutralMoves,
      interactive: true,
    })
    const cEl = commentEl()
    if (cEl) cEl.textContent = comment
    const pEl = posEl()
    if (pEl) pEl.textContent = `${ctrl.currentStep} / ${ctrl.totalSteps}`
    attachTargets()
    updateButtons()
  }

  const attachTargets = () => {
    boardEl()?.querySelectorAll('.go-target').forEach(rect => {
      rect.addEventListener('click', () => handleReviewMove(rect.dataset.move), { once: true })
    })
  }

  const handleReviewMove = (coord) => {
    ctrl.handleMove(coord)  // en modo review, handleMove sigue funcionando (explora variaciones)
    redraw()
  }

  const updateButtons = () => {
    const q = (id) => containerEl.querySelector(id)
    const prev  = q('#t-prev');  if (prev)  prev.disabled  = !ctrl.canStepBack
    const next  = q('#t-next');  if (next)  next.disabled  = !ctrl.canStepForward
    const start = q('#t-start'); if (start) start.disabled = !ctrl.canStepBack
    const end   = q('#t-end');   if (end)   end.disabled   = !ctrl.canStepForward
  }

  // Botones de navegación (delegar en el contenedor para sobrevivir re-renders)
  containerEl.addEventListener('click', (e) => {
    const id = e.target.id
    if      (id === 't-prev')  { ctrl.stepBack();      redraw() }
    else if (id === 't-next')  { ctrl.stepForward();   redraw() }
    else if (id === 't-start') { ctrl.resetToStart();  redraw() }
    else if (id === 't-end')   { ctrl.goToEnd();       redraw() }
  })

  redraw()
}

// ── Utils ─────────────────────────────────────────────────────────────────────

function _delay(ms) { return new Promise(r => setTimeout(r, ms)) }

function escapeHtml(str) {
  const d = document.createElement('div')
  d.textContent = str ?? ''
  return d.innerHTML
}
