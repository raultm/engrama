import { CardStrategy }        from './CardStrategy.js'
import { renderGoBoard }       from '../../domain/sgf/GoBoard.js'
import { TsumegoController }   from '../../domain/sgf/TsumegoController.js'
import { escapeHtml }          from '../utils/html.js'

// Umbrales de calificación automática (segundos por movimiento del jugador)
const RATING_PERFECT = 5    // < 5s  → Perfecta
const RATING_GOOD    = 10   // < 10s → Buena
//                           ≥ 10s  → Difícil
// Movimiento incorrecto (cualquier tiempo) → Olvidada

export class TsumegoCardStrategy extends CardStrategy {
  _ctrl = null

  async renderQuestion(card) {
    this._ctrl = null
    const { boardSize, blackStones, whiteStones, playerToMove = 'B', comment, title } = card.extraData
    return _boardHtml(boardSize, blackStones, whiteStones, playerToMove, comment, { interactive: true }, title || card.frontText)
  }

  // Tsumego no usa el footer estándar — el flujo es obligatorio
  setupFooter(btnReveal, ratingButtons, btnNext) {
    btnReveal.setAttribute('hidden', '')
    ratingButtons.setAttribute('hidden', '')
    btnNext.setAttribute('hidden', '')
  }

  postRender(card, containerEl, onReveal) {
    const ctrl = new TsumegoController({ ...card.extraData })
    this._ctrl = ctrl
    _attachSolve(containerEl, ctrl, onReveal)
  }

  async renderAnswer(card) {
    const title = card.extraData.title || card.frontText
    if (this._ctrl?.mode === 'review') return _reviewHtml(this._ctrl, title)
    const tmpCtrl = new TsumegoController({ ...card.extraData })
    const { correctMoves } = tmpCtrl.getAnnotations()
    const { boardSize, blackStones, whiteStones, playerToMove = 'B', comment } = card.extraData
    return _boardHtml(boardSize, blackStones, whiteStones, playerToMove, comment, { correctMoves }, title)
  }

  postReveal(card, containerEl) {
    if (this._ctrl?.mode === 'review') _attachReview(containerEl, this._ctrl)
  }

  getLabels() { return { question: '', answer: '' } }
}

// ── Construcción de HTML ──────────────────────────────────────────────────────

function _boardHtml(boardSize, blackStones, whiteStones, playerToMove, comment, boardOpts = {}, title = '') {
  const ptmClass = playerToMove === 'W' ? 'tsumego-ptm--white' : 'tsumego-ptm--black'
  const ptmText  = playerToMove === 'W' ? '⚪ Blancas juegan'  : '⚫ Negras juegan'
  const board = renderGoBoard({ boardSize, blackStones, whiteStones, playerToMove, ...boardOpts })

  return `${title ? `<p class="tsumego-title">${escapeHtml(title)}</p>` : ''}
    <div class="tsumego-board" id="tsumego-live">${board}</div>
    <span class="tsumego-ptm ${ptmClass}" id="tsumego-ptm">${ptmText}</span>
    <div class="tsumego-timer" id="tsumego-timer"></div>
    <div class="tsumego-nav" id="tsumego-nav" hidden>
      <button class="tsumego-nav-btn" id="t-start">⟨⟨</button>
      <button class="tsumego-nav-btn" id="t-prev">‹</button>
      <span   class="tsumego-nav-pos" id="t-pos">0 / 0</span>
      <button class="tsumego-nav-btn" id="t-next">›</button>
      <button class="tsumego-nav-btn" id="t-end">⟩⟩</button>
    </div>
    <p class="tsumego-comment" id="tsumego-comment">${escapeHtml(comment ?? '')}</p>`
}

function _reviewHtml(ctrl, title = '') {
  const { blackStones, whiteStones }                              = ctrl.getBoardState()
  const { lastMove, correctMoves, wrongMoves, neutralMoves, comment } = ctrl.getAnnotations()
  const board = renderGoBoard({
    boardSize: ctrl.boardSize, playerToMove: ctrl.currentMover(),
    blackStones, whiteStones,
    lastMove, correctMoves, wrongMoves, neutralMoves,
    interactive: true,
  })
  const icon = ctrl.currentMover() === 'W' ? '⚪' : '⚫'
  const ptmClass = ctrl.result === 'correct' ? 'tsumego-ptm--correct'
                 : ctrl.result === 'wrong'   ? 'tsumego-ptm--wrong'
                 : (ctrl.currentMover() === 'W' ? 'tsumego-ptm--white' : 'tsumego-ptm--black')
  const ptmText  = ctrl.result === 'correct' ? '✓ Correcto'
                 : ctrl.result === 'wrong'   ? '✗ Incorrecto'
                 : (ctrl.currentMover() === 'W' ? '⚪ Blancas juegan' : '⚫ Negras juegan')

  return `${title ? `<p class="tsumego-title">${escapeHtml(title)}</p>` : ''}
    <div class="tsumego-board" id="tsumego-live">${board}</div>
    <span class="tsumego-ptm ${ptmClass}" id="tsumego-ptm">${ptmText}</span>
    <div class="tsumego-timer" id="tsumego-timer"></div>
    <div class="tsumego-nav" id="tsumego-nav">
      <button class="tsumego-nav-btn" id="t-start">⟨⟨</button>
      <button class="tsumego-nav-btn" id="t-prev">‹</button>
      <span   class="tsumego-nav-pos" id="t-pos">${icon} ${ctrl.currentStep}/${ctrl.totalSteps}</span>
      <button class="tsumego-nav-btn" id="t-next">›</button>
      <button class="tsumego-nav-btn" id="t-end">⟩⟩</button>
    </div>
    <p class="tsumego-comment" id="tsumego-comment">${escapeHtml(comment)}</p>`
}

