import { initContainer } from '../../infrastructure/container.js'
import { getRegistry, registerEngrama, setActiveId, getActiveId } from '../engramaRegistry.js'
import { JoinClassView } from './JoinClassView.js'
import { showDeadlineModal } from '../components/DeadlineModal.js'

async function finishImport(container, engramaId, name) {
  registerEngrama(engramaId, name)
  setActiveId(engramaId)
  const deadline = await showDeadlineModal()
  if (deadline) container.studySessionService.setMasterDeadline(deadline)
  location.reload()
}

export function SeedSelectionView(rootEl, seedRegistry) {
  const installedIds = new Set(getRegistry().map(e => e.id))
  const activeId = getActiveId()

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

          <button class="seed-option seed-option--join" id="btn-join-class" aria-label="Unirse a una clase con código">
            <span class="seed-option__icon">⌗</span>
            <div class="seed-option__text">
              <span class="seed-option__name">Unirse a una clase</span>
              <span class="seed-option__desc">Introduce el código que te dio tu profesor</span>
            </div>
            <span class="seed-option__badge seed-option__badge--upload">Código</span>
          </button>

          <button class="seed-option seed-option--demo ${installedIds.has('test-atmosfera') ? 'seed-option--installed' : ''} ${'test-atmosfera' === activeId ? 'seed-option--active' : ''}"
            id="btn-demo-atmosfera" aria-label="Demo: oclusión de imagen">
            <span class="seed-option__icon">◈</span>
            <div class="seed-option__text">
              <span class="seed-option__name">Demo — Capas de la Atmósfera</span>
              <span class="seed-option__desc">Básica · Cloze · Oclusión de imagen (9 tarjetas)</span>
            </div>
            <span class="seed-option__badge" id="demo-badge">
              ${'test-atmosfera' === activeId ? 'Activo' : installedIds.has('test-atmosfera') ? 'Instalado' : '→'}
            </span>
          </button>

          <label class="seed-option seed-option--upload" aria-label="Subir archivo propio">
            <span class="seed-option__icon">↑</span>
            <div class="seed-option__text">
              <span class="seed-option__name">Subir archivo</span>
              <span class="seed-option__desc">Importa tu propio mazo en formato .apkg, .json o .md</span>
            </div>
            <span class="seed-option__badge seed-option__badge--upload" id="upload-badge">Elegir</span>
            <input type="file" accept=".apkg,.json,.md" style="display:none" id="file-upload">
          </label>

          ${seedRegistry.map(entry => {
            const installed = installedIds.has(entry.id)
            const isActive = entry.id === activeId
            return `
              <button class="seed-option ${installed ? 'seed-option--installed' : ''} ${isActive ? 'seed-option--active' : ''}"
                data-id="${entry.id}"
                aria-label="${entry.name}${installed ? ' (instalado)' : ''}">
                <span class="seed-option__icon">${entry.icon}</span>
                <div class="seed-option__text">
                  <span class="seed-option__name">${entry.name}</span>
                  <span class="seed-option__desc">${entry.description}</span>
                </div>
                <span class="seed-option__badge">
                  ${isActive ? 'Activo' : installed ? 'Instalado' : '→'}
                </span>
              </button>
            `
          }).join('')}
        </div>

        ${installedIds.size > 0 ? `
          <button class="btn btn--ghost seed-selection-back" id="btn-back">← Volver</button>
        ` : ''}
      </main>
    </div>
  `

  rootEl.querySelector('#btn-join-class').addEventListener('click', () => {
    JoinClassView(rootEl, { onBack: () => SeedSelectionView(rootEl, seedRegistry) })
  })

  rootEl.querySelector('#btn-demo-atmosfera').addEventListener('click', async () => {
    const DEMO_ID = 'test-atmosfera'
    const badge = rootEl.querySelector('#demo-badge')

    if (installedIds.has(DEMO_ID)) {
      setActiveId(DEMO_ID)
      location.reload()
      return
    }

    badge.textContent = '…'
    try {
      const res = await fetch('./seeds/test-atmosfera.apkg')
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

  rootEl.querySelector('#btn-back')?.addEventListener('click', () => {
    window.location.hash = '/'
    window.location.reload()
  })

  // File upload handler
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
      } else {
        const format = file.name.endsWith('.md') ? 'markdown' : 'json'
        const text = await file.text()
        await container.seedService.importFile(text, format)
      }

      const roots = container.collectionRepository.findRoots()
      const name = roots[0]?.name ?? engramaId
      await finishImport(container, engramaId, name)
    } catch (err) {
      badge.textContent = 'Error'
      console.error('Import error:', err)
      alert(`Error al importar: ${err.message}`)
    }
  })

  // Built-in seed handler
  rootEl.querySelector('.seed-list').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-id]')
    if (!btn || btn.disabled) return

    btn.disabled = true
    const badge = btn.querySelector('.seed-option__badge')
    badge.textContent = '…'

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
      badge.textContent = '→'
      alert(`Error al instalar "${entry?.name}": ${err.message}`)
    }
  })
}
