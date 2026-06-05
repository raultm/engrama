import { getContainer } from '../../infrastructure/container.js'
import { navigate } from '../router.js'
import { toggleTheme, getTheme } from '../theme.js'
import { getRegistry, getActiveId, setActiveId } from '../engramaRegistry.js'
import { buildSeedRegistry } from '../../data/seedRegistry.js'
import { SeedSelectionView } from './SeedSelectionView.js'
import { RANKS, getRank } from '../../domain/ranks.js'

export function HomeView(rootEl) {
  const { studySessionService, userProfileRepository, syncService } = getContainer()

  const profile = userProfileRepository.getOrCreate()
  const stats   = studySessionService.getAllCardsStats()
  const streak  = studySessionService.getStreak()
  const availableTags  = studySessionService.getAvailableTags()
  const selectedTags   = studySessionService.getSelectedTags()
  const hasTags        = availableTags.length > 0
  const hasTagFilter   = selectedTags.length > 0
  const canStudy = stats.due > 0

  const registry = getRegistry()
  const activeId = getActiveId()
  const syncState = syncService.getLocalState()

  rootEl.innerHTML = `
    <div class="view home-view">
      <header class="home-header">
        <span class="home-header__logo">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="8" cy="10" r="3" fill="currentColor"/>
            <line x1="11" y1="10" x2="19" y2="10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <circle cx="19" cy="10" r="1.5" fill="currentColor"/>
            <line x1="6.2" y1="7.6" x2="2.5" y2="3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="8" y1="7" x2="8" y2="1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="9.8" y1="7.6" x2="13.5" y2="3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="6.2" y1="12.4" x2="3.5" y2="17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="2.5" cy="3" r="1.3" fill="currentColor"/>
            <circle cx="8" cy="1.5" r="1.3" fill="currentColor"/>
            <circle cx="13.5" cy="3" r="1.3" fill="currentColor"/>
            <circle cx="3.5" cy="17" r="1.3" fill="currentColor"/>
          </svg>
          Engrama
        </span>
        <div class="engrama-selector">
          <select id="engrama-select" aria-label="Cambiar Engrama" title="Cambiar Engrama">
            ${registry.map(e => `
              <option value="${e.id}" ${e.id === activeId ? 'selected' : ''}>${e.name}</option>
            `).join('')}
            <option value="__add__">+ Añadir Engrama</option>
          </select>
        </div>
        <div class="home-header__actions">
          ${hasTags ? `
          <button class="btn btn--ghost btn--icon btn--sm ${hasTagFilter ? 'btn--tag-active' : ''}" id="btn-tags" aria-label="Filtrar por tags" aria-expanded="false">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
              <line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
          </button>` : ''}
          <button class="btn btn--ghost btn--icon btn--sm" id="btn-theme" aria-label="Cambiar tema">${getTheme() === 'dark' ? '☀' : '☾'}</button>
          <button class="btn btn--ghost btn--icon btn--sm" id="btn-stats" aria-label="Estadísticas">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </header>

      ${hasTags ? `
      <div class="tag-panel" id="tag-panel" hidden>
        <button class="tag-pill ${!hasTagFilter ? 'tag-pill--active' : ''}" id="btn-all-tags">Todos</button>
        ${availableTags.map(t => `
          <button class="tag-pill ${selectedTags.includes(t) ? 'tag-pill--active' : ''}" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</button>
        `).join('')}
      </div>` : ''}

      <main class="home-main">

        <section class="elo-section">
          <div class="elo-level">
            <span class="rank-badge" id="rank-badge" tabindex="0" aria-label="Rango actual: ${getRank(profile.eloRating)}">
              <strong>${getRank(profile.eloRating)}</strong>
              <div class="rank-tooltip" role="tooltip">
                ${RANKS.map(r => `
                  <div class="rank-tooltip__row ${getRank(profile.eloRating) === r.name ? 'rank-tooltip__row--current' : ''}">
                    <span class="rank-tooltip__name">${r.name}</span>
                    <span class="rank-tooltip__elo">${r.min > 0 ? r.min + ' ELO' : '< 1500'}</span>
                  </div>
                `).join('')}
              </div>
            </span>
          </div>
          <div class="elo-track" role="progressbar" aria-valuenow="${Math.round(profile.getLevelProgress() * 100)}" aria-valuemin="0" aria-valuemax="100">
            <div class="elo-fill" style="width:${Math.round(profile.getLevelProgress() * 100)}%"></div>
          </div>
        </section>

        ${streak > 3 ? `<p class="streak-badge">${streak} días seguidos</p>` : ''}

        ${_syncBanner(syncState)}

        <section class="counters-section">
          <div class="counter counter--due" data-label="Para hoy">
            <span class="counter__number">${stats.due}</span>
          </div>
          <div class="counter counter--new" data-label="Nuevas">
            <span class="counter__number">${stats.newCards}</span>
          </div>
        </section>

        <section class="study-cta">
          <button
            class="btn btn--primary btn--study ${canStudy ? '' : 'btn--disabled'}"
            id="btn-study"
            ${canStudy ? '' : 'disabled aria-disabled="true"'}
          >
            ${canStudy ? _studyLabel(stats) : '✓ Al día por hoy'}
          </button>
          ${!canStudy && stats.total > 0 ? `<p class="cta-hint">${_nextReviewHint(stats)}</p>` : ''}
          ${stats.total === 0 ? `<p class="cta-hint">No hay tarjetas cargadas</p>` : ''}
          ${stats.masterDeadline ? `<p class="cta-hint cta-hint--deadline">${_deadlineHint(stats.masterDeadline)}</p>` : ''}
        </section>

      </main>
    </div>
  `

  const select = rootEl.querySelector('#engrama-select')
  select.addEventListener('change', async (e) => {
    const val = e.target.value
    if (val === '__add__') {
      const seedReg = await buildSeedRegistry()
      SeedSelectionView(rootEl, seedReg)
      return
    }
    setActiveId(val)
    location.reload()
  })

  if (canStudy) {
    rootEl.querySelector('#btn-study').addEventListener('click', () => navigate('study'))
  }

  if (hasTags) {
    const btnTags  = rootEl.querySelector('#btn-tags')
    const tagPanel = rootEl.querySelector('#tag-panel')

    btnTags.addEventListener('click', () => {
      const open = tagPanel.hasAttribute('hidden')
      tagPanel.toggleAttribute('hidden', !open)
      btnTags.setAttribute('aria-expanded', open ? 'true' : 'false')
    })

    tagPanel.addEventListener('click', (e) => {
      const pill = e.target.closest('[data-tag], #btn-all-tags')
      if (!pill) return
      if (pill.id === 'btn-all-tags') {
        studySessionService.setSelectedTags([])
      } else {
        const tag = pill.dataset.tag
        const current = studySessionService.getSelectedTags()
        const next = current.includes(tag)
          ? current.filter(t => t !== tag)
          : [...current, tag]
        studySessionService.setSelectedTags(next)
      }
      HomeView(rootEl)
      // mantener el panel abierto tras re-render
      rootEl.querySelector('#tag-panel')?.removeAttribute('hidden')
      rootEl.querySelector('#btn-tags')?.setAttribute('aria-expanded', 'true')
    })
  }

  rootEl.querySelector('#btn-theme').addEventListener('click', () => {
    toggleTheme()
    HomeView(rootEl)
  })

  rootEl.querySelector('#btn-stats').addEventListener('click', () => navigate('stats'))

  // Si está pending, hacer polling suave para detectar aprobación
  if (syncState.status === 'pending') {
    setTimeout(async () => {
      const newStatus = await syncService.refreshStatus()
      if (newStatus === 'approved') HomeView(rootEl)
    }, 15000)
  }
}


