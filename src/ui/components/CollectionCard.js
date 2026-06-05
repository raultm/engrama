import { navigate } from '../router.js'
import { escapeHtml } from '../utils/html.js'

export function CollectionCard(collection) {
  const el = document.createElement('div')
  el.className = 'collection-card'
  el.setAttribute('role', 'button')
  el.setAttribute('tabindex', '0')
  el.setAttribute('aria-label', `Colección: ${collection.name}`)

  const dueCount = collection.getDueCardCount()
  const newCount = collection.getNewCardCount()
  const total = collection.getTotalCardCount()

  el.innerHTML = `
    <div class="collection-card__header">
      <h3 class="collection-card__name">${escapeHtml(collection.name)}</h3>
      ${collection.description ? `<p class="collection-card__desc">${escapeHtml(collection.description)}</p>` : ''}
    </div>
    <div class="collection-card__stats">
      <span class="stat stat--due" title="Pendientes de hoy">${dueCount} pendientes</span>
      ${newCount > 0 ? `<span class="stat stat--new" title="Tarjetas nuevas">${newCount} nuevas</span>` : ''}
      <span class="stat stat--total">${total} total</span>
    </div>
    ${collection.children.length > 0 ? `
      <div class="collection-card__children">
        ${collection.children.map(child => `
          <button class="child-tag" data-id="${child.id}">${escapeHtml(child.name)}</button>
        `).join('')}
      </div>
    ` : ''}
  `

  el.addEventListener('click', (e) => {
    if (e.target.closest('.child-tag')) {
      const childId = e.target.closest('.child-tag').dataset.id
      navigate(`collection/${childId}`)
      return
    }
    navigate(`collection/${collection.id}`)
  })

  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigate(`collection/${collection.id}`)
    }
  })

  return el
}
