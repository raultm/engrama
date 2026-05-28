export class Collection {
  constructor({
    id,
    parentId = null,
    name,
    description = '',
    schedulerType = 'sm2',
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString(),
    children = [],
    flashCards = [],
  }) {
    this.id = id
    this.parentId = parentId
    this.name = name
    this.description = description
    this.schedulerType = schedulerType
    this.createdAt = createdAt
    this.updatedAt = updatedAt
    this.children = children
    this.flashCards = flashCards
  }

  getAllFlashCardsRecursive() {
    const own = [...this.flashCards]
    for (const child of this.children) {
      own.push(...child.getAllFlashCardsRecursive())
    }
    return own
  }

  getTotalCardCount() {
    return this.getAllFlashCardsRecursive().length
  }

  getDueCardCount(now = new Date()) {
    return this.getAllFlashCardsRecursive().filter(c => c.isDue(now)).length
  }

  getNewCardCount() {
    return this.getAllFlashCardsRecursive().filter(c => c.isNew()).length
  }

  addChild(collection) {
    return new Collection({
      ...this,
      children: [...this.children, collection],
    })
  }

  addFlashCard(card) {
    return new Collection({
      ...this,
      flashCards: [...this.flashCards, card],
    })
  }
}
