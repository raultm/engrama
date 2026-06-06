import { initContainer } from '../../infrastructure/container.js'
import { getRegistry, registerEngrama, setActiveId, getActiveId } from '../engramaRegistry.js'
import { JoinClassView } from './JoinClassView.js'
import { showDeadlineModal } from '../components/DeadlineModal.js'

async function finishImport(container, engramaId, name) {
  registerEngrama(engramaId, name)
  setActiveId(engramaId)
  const deadline = await showDeadlineModal()
  if (deadline) container.studySessionService.setMasterDeadline(deadline)
  if (container.db.flushNow) await container.db.flushNow()
  location.reload()
}

// ── Iconos ────────────────────────────────────────────────────────────────────

const ICON_UPLOAD = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
  <polyline points="17 8 12 3 7 8"/>
  <line x1="12" y1="3" x2="12" y2="15"/>
</svg>`

const ICON_CLASS = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
  <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
</svg>`

const ICON_DEMO = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-4m-5 0h5"/>
</svg>`

const ICON_MAP = {
  tsumego: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="9"/>
    <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>
  </svg>`,
  deck: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
  </svg>`,
  book: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>`,
  language: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>`,
  science: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 3h6m-6 0v6l-4 9a1 1 0 0 0 .9 1.45h12.2A1 1 0 0 0 19 18l-4-9V3"/>
    <line x1="6.5" y1="16" x2="17.5" y2="16"/>
  </svg>`,
  math: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="19" y1="5" x2="5" y2="19"/>
    <circle cx="6.5" cy="6.5" r="2.5"/>
    <circle cx="17.5" cy="17.5" r="2.5"/>
  </svg>`,
  music: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 18V5l12-2v13"/>
    <circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
  </svg>`,
  geography: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
    <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
  </svg>`,
  anatomy: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>`,
  history: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>`,
}

const FALLBACK_ICONS = ['book', 'language', 'science', 'math', 'geography', 'history', 'music', 'anatomy']
let _fallbackIdx = 0

function seedIcon(entry) {
  if (entry.icon && ICON_MAP[entry.icon]) return ICON_MAP[entry.icon]
  if (entry.id.includes('tsumego')) return ICON_MAP.tsumego
  return ICON_MAP[FALLBACK_ICONS[_fallbackIdx++ % FALLBACK_ICONS.length]]
}

function badge(id, installedIds, activeId) {
  if (id === activeId)         return '<span class="seed-option__badge seed-option__badge--active">Activo</span>'
  if (installedIds.has(id))    return '<span class="seed-option__badge seed-option__badge--installed">Instalado</span>'
  return '<span class="seed-option__badge">→</span>'
}

function sectionTitle(text) {
  return `<h2 class="seed-section-title">${text}</h2>`
}

export function SeedSelectionView(rootEl, seedRegistry) {
  const installedIds = new Set(getRegistry().map(e => e.id))
  const activeId     = getActiveId()

  // 150 tsumegos primero, resto alfabético
  const sortedSeeds = [...seedRegistry].sort((a, b) => {
    if (a.id === 'tsumego-150-basicos') return -1
    if (b.id === 'tsumego-150-basicos') return  1
    return a.name.localeCompare(b.name)
  })

  rootEl.innerHTML = `
    <div class="view seed-selection-view">
      <main class="seed-selection-main">

        <div class="seed-selection-header">
          <span class="seed-selection-logo">◆</span>
          <h1>Elige un Engrama</h1>
          <p>Cada Engrama es un contexto de aprendizaje independiente</p>
          <p class="seed-selection-definition">
            <em>Del griego ἐγγράφω — la huella que deja el aprendizaje en el cerebro.</em>
          </p>
        </div>

        <div class="seed-list">

          ${sectionTitle('IMPORTAR')}

          <label class="seed-option seed-option--upload" aria-label="Subir archivo propio">
            <span class="seed-option__icon">${ICON_UPLOAD}</span>
            <div class="seed-option__text">
              <span class="seed-option__name">Subir archivo</span>
              <span class="seed-option__desc">Importa tu propio mazo en formato .apkg, .sgf o .md</span>
            </div>
            <span class="seed-option__badge seed-option__badge--action" id="upload-badge">Elegir</span>
            <input type="file" accept=".apkg,.sgf,.json,.md" style="display:none" id="file-upload">
          </label>

          <button class="seed-option seed-option--join" id="btn-join-class" aria-label="Unirse a una clase con código">
            <span class="seed-option__icon">${ICON_CLASS}</span>
            <div class="seed-option__text">
              <span class="seed-option__name">Unirse a una clase</span>
              <span class="seed-option__desc">Introduce el código que te dio tu profesor</span>
            </div>
            <span class="seed-option__badge seed-option__badge--action">Código</span>
          </button>

          ${sortedSeeds.length > 0 ? `
          ${sectionTitle('MAZOS')}
          ${sortedSeeds.map(entry => {
            const installed = installedIds.has(entry.id)
            const isActive  = entry.id === activeId
            return `
              <button class="seed-option ${installed ? 'seed-option--installed' : ''} ${isActive ? 'seed-option--active' : ''}"
                data-id="${entry.id}"
                aria-label="${entry.name}${installed ? ' (instalado)' : ''}">
                <span class="seed-option__icon">${seedIcon(entry)}</span>
                <div class="seed-option__text">
                  <span class="seed-option__name">${entry.name}</span>
                  <span class="seed-option__desc">${entry.description}</span>
                </div>
                ${badge(entry.id, installedIds, activeId)}
              </button>`
          }).join('')}
          ` : ''}

          ${sectionTitle('DEMOS')}
          <p class="seed-section-desc">Prueba diferentes tipos de tarjeta antes de importar tu propio contenido</p>

          <button class="seed-option seed-option--demo ${installedIds.has('tsumego-basicos') ? 'seed-option--installed' : ''} ${'tsumego-basicos' === activeId ? 'seed-option--active' : ''}"
            id="btn-demo-tsumego">
            <span class="seed-option__icon">${ICON_MAP.tsumego}</span>
            <div class="seed-option__text">
              <span class="seed-option__name">Tsumego básicos</span>
              <span class="seed-option__desc">7 problemas de vida y muerte — tarjetas de Go interactivas</span>
            </div>
            ${badge('tsumego-basicos', installedIds, activeId)}
          </button>

          <button class="seed-option seed-option--demo ${installedIds.has('test-atmosfera') ? 'seed-option--installed' : ''} ${'test-atmosfera' === activeId ? 'seed-option--active' : ''}"
            id="btn-demo-atmosfera">
            <span class="seed-option__icon">${ICON_DEMO}</span>
            <div class="seed-option__text">
              <span class="seed-option__name">Capas de la Atmósfera</span>
              <span class="seed-option__desc">9 tarjetas — básica, cloze y oclusión de imagen</span>
            </div>
            ${badge('test-atmosfera', installedIds, activeId)}
          </button>

          <button class="seed-option seed-option--demo ${installedIds.has('tsumego-ejemplo') ? 'seed-option--installed' : ''} ${'tsumego-ejemplo' === activeId ? 'seed-option--active' : ''}"
            id="btn-demo-tsumego-md">
            <span class="seed-option__icon">${ICON_MAP.tsumego}</span>
            <div class="seed-option__text">
              <span class="seed-option__name">Tsumego desde Markdown</span>
              <span class="seed-option__desc">3 problemas — ejemplo de importación con archivo .md</span>
            </div>
            ${badge('tsumego-ejemplo', installedIds, activeId)}
          </button>

        </div>

        ${installedIds.size > 0 ? `
          <button class="btn btn--ghost seed-selection-back" id="btn-back">← Volver</button>
        ` : ''}

      </main>
    </div>
  `

  // ── Listeners ─────────────────────────────────────────────────────────────

  rootEl.querySelector('#btn-join-class').addEventListener('click', () => {
    JoinClassView(rootEl, { onBack: () => SeedSelectionView(rootEl, seedRegistry) })
  })

  rootEl.querySelector('#btn-demo-atmosfera').addEventListener('click', async () => {
    const DEMO_ID = 'test-atmosfera'
    const badge   = rootEl.querySelector('#btn-demo-atmosfera .seed-option__badge')
    if (installedIds.has(DEMO_ID)) { setActiveId(DEMO_ID); location.reload(); return }
    badge.textContent = '…'
    try {
      const res  = await fetch('./seeds/test-atmosfera.apkg')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const file = new File([blob], 'test-atmosfera.apkg', { type: 'application/zip' })
      const container = await initContainer(DEMO_ID)
      await container.ankiImporter.importApkg(file)
      await finishImport(container, DEMO_ID, 'Demo — Capas de la Atmósfera')
    } catch (err) {
      badge.textContent = 'Error'
      console.error('Demo import error:', err)
      alert(`Error al cargar el demo: ${err.message}`)
    }
  })

  rootEl.querySelector('#btn-demo-tsumego-md').addEventListener('click', async () => {
    const DEMO_ID = 'tsumego-ejemplo'
    const badge   = rootEl.querySelector('#btn-demo-tsumego-md .seed-option__badge')
    if (installedIds.has(DEMO_ID)) { setActiveId(DEMO_ID); location.reload(); return }
    badge.textContent = '…'
    try {
      const res  = await fetch('./seeds/tsumego-ejemplo.md')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      const container = await initContainer(DEMO_ID)
      await container.seedService.importFile(text, 'markdown')
      await finishImport(container, DEMO_ID, 'Demo — Tsumego (Markdown)')
    } catch (err) {
      badge.textContent = 'Error'
      console.error('Tsumego MD demo error:', err)
      alert(`Error: ${err.message}`)
    }
  })

  rootEl.querySelector('#btn-demo-tsumego').addEventListener('click', async () => {
    const DEMO_ID = 'tsumego-basicos'
    const badge   = rootEl.querySelector('#btn-demo-tsumego .seed-option__badge')
    if (installedIds.has(DEMO_ID)) { setActiveId(DEMO_ID); location.reload(); return }
    badge.textContent = '…'
    try {
      const res  = await fetch('./seeds/tsumego-basicos.sgf')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      const container = await initContainer(DEMO_ID)
      container.sgfImporter.importSgf(text, 'tsumego-basicos.sgf')
      await finishImport(container, DEMO_ID, 'Demo — Tsumego básicos')
    } catch (err) {
      badge.textContent = 'Error'
      console.error('Tsumego demo error:', err)
      alert(`Error: ${err.message}`)
    }
  })

  rootEl.querySelector('#btn-back')?.addEventListener('click', () => {
    window.location.hash = '/'
    window.location.reload()
  })

  rootEl.querySelector('#file-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const badge = rootEl.querySelector('#upload-badge')
    badge.textContent = '…'
    try {
      const engramaId = file.name
        .replace(/\.(apkg|json|md)$/i, '').toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        || 'custom'
      const container = await initContainer(engramaId)
      if (file.name.endsWith('.apkg')) {
        await container.ankiImporter.importApkg(file)
      } else if (file.name.endsWith('.sgf')) {
        const text = await file.text()
        container.sgfImporter.importSgf(text, file.name)
      } else {
        const format = file.name.endsWith('.md') ? 'markdown' : 'json'
        const text   = await file.text()
        await container.seedService.importFile(text, format)
      }
      const roots = container.collectionRepository.findRoots()
      const name  = roots[0]?.name ?? engramaId
      await finishImport(container, engramaId, name)
    } catch (err) {
      badge.textContent = 'Error'
      console.error('Import error:', err)
      alert(`Error al importar: ${err.message}`)
    }
  })

  rootEl.querySelector('.seed-list').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-id]')
    if (!btn || btn.disabled) return
    btn.disabled = true
    const badgeEl = btn.querySelector('.seed-option__badge')
    badgeEl.textContent = '…'
    const entry = seedRegistry.find(s => s.id === btn.dataset.id)
    try {
      const container = await initContainer(entry.id)
      if (installedIds.has(entry.id) && container.db.isSeeded()) {
        setActiveId(entry.id)
        location.reload()
        return
      }
      await container.seedService.seedFromRegistry(entry)
      await finishImport(container, entry.id, entry.name)
    } catch (err) {
      console.error('Error al instalar el mazo:', err)
      btn.disabled = false
      badgeEl.textContent = '→'
      alert(`Error al instalar "${entry?.name}": ${err.message}`)
    }
  })
}
