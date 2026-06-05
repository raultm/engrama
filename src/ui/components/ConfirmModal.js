import { escapeHtml } from '../utils/html.js'

export function showConfirm({
  title,
  message = '',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  dangerous = false,
} = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay'
    overlay.setAttribute('role', 'dialog')
    overlay.setAttribute('aria-modal', 'true')
    overlay.setAttribute('aria-label', title)

    overlay.innerHTML = `
      <div class="modal confirm-modal">
        <h2 class="modal__title">${escapeHtml(title)}</h2>
        ${message ? `<p class="confirm-modal__message">${escapeHtml(message)}</p>` : ''}
        <div class="modal__actions">
          ${cancelLabel ? `<button class="btn btn--ghost" id="cm-cancel">${escapeHtml(cancelLabel)}</button>` : ''}
          <button class="btn ${dangerous ? 'btn--confirm-danger' : 'btn--primary'}" id="cm-confirm">
            ${escapeHtml(confirmLabel)}
          </button>
        </div>
      </div>
    `

    function close(result) {
      overlay.removeEventListener('keydown', onKey)
      overlay.remove()
      resolve(result)
    }

    function onKey(e) {
      if (e.key === 'Escape') close(false)
      if (e.key === 'Enter') close(true)
    }

    overlay.querySelector('#cm-cancel')?.addEventListener('click', () => close(false))
    overlay.querySelector('#cm-confirm').addEventListener('click', () => close(true))
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false) })
    overlay.addEventListener('keydown', onKey)

    document.body.appendChild(overlay)

    // Focus el botón de confirmar por defecto (o cancelar si es peligroso)
    const focusTarget = dangerous
      ? overlay.querySelector('#cm-cancel')
      : overlay.querySelector('#cm-confirm')
    focusTarget.focus()
  })
}
