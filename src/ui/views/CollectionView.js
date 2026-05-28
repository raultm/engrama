import { getContainer } from '../../infrastructure/container.js'
import { CollectionCard } from '../components/CollectionCard.js'
import { navigate } from '../router.js'

export function CollectionView(rootEl, collectionId) {
  const { collectionService, flashCardService } = getContainer()

  const collection = collectionService.getCollection(collectionId)
  if (!collection) {
    rootEl.innerHTML = `<div class="view"><p class="empty-state">Colección no encontrada.</p><button class="btn btn--ghost" onclick="window.location.hash='/'">← Inicio</button></div>`
    return
  }

  const dueCount = collection.getDueCardCount()
  const cards = flashCardService.getCardsForCollection(collectionId)

  rootEl.innerHTML = `
    <div class="view collection-view">
      <header class="view-header">
        <button class="btn btn--ghost btn--icon" id="btn-back" aria-label="Volver">←</button>
        <div class="view-header__info">
          <h1>${escapeHtml(collection.name)}</h1>
          ${collection.description ? `<p class="view-header__desc">${escapeHtml(collection.description)}</p>` : ''}
        </div>
      </header>

      <main class="collection-main">
        <div class="action-bar">
          <button class="btn btn--primary btn--lg ${dueCount === 0 ? 'btn--disabled' : ''}" id="btn-study"
            ${dueCount === 0 ? 'disabled aria-disabled="true"' : ''}>
            ${dueCount > 0 ? `Estudiar (${dueCount} tarjetas)` : 'Sin pendientes hoy ✓'}
          </button>
          <button class="btn btn--secondary" id="btn-add-card">+ Tarjeta</button>
        </div>

        ${collection.children.length > 0 ? `
          <section class="sub-section">
            <h2>Subcolecciones</h2>
            <div class="collections-grid" id="children-grid"></div>
          </section>
        ` : ''}

        <section class="cards-section">
          <h2>Tarjetas <span class="count">${cards.length}</span></h2>
          <div class="cards-list" id="cards-list"></div>
        </section>
      </main>
    </div>
  `

  rootEl.querySelector('#btn-back').addEventListener('click', () => {
    collection.parentId ? navigate(`collection/${collection.parentId}`) : navigate('/')
  })

  if (dueCount > 0) {
    rootEl.querySelector('#btn-study').addEventListener('click', () => {
      navigate(`study/${collectionId}`)
    })
  }

  rootEl.querySelector('#btn-add-card').addEventListener('click', () => {
    showAddCardModal(rootEl, collectionId, collection)
  })

  if (collection.children.length > 0) {
    const grid = rootEl.querySelector('#children-grid')
    collection.children.forEach(child => grid.appendChild(CollectionCard(child)))
  }

  const list = rootEl.querySelector('#cards-list')
  if (cards.length === 0) {
    list.innerHTML = `<p class="empty-state">No hay tarjetas en esta colección.</p>`
  } else {
    cards.forEach(card => list.appendChild(CardListItem(card, collectionId, rootEl, collection)))
  }
}

function CardListItem(card, collectionId, rootEl, collection) {
  const el = document.createElement('div')
  el.className = 'card-item'
  el.innerHTML = `
    <div class="card-item__front">${escapeHtml(card.frontText)}</div>
    <div class="card-item__back">${escapeHtml(card.backText)}</div>
    <div class="card-item__meta">
      <span class="elo-badge">ELO ${Math.round(card.eloDifficulty)}</span>
      ${card.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
      <button class="btn btn--ghost btn--sm btn--danger card-item__delete" data-id="${card.id}" aria-label="Eliminar tarjeta">✕</button>
    </div>
  `
  el.querySelector('.card-item__delete').addEventListener('click', () => {
    if (confirm('¿Eliminar esta tarjeta?')) {
      const { flashCardService } = getContainer()
      flashCardService.deleteCard(card.id)
      CollectionView(rootEl, collectionId)
    }
  })
  return el
}

function showAddCardModal(rootEl, collectionId, collection) {
  const { flashCardService } = getContainer()
  const modal = document.createElement('div')
  modal.className = 'modal-overlay'
  modal.setAttribute('role', 'dialog')
  modal.setAttribute('aria-modal', 'true')

  modal.innerHTML = `
    <div class="modal">
      <h2 class="modal__title">Nueva Tarjeta</h2>
      <form class="modal__form" id="add-card-form">
        <label class="form-label">Pregunta / Frente
          <textarea class="form-input form-textarea" name="front" required placeholder="¿Qué es...?"></textarea>
        </label>
        <label class="form-label">Respuesta / Reverso
          <textarea class="form-input form-textarea" name="back" required placeholder="La respuesta..."></textarea>
        </label>
        <label class="form-label">Tags (separados por coma)
          <input class="form-input" name="tags" type="text" placeholder="javascript, es6, funciones" />
        </label>
        <div class="modal__actions">
          <button type="button" class="btn btn--ghost" id="btn-cancel">Cancelar</button>
          <button type="submit" class="btn btn--primary">Crear</button>
        </div>
      </form>
    </div>
  `

  document.body.appendChild(modal)
  modal.querySelector('textarea[name=front]').focus()

  modal.querySelector('#btn-cancel').addEventListener('click', () => modal.remove())
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove() })

  modal.querySelector('#add-card-form').addEventListener('submit', (e) => {
    e.preventDefault()
    const data = new FormData(e.target)
    const tags = data.get('tags').split(',').map(t => t.trim()).filter(Boolean)
    flashCardService.createCard({
      collectionId,
      frontText: data.get('front'),
      backText: data.get('back'),
      tags,
    })
    modal.remove()
    CollectionView(rootEl, collectionId)
  })
}

function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