// ── Timer por movimiento ──────────────────────────────────────────────────────

function createMoveTimer(timerEl) {
  let start      = null
  let interval   = null
  const times    = []

  function startMove() {
    start = Date.now()
    interval = setInterval(() => {
      if (!timerEl) return
      const secs = Math.floor((Date.now() - start) / 1000)
      timerEl.textContent = secs > 0 ? `${secs}s` : ''
    }, 500)
  }

  function stopMove() {
    if (interval) { clearInterval(interval); interval = null }
    if (start) {
      times.push((Date.now() - start) / 1000)
      start = null
    }
    if (timerEl) timerEl.textContent = ''
  }

  function clear() {
    if (interval) { clearInterval(interval); interval = null }
    if (timerEl) timerEl.textContent = ''
  }

  function getAutoRating(isCorrect) {
    if (!isCorrect) return 0
    if (!times.length) return 3
    const avg = times.reduce((a,b) => a+b, 0) / times.length
    if (avg < RATING_PERFECT) return 3
    if (avg < RATING_GOOD)    return 2
    return 1
  }

  return { startMove, stopMove, clear, getAutoRating }
}

// ── Modo solve ────────────────────────────────────────────────────────────────

function _attachSolve(containerEl, ctrl, onReveal) {
  const boardEl    = () => containerEl.querySelector('#tsumego-live')
  const commentEl  = () => containerEl.querySelector('#tsumego-comment')
  const timerEl    = containerEl.querySelector('#tsumego-timer')
  const timer      = createMoveTimer(timerEl)

  const redraw = () => {
    const el = boardEl()
    if (!el) return
    const solving = ctrl.mode === 'solve'
    const { blackStones, whiteStones } = ctrl.getBoardState()
    const { lastMove, correctMoves, wrongMoves, neutralMoves, comment } = ctrl.getAnnotations()
    // Mientras se resuelve no se muestran pistas (círculos) ni el comentario del nodo:
    // una secuencia correcta puede tener varios pasos y revelarían la respuesta a mitad de camino.
    el.innerHTML = renderGoBoard({
      boardSize: ctrl.boardSize, playerToMove: ctrl.currentMover(),
      blackStones, whiteStones,
      lastMove,
      correctMoves: solving ? [] : correctMoves,
      wrongMoves:   solving ? [] : wrongMoves,
      neutralMoves: solving ? [] : neutralMoves,
      interactive: solving,
    })
    const cEl = commentEl()
    if (cEl) cEl.textContent = solving ? '' : comment
    if (solving) attachTargets()
  }

  const attachTargets = () => {
    timer.startMove()
    boardEl()?.querySelectorAll('.go-target').forEach(rect => {
      rect.addEventListener('click', () => {
        timer.stopMove()
        handleMove(rect.dataset.move)
      }, { once: true })
    })
  }

  const enterReview = () => {
    timer.clear()
    const autoRating = timer.getAutoRating(ctrl._pathCorrect)
    ctrl.finalizeResult()
    ctrl.enterReview()
    const navEl = containerEl.querySelector('#tsumego-nav')
    const ptmEl = containerEl.querySelector('#tsumego-ptm')
    if (navEl) navEl.removeAttribute('hidden')
    if (ptmEl) {
      ptmEl.className = `tsumego-ptm tsumego-ptm--${ctrl.result}`
      ptmEl.textContent = ctrl.result === 'correct' ? '✓ Correcto' : '✗ Incorrecto'
    }
    redraw()
    _attachReview(containerEl, ctrl)
    onReveal?.(autoRating)
  }

  const handleMove = async (coord) => {
    const result = ctrl.handleMove(coord)
    redraw()

    if (result.classification === 'wrong_unknown') {
      await _delay(100); enterReview(); return
    }

    if (ctrl.hasOpponentResponse()) {
      await _delay(350)
      ctrl.playOpponentResponse()
      redraw()
      if (ctrl.isSequenceEnd()) {
        await _delay(200); enterReview()
      } else {
        timer.startMove()  // reinicia timer para el siguiente movimiento del jugador
      }
    } else if (ctrl.isSequenceEnd()) {
      await _delay(200); enterReview()
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
    const { blackStones, whiteStones }                              = ctrl.getBoardState()
    const { lastMove, correctMoves, wrongMoves, neutralMoves, comment } = ctrl.getAnnotations()
    el.innerHTML = renderGoBoard({
      boardSize: ctrl.boardSize, playerToMove: ctrl.currentMover(),
      blackStones, whiteStones,
      lastMove, correctMoves, wrongMoves, neutralMoves,
      interactive: true,
    })
    const cEl = commentEl()
    if (cEl) cEl.textContent = comment
    const pEl = posEl()
    const icon = ctrl.currentMover() === 'W' ? '⚪' : '⚫'
    if (pEl) pEl.textContent = `${icon} ${ctrl.currentStep}/${ctrl.totalSteps}`
    attachTargets()
    updateButtons()
  }

  const attachTargets = () => {
    boardEl()?.querySelectorAll('.go-target').forEach(rect => {
      rect.addEventListener('click', () => { ctrl.handleMove(rect.dataset.move); redraw() }, { once: true })
    })
  }

  const updateButtons = () => {
    const q = (id) => containerEl.querySelector(id)
    const prev  = q('#t-prev');  if (prev)  prev.disabled  = !ctrl.canStepBack
    const next  = q('#t-next');  if (next)  next.disabled  = !ctrl.canStepForward
    const start = q('#t-start'); if (start) start.disabled = !ctrl.canStepBack
    const end   = q('#t-end');   if (end)   end.disabled   = !ctrl.canStepForward
  }

  // Delegación de eventos en el contenedor — sobrevive a re-renders del tablero
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
