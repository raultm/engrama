import { getContainer } from '../../infrastructure/container.js'
import { navigate } from '../router.js'
import { showConfirm } from '../components/ConfirmModal.js'

const RATINGS = [
  { value: 0, label: 'Olvidada', key: '1', className: 'rating--forgotten' },
  { value: 1, label: 'Difícil',  key: '2', className: 'rating--hard' },
  { value: 2, label: 'Buena',    key: '3', className: 'rating--good' },
  { value: 3, label: 'Perfecta', key: '4', className: 'rating--perfect' },
]

export function StudyView(rootEl) {
  const { studySessionService } = getContainer()
  const session = studySessionService.startGlobalSession()
  if (!session) { _renderNoCards(rootEl); return }
  _renderShell(rootEl, session, studySessionService)
}

function _renderShell(rootEl, initialSession, studySessionService) {
  let session = initialSession
  let revealed = false
  const controller = new AbortController()

  const card = session.currentCard

  rootEl.innerHTML = `
    <div class="view study-view">
      <header class="study-header">
        <button class="btn btn--ghost btn--icon" id="btn-exit" aria-label="Salir">✕</button>
        <div class="study-progress">
          <div class="study-progress__bar">
            <div class="study-progress__fill" id="progress-fill" style="width:${Math.round(session.progress * 100)}%"></div>
          </div>
          <span class="study-progress__text" id="progress-text">${session.masteredCount} / ${session.cards.length}</span>
        </div>
      </header>

      <div class="study-scroll">
        <div class="flashcard" id="flashcard">
          <div class="flashcard__front" id="card-front">
            <div class="flashcard__label">Pregunta</div>
            <div class="flashcard__content" id="front-content"></div>
            <div class="flashcard__tags" id="front-tags"></div>
          </div>
          <div class="flashcard__back" id="card-back" hidden>
            <div class="flashcard__divider"></div>
            <div class="flashcard__label">Respuesta</div>
            <div class="flashcard__content flashcard__content--answer" id="back-content"></div>
          </div>
        </div>
      </div>

      <footer class="study-footer">
        <div class="elo-diff" id="elo-diff" aria-live="polite"></div>
        <button class="btn btn--primary btn--reveal" id="btn-reveal">Mostrar respuesta</button>
        <div class="rating-buttons" id="rating-buttons" hidden>
          ${RATINGS.map(r => `
            <button class="btn rating-btn ${r.className}" data-rating="${r.value}">${r.label}</button>
          `).join('')}
        </div>
      </footer>
    </div>
  `

  // Element refs
  const flashcard     = rootEl.querySelector('#flashcard')
  const frontContent  = rootEl.querySelector('#front-content')
  const frontTags     = rootEl.querySelector('#front-tags')
  const backContent   = rootEl.querySelector('#back-content')
  const cardFront     = rootEl.querySelector('#card-front')
  const cardBack      = rootEl.querySelector('#card-back')
  const btnReveal     = rootEl.querySelector('#btn-reveal')
  const ratingButtons = rootEl.querySelector('#rating-buttons')
  const eloDiff       = rootEl.querySelector('#elo-diff')
  const progressFill  = rootEl.querySelector('#progress-fill')
  const progressText  = rootEl.querySelector('#progress-text')

  function cleanup() {
    window.removeEventListener('beforeunload', onUnload)
    controller.abort()
  }

  function onUnload() {
    if (!session.isFinished) studySessionService.markAbandoned(session.id)
  }
  window.addEventListener('beforeunload', onUnload)

  function fillCard(c) {
    frontContent.textContent = c.frontText
    backContent.textContent  = c.backText
    frontTags.innerHTML = c.tags.map(t =>
      `<span class="tag">${escapeHtml(t)}</span>`
    ).join('')
  }

  function resetState() {
    revealed = false
    cardFront.removeAttribute('hidden')
    cardBack.setAttribute('hidden', '')
    btnReveal.removeAttribute('hidden')
    ratingButtons.setAttribute('hidden', '')
    eloDiff.textContent = ''
  }

  function updateProgress() {
    progressFill.style.width = `${Math.round(session.progress * 100)}%`
    progressText.textContent = `${session.masteredCount} / ${session.cards.length}`
  }

  function transitionToNext() {
    flashcard.classList.add('card-changing')
    setTimeout(() => {
      fillCard(session.currentCard)
      resetState()
      updateProgress()
      flashcard.classList.remove('card-changing')
    }, 140)
  }

  function reveal() {
    if (revealed) return
    revealed = true
    cardBack.removeAttribute('hidden')
    btnReveal.setAttribute('hidden', '')
    ratingButtons.removeAttribute('hidden')
    ratingButtons.querySelector('.rating-btn').focus()
  }

  fillCard(card)
  updateProgress()

  rootEl.querySelector('#btn-exit').addEventListener('click', async () => {
    const ok = await showConfirm({
      title: '¿Salir de la sesión?',
      message: 'El progreso de esta sesión se guardará.',
      confirmLabel: 'Salir',
      cancelLabel: 'Continuar',
      dangerous: false,
    })
    if (ok) {
      studySessionService.markAbandoned(session.id)
      cleanup()
      navigate('/')
    }
  })

  btnReveal.addEventListener('click', reveal)

  ratingButtons.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-rating]')
    if (!btn) return
    const rating = parseInt(btn.dataset.rating, 10)
    const { session: next, userDelta } = studySessionService.processAnswer(session, rating)
    session = next

    eloDiff.textContent = userDelta >= 0 ? `+${userDelta} ELO` : `${userDelta} ELO`
    eloDiff.className = `elo-diff ${userDelta >= 0 ? 'elo-diff--up' : 'elo-diff--down'}`

    if (next.isFinished) {
      cleanup()
      setTimeout(() => _renderSummary(rootEl, next), 400)
    } else {
      setTimeout(() => transitionToNext(), 350)
    }
  })

  function onKey(e) {
    if (!rootEl.contains(flashcard)) { controller.abort(); return }
    if ((e.key === ' ' || e.key === 'Enter') && !revealed) {
      e.preventDefault(); reveal(); return
    }
    if (revealed && ['1','2','3','4'].includes(e.key)) {
      ratingButtons.querySelector(`[data-rating="${+e.key - 1}"]`)?.click()
    }
  }
  rootEl.addEventListener('keydown', onKey, { signal: controller.signal })
}

