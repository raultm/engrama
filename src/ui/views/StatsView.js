import { getContainer } from '../../infrastructure/container.js'
import { navigate } from '../router.js'
import { showConfirm } from '../components/ConfirmModal.js'
import { getRank } from './HomeView.js'
import { getActiveId, getRegistry, removeEngrama, setActiveId } from '../engramaRegistry.js'

export function StatsView(rootEl) {
  const { studySessionService, userProfileRepository } = getContainer()
  const profile = userProfileRepository.getOrCreate()
  const stats = studySessionService.getAllCardsStats()

  const level = profile.getLevel()
  const levelPct = Math.round(profile.getLevelProgress() * 100)
  const unlockPct = Math.round((stats.unlockedCount / stats.total) * 100)

  const nextMilestone = stats.lockedMilestones[0]
  const eloNeeded = nextMilestone ? nextMilestone.elo - profile.eloRating : 0

  rootEl.innerHTML = `
    <div class="view stats-view">
      <header class="view-header">
        <button class="btn btn--ghost btn--icon" id="btn-back" aria-label="Volver">←</button>
        <h1>Estadísticas</h1>
      </header>

      <main class="stats-main">

        <div class="stats-grid">
          <div class="stats-block">
            <span class="stats-block__value">${profile.eloRating}</span>
            <span class="stats-block__label">ELO actual</span>
          </div>
          <div class="stats-block">
            <span class="stats-block__value" style="font-size:18px">${getRank(profile.eloRating)}</span>
            <span class="stats-block__label">Rango</span>
          </div>
          <div class="stats-block">
            <span class="stats-block__value">${profile.totalCardsStudied}</span>
            <span class="stats-block__label">Tarjetas estudiadas</span>
          </div>
          <div class="stats-block">
            <span class="stats-block__value">${profile.totalSessionsCompleted}</span>
            <span class="stats-block__label">Sesiones completadas</span>
          </div>
          <div class="stats-block stats-block--accent">
            <span class="stats-block__value">${stats.due}</span>
            <span class="stats-block__label">Pendientes hoy</span>
          </div>
          <div class="stats-block">
            <span class="stats-block__value">${stats.newCards}</span>
            <span class="stats-block__label">Nuevas sin ver</span>
          </div>
          <div class="stats-block">
            <span class="stats-block__value">${stats.notDue}</span>
            <span class="stats-block__label">Programadas</span>
          </div>
          <div class="stats-block">
            <span class="stats-block__value">${stats.total}</span>
            <span class="stats-block__label">Total tarjetas</span>
          </div>
        </div>

        <div class="unlock-section">
          <div class="unlock-section__header">
            <h2>Tarjetas desbloqueadas</h2>
            <span class="unlock-count">${stats.unlockedCount} / ${stats.total}</span>
          </div>
          <div class="elo-track" role="progressbar" aria-valuenow="${unlockPct}" aria-valuemin="0" aria-valuemax="100" aria-label="Progreso de desbloqueo">
            <div class="elo-fill elo-fill--unlock" style="width:${unlockPct}%"></div>
          </div>

          ${stats.lockedCount > 0 ? `
            <div class="unlock-milestones">
              ${stats.lockedMilestones.map((m, i) => `
                <div class="milestone ${i === 0 ? 'milestone--next' : ''}">
                  <div class="milestone__elo">
                    <span class="milestone__lock">${i === 0 ? '◎' : '○'}</span>
                    ELO ${m.elo}
                    ${i === 0 ? `<span class="milestone__gap">· faltan ${eloNeeded} ELO</span>` : ''}
                  </div>
                  <span class="milestone__cards">${m.count} tarjeta${m.count > 1 ? 's' : ''}</span>
                </div>
              `).join('')}
            </div>
          ` : `
            <p class="unlock-complete">¡Has desbloqueado todas las tarjetas!</p>
          `}
        </div>

        <div class="elo-level-display">
          <h2>Nivel ${level}</h2>
          <div class="elo-track">
            <div class="elo-fill" style="width:${levelPct}%"></div>
          </div>
          <p>${levelPct}% hacia nivel ${level + 1}</p>
        </div>

        <div class="danger-zone">
          <button class="btn--download-db" id="btn-download">Descargar base de datos (.db)</button>
          <label class="btn--download-db btn--upload-label" aria-label="Importar archivo de datos">
            Importar archivo de datos (.json / .md)
            <input type="file" id="file-input" accept=".json,.md" style="display:none">
          </label>
          <button class="btn--danger-full" id="btn-delete-engrama">Eliminar este Engrama</button>
          <button class="btn--danger-full" id="btn-reset" style="opacity:0.6;font-size:12px">Borrar toda la base de datos</button>
        </div>

      </main>
    </div>
  `

  rootEl.querySelector('#btn-back').addEventListener('click', () => navigate('/'))

  rootEl.querySelector('#btn-delete-engrama').addEventListener('click', async () => {
    const activeId = getActiveId()
    const registry = getRegistry()
    const current = registry.find(e => e.id === activeId)
    const ok = await showConfirm({
      title: `¿Eliminar "${current?.name ?? activeId}"?`,
      message: 'Se borrarán todas las tarjetas y el progreso de este Engrama. No se puede deshacer.',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      dangerous: true,
    })
    if (!ok) return
    removeEngrama(activeId)
    location.reload()
  })

  rootEl.querySelector('#btn-download').addEventListener('click', () => {
    const { db } = getContainer()
    db.download()
  })

  rootEl.querySelector('#file-input').addEventListener('change', async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const format = file.name.endsWith('.md') ? 'markdown' : 'json'
    const text = await file.text()

    try {
      const { seedService } = getContainer()
      const result = await seedService.importFile(text, format)

      if (result.replaced) {
        location.reload()
      } else {
        await showConfirm({
          title: 'Importación completada',
          message: 'Las tarjetas nuevas se han añadido, las eliminadas se han borrado y el progreso existente se ha conservado.',
          confirmLabel: 'Aceptar',
          cancelLabel: '',
        })
        navigate('/')
      }
    } catch (err) {
      await showConfirm({
        title: 'Error al importar',
        message: err.message,
        confirmLabel: 'Cerrar',
        cancelLabel: '',
      })
    }

    e.target.value = ''
  })

  rootEl.querySelector('#btn-reset').addEventListener('click', async () => {
    const ok = await showConfirm({
      title: '¿Borrar todos los datos?',
      message: 'Se eliminarán todas las tarjetas, progreso, ELO y sesiones. Esta acción no se puede deshacer.',
      confirmLabel: 'Borrar todo',
      cancelLabel: 'Cancelar',
      dangerous: true,
    })
    if (!ok) return
    const { db } = getContainer()
    db.reset()
    location.reload()
  })
}
