export const SessionStatus = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned',
}

const MAX_REQUEUE = 2

export class StudySession {
  constructor({
    id,
    collectionId,
    schedulerType,
    cards = [],
    queue = null,
    results = [],
    status = SessionStatus.ACTIVE,
    startedAt = new Date().toISOString(),
    completedAt = null,
    currentIndex = 0,
    eloStart = 1500,
    requeueCounts = {},
  }) {
    this.id = id
    this.collectionId = collectionId
    this.schedulerType = schedulerType
    this.cards = cards
    this.queue = queue ?? [...cards]
    this.results = results
    this.status = status
    this.startedAt = startedAt
    this.completedAt = completedAt
    this.currentIndex = currentIndex
    this.eloStart = eloStart
    this.requeueCounts = requeueCounts
  }

  get currentCard() {
    return this.queue[0] ?? null
  }

  get isFinished() {
    return this.queue.length === 0
  }

  get masteredCount() {
    const mastered = new Set()
    for (const r of this.results) {
      if (r.rating >= 2) mastered.add(r.cardId)
    }
    return mastered.size
  }

  get progress() {
    if (this.cards.length === 0) return 1
    return this.masteredCount / this.cards.length
  }

  recordResult(cardId, rating, updatedCard, eloChange) {
    const newQueue = this.queue.slice(1)
    const requeueCount = this.requeueCounts[cardId] ?? 0
    const shouldRequeue = rating < 2 && requeueCount < MAX_REQUEUE && newQueue.length > 0

    if (shouldRequeue) {
      const insertAt = Math.min(2, newQueue.length)
      newQueue.splice(insertAt, 0, updatedCard)
    }

    const finished = newQueue.length === 0
    return new StudySession({
      ...this,
      results: [...this.results, { cardId, rating, eloChange, answeredAt: new Date().toISOString() }],
      cards: this.cards.map(c => c.id === cardId ? updatedCard : c),
      queue: newQueue,
      currentIndex: this.currentIndex + 1,
      status: finished ? SessionStatus.COMPLETED : SessionStatus.ACTIVE,
      completedAt: finished ? new Date().toISOString() : null,
      requeueCounts: shouldRequeue
        ? { ...this.requeueCounts, [cardId]: requeueCount + 1 }
        : this.requeueCounts,
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
