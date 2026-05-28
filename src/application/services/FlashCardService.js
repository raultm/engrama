import { FlashCard } from '../../domain/entities/FlashCard.js'
import { generateId } from '../../infrastructure/utils/generateId.js'

export class FlashCardService {
  constructor({ flashCardRepository }) {
    this._repo = flashCardRepository
  }

  getCardsForCollection(collectionId) {
    return this._repo.findByCollection(collectionId)
  }

  createCard({ collectionId, frontText, backText, tags = [], eloDifficulty = 1500 }) {
    const card = new FlashCard({
      id: generateId(),
      collectionId,
      frontText,
      backText,
      tags,
      eloDifficulty,
    })
    return this._repo.save(card)
  }

  updateCard(id, fields) {
    const card = this._repo.findById(id)
    if (!card) throw new Error(`Card not found: ${id}`)
    const updated = card.update(fields)
    return this._repo.save(updated)
  }

  deleteCard(id) {
    this._repo.delete(id)
  }
}
