import { initContainer } from '../../infrastructure/container.js'
import { registerEngrama, setActiveId } from '../engramaRegistry.js'
import { getOrCreateDeviceToken } from '../../infrastructure/sync/deviceToken.js'
import { API_BASE_URL } from '../../infrastructure/sync/config.js'

const BASE_URL = API_BASE_URL

export function JoinClassView(rootEl, { onBack } = {}) {
  _renderCodeStep(rootEl, onBack)
}

function _renderCodeStep(rootEl, onBack) {
  rootEl.innerHTML = `
    <div class="view join-class-view">
      <main class="join-class-main">
        <div class="join-class-card">
          <h1>Unirse a una clase</h1>
          <p class="join-class-subtitle">Introduce el código que te ha dado tu profesor</p>
          <div class="join-form">
            <input class="join-input" id="code-input"
              type="text" placeholder="PULSAR-CMT"
              autocomplete="off" spellcheck="false" maxlength="24">
            <p class="join-error" id="code-error" hidden></p>
            <button class="btn btn--primary" id="btn-search">Buscar clase</button>
            ${onBack ? `<button class="btn btn--ghost" id="btn-back">← Volver</button>` : ''}
          </div>
        </div>
      </main>
    </div>
  `

  const input = rootEl.querySelector('#code-input')
  const error = rootEl.querySelector('#code-error')
  const btn   = rootEl.querySelector('#btn-search')

  input.focus()
  input.addEventListener('input', () => { input.value = input.value.toUpperCase() })
  input.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click() })
  rootEl.querySelector('#btn-back')?.addEventListener('click', onBack)

  btn.addEventListener('click', async () => {
    const code = input.value.trim()
    if (!code) return

    btn.disabled = true
    btn.textContent = '…'
    error.hidden = true

    try {
      const res = await fetch(`${BASE_URL}/engramas/${code}`)
      if (res.status === 404) throw new Error('Código inválido')
      if (!res.ok) throw new Error('Error de conexión')
      const data = await res.json()
      _renderJoinStep(rootEl, code, data, onBack)
    } catch (err) {
      error.textContent = err.message
      error.hidden = false
      btn.disabled = false
      btn.textContent = 'Buscar clase'
    }
  })
}

function _renderJoinStep(rootEl, code, engrama, onBack) {
  rootEl.innerHTML = `
    <div class="view join-class-view">
      <main class="join-class-main">
        <div class="join-class-card">
          <div class="join-class-engrama-info">
            <span class="join-class-engrama-name">${engrama.name}</span>
            <span class="join-class-engrama-code">${code}</span>
          </div>
          <div class="join-form">
            <input class="join-input" id="name-input"
              type="text" placeholder="Tu nombre" autocomplete="name">
            <input class="join-input" id="email-input"
              type="email" placeholder="Email (opcional)" autocomplete="email">
            <p class="join-error" id="join-error" hidden></p>
            <button class="btn btn--primary" id="btn-join">Unirse</button>
            <button class="btn btn--ghost" id="btn-back">← Volver</button>
          </div>
        </div>
      </main>
    </div>
  `

  rootEl.querySelector('#btn-back').addEventListener('click', () => _renderCodeStep(rootEl, onBack))

  const nameInput  = rootEl.querySelector('#name-input')
  const emailInput = rootEl.querySelector('#email-input')
  const error      = rootEl.querySelector('#join-error')
  const btn        = rootEl.querySelector('#btn-join')

  nameInput.focus()

  btn.addEventListener('click', async () => {
    const displayName = nameInput.value.trim()
    if (!displayName) {
      error.textContent = 'Introduce tu nombre'
      error.hidden = false
      return
    }

    btn.disabled = true
    btn.textContent = '…'
    error.hidden = true

    try {
      const deviceToken = getOrCreateDeviceToken()
      const body = { deviceToken, displayName }
      const email = emailInput.value.trim()
      if (email) body.email = email

      const res = await fetch(`${BASE_URL}/engramas/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Error al unirse a la clase')
      const joinData = await res.json()

      // Persist sync state
      localStorage.setItem('engrama_sync_code', code)
      localStorage.setItem('engrama_sync_status', joinData.status)
      localStorage.setItem('engrama_sync_info', JSON.stringify({
        engramaId:   joinData.engramaId,
        engramaName: joinData.engramaName,
      }))

      // Import deck locally
      const engramaId = code.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const container = await initContainer(engramaId)
      await container.seedService.importFile(engrama.markdown, 'markdown')
      registerEngrama(engramaId, engrama.name)
      setActiveId(engramaId)

      location.reload()
    } catch (err) {
      error.textContent = err.message
      error.hidden = false
      btn.disabled = false
      btn.textContent = 'Unirse'
    }
  })
}
