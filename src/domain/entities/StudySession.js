export const SessionStatus = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  PAUSED: 'paused',
}

export class StudySession {
  constructor({
    id,
    collectionId,
    schedulerType,
    cards = [],
    results = [],
    status = SessionStatus.ACTIVE,
    startedAt = new Date().toISOString(),
    completedAt = null,
    currentIndex = 0,
  }) {
    this.id = id
    this.collectionId = collectionId
    this.schedulerType = schedulerType
    this.cards = cards
    this.results = results
    this.status = status
    this.startedAt = startedAt
    this.completedAt = completedAt
    this.currentIndex = currentIndex
  }

  get currentCard() {
    return this.cards[this.currentIndex] ?? null
  }

  get isFinished() {
    return this.currentIndex >= this.cards.length
  }

  get progress() {
    if (this.cards.length === 0) return 1
    return this.currentIndex / this.cards.length
  }

  recordResult(cardId, rating, updatedCard, eloChange) {
    return new StudySession({
      ...this,
      results: [...this.results, { cardId, rating, eloChange, answeredAt: new Date().toISOString() }],
      cards: this.cards.map(c => c.id === cardId ? updatedCard : c),
      currentIndex: this.currentIndex + 1,
      status: this.currentIndex + 1 >= this.cards.length ? SessionStatus.COMPLETED : SessionStatus.ACTIVE,
      completedAt: this.currentIndex + 1 >= this.cards.length ? new Date().toISOString() : null,
    })
  }

  getSummary() {
    const ratings = this.results.map(r => r.rating)
    return {
      total: this.cards.length,
      answered: this.results.length,
      forgotten: ratings.filter(r => r === 0).length,
      hard: ratings.filter(r => r === 1).length,
      good: ratings.filter(r => r === 2).length,
      perfect: ratings.filter(r => r === 3).length,
      totalEloChange: this.results.reduce((sum, r) => sum + (r.eloChange ?? 0), 0),
    }
  }
}
