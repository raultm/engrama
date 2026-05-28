import { getContainer } from '../../infrastructure/container.js'
import { navigate } from '../router.js'
import { toggleTheme, getTheme } from '../theme.js'
import { getRegistry, getActiveId, setActiveId } from '../engramaRegistry.js'
import { buildSeedRegistry } from '../../data/seedRegistry.js'
import { SeedSelectionView } from './SeedSelectionView.js'

export function HomeView(rootEl) {
  const { studySessionService, userProfileRepository } = getContainer()

  const profile = userProfileRepository.getOrCreate()
  const stats = studySessionService.getAllCardsStats()
  const canStudy = stats.due > 0

  const registry = getRegistry()
  const activeId = getActiveId()

  rootEl.innerHTML = `
    <div class="view home-view">
      <header class="home-header">
        <span class="home-header__logo">◆ Engrama</span>
        <div class="home-header__actions">
          <div class="engrama-selector">
            <select id="engrama-select" aria-label="Cambiar Engrama" title="Cambiar Engrama">
              ${registry.map(e => `
                <option value="${e.id}" ${e.id === activeId ? 'selected' : ''}>${e.name}</option>
              `).join('')}
              <option value="__add__">+ Añadir Engrama</option>
            </select>
          </div>
          <button class="btn btn--ghost btn--icon btn--sm" id="btn-theme" aria-label="Cambiar tema">${getTheme() === 'dark' ? '☀' : '☾'}</button>
          <button class="btn btn--ghost btn--sm" id="btn-stats">Estadísticas</button>
        </div>
      </header>

      <main class="home-main">

        <section class="elo-section">
          <div class="elo-level">
            ${escapeHtml(profile.displayName)} ·
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
          <div class="elo-meta">
            <span>${profile.eloRating} ELO</span>
            <span>${Math.round(profile.getLevelProgress() * 100)}% → ${getRank(profile.eloRating + 100)}</span>
          </div>
        </section>

        <section class="counters-section">
          <div class="counter counter--due">
            <span class="counter__number">${stats.due}</span>
            <span class="counter__label">para hoy</span>
          </div>
          <div class="counter counter--notdue">
            <span class="counter__number">${stats.notDue}</span>
            <span class="counter__label">programadas</span>
          </div>
          <div class="counter counter--new">
            <span class="counter__number">${stats.newCards}</span>
            <span class="counter__label">nuevas</span>
          </div>
          <div class="counter counter--total">
            <span class="counter__number">${stats.total}</span>
            <span class="counter__label">total</span>
          </div>
        </section>

        <section class="study-cta">
          <button
            class="btn btn--primary btn--study ${canStudy ? '' : 'btn--disabled'}"
            id="btn-study"
            ${canStudy ? '' : 'disabled aria-disabled="true"'}
          >
            ${canStudy ? `Estudiar · ${stats.due} tarjetas` : '✓ Al día por hoy'}
          </button>
          ${!canStudy && stats.total > 0 ? `<p class="cta-hint">Vuelve mañana para continuar</p>` : ''}
          ${stats.total === 0 ? `<p class="cta-hint">No hay tarjetas cargadas</p>` : ''}
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

  rootEl.querySelector('#btn-theme').addEventListener('click', () => {
    toggleTheme()
    HomeView(rootEl)
  })

  rootEl.querySelector('#btn-stats').addEventListener('click', () => navigate('stats'))
}

const RANKS = [
  { min: 2100, name: 'Gran Maestro' },
  { min: 2000, name: 'Maestro' },
  { min: 1900, name: 'Experto' },
  { min: 1800, name: 'Conocedor' },
  { min: 1700, name: 'Practicante' },
  { min: 1600, name: 'Estudiante' },
  { min: 1500, name: 'Aprendiz' },
  { min: 0,    name: 'Curioso' },
]

export function getRank(elo) {
  return (RANKS.find(r => elo >= r.min) ?? RANKS.at(-1)).name
}

function escapeHtml(str) {
  const d = document.createElement('div')
  d.textContent = str
  return d.innerHTML
}
