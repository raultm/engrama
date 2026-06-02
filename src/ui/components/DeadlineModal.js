/**
 * Pregunta al usuario cuándo tiene que saber el temario.
 * Devuelve Promise<Date|null> — null si decide saltárselo.
 */
export function showDeadlineModal() {
  const defaultDate = new Date(Date.now() + 7 * 86_400_000)
  const defaultStr  = defaultDate.toISOString().slice(0, 10)
  const todayStr    = new Date().toISOString().slice(0, 10)

  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay'
    overlay.setAttribute('role', 'dialog')
    overlay.setAttribute('aria-modal', 'true')

    overlay.innerHTML = `
      <div class="modal deadline-modal">
        <h2 class="modal__title">¿Cuándo necesitas saber el temario?</h2>
        <p class="deadline-modal__desc">
          Organizaremos las revisiones para aprovechar cada día al máximo y que consigas aprender todo lo posible antes de esa fecha.
        </p>
        <input
          type="date"
          id="dm-date"
          class="deadline-input deadline-modal__input"
          value="${defaultStr}"
          min="${todayStr}"
        >
        <div class="modal__actions">
          <button class="btn btn--ghost" id="dm-skip">Ahora no</button>
          <button class="btn btn--primary" id="dm-confirm">Fijar fecha</button>
        </div>
      </div>
    `

    function close(result) {
      overlay.removeEventListener('keydown', onKey)
      overlay.remove()
      resolve(result)
    }

    function onKey(e) {
      if (e.key === 'Escape') close(null)
    }

    overlay.querySelector('#dm-skip').addEventListener('click', () => close(null))
    overlay.querySelector('#dm-confirm').addEventListener('click', () => {
      const val = overlay.querySelector('#dm-date').value
      close(val ? new Date(val + 'T23:59:59') : null)
    })
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(null) })
    overlay.addEventListener('keydown', onKey)

    document.body.appendChild(overlay)
    overlay.querySelector('#dm-confirm').focus()
  })
}