function _renderSummary(rootEl, session) {
  const s = session.getSummary()
  const repeated = s.answered - s.total
  rootEl.innerHTML = `
    <div class="view summary-view">
      <main class="summary-main">
        <div class="summary-card">
          <div class="summary-icon">✓</div>
          <h1>¡Sesión completada!</h1>
          <div class="summary-stats">
            <div class="summary-stat summary-stat--perfect">
              <span class="summary-stat__value">${s.perfect}</span>
              <span class="summary-stat__label">Perfectas</span>
            </div>
            <div class="summary-stat summary-stat--good">
              <span class="summary-stat__value">${s.good}</span>
              <span class="summary-stat__label">Buenas</span>
            </div>
            <div class="summary-stat summary-stat--hard">
              <span class="summary-stat__value">${s.hard}</span>
              <span class="summary-stat__label">Difíciles</span>
            </div>
            <div class="summary-stat summary-stat--forgotten">
              <span class="summary-stat__value">${s.forgotten}</span>
              <span class="summary-stat__label">Olvidadas</span>
            </div>
          </div>
          ${repeated > 0 ? `<p class="summary-repeated">${repeated} tarjeta${repeated > 1 ? 's' : ''} repetida${repeated > 1 ? 's' : ''} hasta aprenderla${repeated > 1 ? 's' : ''}</p>` : ''}
          <div class="summary-elo">
            <span class="${s.totalEloChange >= 0 ? 'elo-up' : 'elo-down'}">
              ${s.totalEloChange >= 0 ? '+' : ''}${s.totalEloChange} ELO
            </span>
          </div>
          <div class="summary-actions">
            <button class="btn btn--primary" id="btn-home">Inicio</button>
            <button class="btn btn--secondary" id="btn-again">Otra sesión</button>
          </div>
        </div>
      </main>
    </div>
  `
  rootEl.querySelector('#btn-home').addEventListener('click', () => navigate('/'))
  rootEl.querySelector('#btn-again').addEventListener('click', () => StudyView(rootEl))
}

function _renderNoCards(rootEl) {
  rootEl.innerHTML = `
    <div class="view summary-view">
      <main class="summary-main">
        <div class="summary-card">
          <div class="summary-icon">✓</div>
          <h1>¡Al día!</h1>
          <p>No hay tarjetas pendientes para hoy.</p>
          <button class="btn btn--primary" id="btn-home">Volver</button>
        </div>
      </main>
    </div>
  `
  rootEl.querySelector('#btn-home').addEventListener('click', () => navigate('/'))
}

function escapeHtml(str) {
  const d = document.createElement('div')
  d.textContent = str
  return d.innerHTML
}
