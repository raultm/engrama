import { initContainer } from '../../infrastructure/container.js'
import { getRegistry, registerEngrama, setActiveId, getActiveId } from '../engramaRegistry.js'

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

          <label class="seed-option seed-option--upload" aria-label="Subir archivo propio">
            <span class="seed-option__icon">↑</span>
            <div class="seed-option__text">
              <span class="seed-option__name">Subir archivo</span>
              <span class="seed-option__desc">Importa tu propio mazo en formato .json o .md</span>
            </div>
            <span class="seed-option__badge seed-option__badge--upload" id="upload-badge">Elegir</span>
            <input type="file" accept=".json,.md" style="display:none" id="file-upload">
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
      const format = file.name.endsWith('.md') ? 'markdown' : 'json'
      const text = await file.text()

      // Derive engrama id from filename (without extension)
      const engramaId = file.name.replace(/\.(json|md)$/i, '').toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        || 'custom'

      const container = await initContainer(engramaId)
      const result = await container.seedService.importFile(text, format)

      // Get the name from the parsed seed (already imported into DB)
      const roots = container.collectionRepository.findRoots()
      const name = roots[0]?.name ?? engramaId

      registerEngrama(engramaId, name)
      setActiveId(engramaId)
      location.reload()
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
      registerEngrama(entry.id, entry.name)
      setActiveId(entry.id)
      location.reload()
    } catch (err) {
      console.error('Error al instalar el mazo:', err)
      btn.disabled = false
      badge.textContent = '→'
      alert(`Error al instalar "${entry?.name}": ${err.message}`)
    }
  })
}