function _syncBanner({ status, engramaName }) {
  if (!status || status === 'approved') return ''
  if (status === 'pending') return `
    <div class="sync-banner sync-banner--pending">
      <span>Esperando aprobación del profesor para sincronizar <strong>${engramaName ?? ''}</strong></span>
    </div>`
  if (status === 'rejected') return `
    <div class="sync-banner sync-banner--rejected">
      <span>Acceso denegado por el profesor — el estudio offline sigue disponible</span>
    </div>`
  return ''
}

function _nextReviewHint({ nextReviewAt }) {
  if (!nextReviewAt) return 'Vuelve mañana para continuar'
  const now = new Date()
  const diffMs = nextReviewAt - now
  if (diffMs <= 0) return 'Vuelve pronto'
  const diffH = diffMs / 3_600_000
  if (diffH < 1) {
    const min = Math.ceil(diffMs / 60_000)
    return `Próxima revisión en ${min} min`
  }
  if (diffH < 24) {
    return `Próxima revisión a las ${nextReviewAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
  }
  return `Próxima revisión mañana`
}

function _deadlineHint(deadline) {
  const days = Math.ceil((deadline - Date.now()) / 86_400_000)
  if (days <= 0) return 'Fecha límite alcanzada'
  if (days === 1) return 'Fecha límite: mañana'
  return `Fecha límite: ${days} días`
}

function _studyLabel({ due, newCards }) {
  if (due >= 20)                 return 'Ponerse al día'  // 2+ sesiones pendientes
  if (due >= 10)                 return 'Estudiar'        // 1 sesión completa
  if (newCards > 0 && due < 10)  return 'Explorar'        // sesión corta con tarjetas nuevas
  return 'Repasar'                                        // sesión corta solo repasos
}

function escapeHtml(str) {
  const d = document.createElement('div')
  d.textContent = str
  return d.innerHTML
}
