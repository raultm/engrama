import { getContainer } from '../../infrastructure/container.js'
import { navigate } from '../router.js'
import { showConfirm } from '../components/ConfirmModal.js'
import { getRank } from '../../domain/ranks.js'
import { showDeadlineModal } from '../components/DeadlineModal.js'
import { getActiveId, getRegistry, removeEngrama, setActiveId } from '../engramaRegistry.js'

export function StatsView(rootEl) {
  const { studySessionService, userProfileRepository, studySessionRepository } = getContainer()
  const deadline = studySessionService.getMasterDeadline()
  const profile = userProfileRepository.getOrCreate()
  const stats = studySessionService.getAllCardsStats()
  const sessions = studySessionRepository.findCompleted()

  const unlockPct = Math.round((stats.unlockedCount / stats.total) * 100)

  const nextMilestone = stats.lockedMilestones[0]
  // La tarjeta se vuelve accesible cuando ELO_usuario + 200 >= card.eloDifficulty
  const eloNeeded = nextMilestone ? Math.max(0, nextMilestone.elo - (profile.eloRating + 200)) : 0

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
          <div class="stats-block stats-block--accent">
            <span class="stats-block__value">${stats.due}</span>
            <span class="stats-block__label">Pendientes hoy</span>
          </div>
          <div class="stats-block">
            <span class="stats-block__value">${stats.newCards}</span>
            <span class="stats-block__label">Nuevas sin ver</span>
          </div>
          <div class="stats-block">
            <span class="stats-block__value">${stats.total}</span>
            <span class="stats-block__label">Total tarjetas</span>
          </div>
        </div>

        <div class="unlock-section">
          <div class="unlock-section__header">
            <h2>Tarjetas accesibles</h2>
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
            <p class="unlock-complete">¡Tienes acceso a todas las tarjetas del mazo!</p>
          `}
        </div>

        <div class="session-history">
          <h2>Historial de sesiones</h2>
          ${_renderEloChart(sessions)}
          ${_renderSessionList(sessions)}
        </div>

        <div class="danger-zone">
          <button class="btn--download-db" id="btn-download">Descargar base de datos (.db)</button>
          <label class="btn--download-db btn--upload-label" aria-label="Importar archivo de datos">
            Importar archivo de datos (.apkg / .json / .md)
            <input type="file" id="file-input" accept=".apkg,.json,.md" style="display:none">
          </label>
          <div class="deadline-section">
            <label class="deadline-label" for="deadline-input">Fecha límite del temario</label>
            <input type="date" id="deadline-input" class="deadline-input"
              value="${deadline ? deadline.toISOString().slice(0,10) : ''}"
              min="${new Date().toISOString().slice(0,10)}">
            ${deadline ? `<button class="deadline-clear" id="btn-clear-deadline">Quitar</button>` : ''}
          </div>

          <button class="btn--danger-full" id="btn-delete-engrama">Eliminar este Engrama</button>
          <button class="btn--danger-full" id="btn-reset" style="opacity:0.6;font-size:12px">Borrar toda la base de datos</button>
        </div>

      </main>
    </div>
  `

  rootEl.querySelector('#btn-back').addEventListener('click', () => navigate('/'))

  rootEl.querySelector('#deadline-input').addEventListener('change', (e) => {
    const val = e.target.value
    if (val) {
      studySessionService.setMasterDeadline(new Date(val + 'T23:59:59'))
    }
    StatsView(rootEl)
  })

  rootEl.querySelector('#btn-clear-deadline')?.addEventListener('click', () => {
    studySessionService.setMasterDeadline(null)
    StatsView(rootEl)
  })

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
    // Borrar BD + imágenes del almacenamiento (OPFS o localStorage)
    const { db } = getContainer()
    await db.reset()
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

    try {
      const container = getContainer()

      if (file.name.endsWith('.apkg')) {
        await container.ankiImporter.importApkg(file)
        const deadline = await showDeadlineModal()
        if (deadline) container.studySessionService.setMasterDeadline(deadline)
        location.reload()
        return
      }

      const format = file.name.endsWith('.md') ? 'markdown' : 'json'
      const text = await file.text()
      const result = await container.seedService.importFile(text, format)

      if (result.replaced) {
        const deadline = await showDeadlineModal()
        if (deadline) container.studySessionService.setMasterDeadline(deadline)
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

// ── Gráfico ELO ──────────────────────────────────────────────────────────────

function _renderEloChart(sessions) {
  const valid = sessions.filter(s => JSON.parse(s.summary || '{}').eloEnd != null)
  if (valid.length < 2) {
    return `<p class="sessions-empty">Completa al menos 2 sesiones para ver la evolución del ELO.</p>`
  }

  const values = valid.map(s => JSON.parse(s.summary).eloEnd)
  const W = 400, H = 80
  const pL = 38, pR = 8, pT = 10, pB = 10
  const cW = W - pL - pR
  const cH = H - pT - pB

  const lo = Math.min(...values) - 30
  const hi = Math.max(...values) + 30
  const range = hi - lo

  const toX = i => pL + (i / (values.length - 1)) * cW
  const toY = v => pT + (1 - (v - lo) / range) * cH

  const pts = values.map((v, i) => ({ x: toX(i), y: toY(v), v }))
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L${pts.at(-1).x.toFixed(1)},${(pT + cH).toFixed(1)} L${pts[0].x.toFixed(1)},${(pT + cH).toFixed(1)} Z`

  const yTicks = [lo + 30, Math.round((lo + 30 + hi - 30) / 2), hi - 30]

  return `
    <svg class="elo-chart" viewBox="0 0 ${W} ${H}" aria-label="Evolución del ELO">
      <defs>
        <linearGradient id="eloGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0"/>
        </linearGradient>
      </defs>

      ${yTicks.map(v => `
        <line x1="${pL}" y1="${toY(v).toFixed(1)}" x2="${W - pR}" y2="${toY(v).toFixed(1)}" class="chart-grid"/>
        <text x="${pL - 4}" y="${(toY(v) + 3.5).toFixed(1)}" class="chart-label" text-anchor="end">${v}</text>
      `).join('')}

      <path d="${areaPath}" fill="url(#eloGrad)"/>
      <path d="${linePath}" fill="none" stroke="var(--color-primary)" stroke-width="1.8"
            stroke-linecap="round" stroke-linejoin="round"/>

      ${pts.map(p => `
        <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}"
          r="${pts.length > 20 ? 1.8 : 3}"
          fill="var(--color-primary)" stroke="var(--color-surface)" stroke-width="1.5"/>
      `).join('')}
    </svg>
  `
}

// ── Lista de sesiones ─────────────────────────────────────────────────────────

function _renderSessionList(sessions) {
  if (sessions.length === 0) return ''
  return `
    <div class="session-list">
      ${[...sessions].reverse().slice(0, 15).map(_sessionRow).join('')}
    </div>
  `
}

function _sessionRow(row) {
  const s = JSON.parse(row.summary || '{}')
  const delta = (s.eloEnd ?? s.eloStart ?? 1500) - (s.eloStart ?? 1500)
  const started = new Date(row.started_at)
  const secs = row.completed_at
    ? Math.round((new Date(row.completed_at) - started) / 1000)
    : 0
  const abandoned = row.status === 'abandoned'

  return `
    <div class="session-row ${abandoned ? 'session-row--abandoned' : ''}">
      <div class="session-row__date">${_relativeDate(started)}</div>
      <div class="session-row__meta">
        <span>${s.totalCards ?? 0} tarjetas</span>
        <span>${_formatDuration(secs)}</span>
        ${abandoned ? '<span class="session-row__tag">abandonada</span>' : ''}
      </div>
      <div class="session-row__ratings">
        ${_pill(s.perfect,  'perfect',   'P')}
        ${_pill(s.good,     'good',      'B')}
        ${_pill(s.hard,     'hard',      'D')}
        ${_pill(s.forgotten,'forgotten', 'O')}
      </div>
      <div class="session-row__delta ${delta >= 0 ? 'elo-up' : 'elo-down'}">
        ${delta >= 0 ? '+' : ''}${delta}
      </div>
    </div>
  `
}

function _pill(count, type, label) {
  if (!count) return ''
  return `<span class="s-pill s-pill--${type}" title="${label}: ${count}">${count}</span>`
}

function _formatDuration(secs) {
  if (secs < 60) return `${secs}s`
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function _relativeDate(date) {
  const days = Math.floor((Date.now() - date) / 86400000)
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  if (days < 7)  return `Hace ${days} días`
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}
