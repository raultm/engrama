export class UserProfile {
  constructor({
    id = 1,
    displayName = 'Estudiante',
    eloRating = 1500,
    totalCardsStudied = 0,
    totalSessionsCompleted = 0,
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString(),
  }) {
    this.id = id
    this.displayName = displayName
    this.eloRating = eloRating
    this.totalCardsStudied = totalCardsStudied
    this.totalSessionsCompleted = totalSessionsCompleted
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }

  withElo(elo) {
    return new UserProfile({
      ...this,
      eloRating: Math.max(100, Math.round(elo)),
      updatedAt: new Date().toISOString(),
    })
  }

  withSessionCompleted(cardsStudied) {
    return new UserProfile({
      ...this,
      totalCardsStudied: this.totalCardsStudied + cardsStudied,
      totalSessionsCompleted: this.totalSessionsCompleted + 1,
      updatedAt: new Date().toISOString(),
    })
  }

  getLevel() {
    return Math.max(1, Math.floor((this.eloRating - 1500) / 100) + 1)
  }

  getLevelProgress() {
    if (this.eloRating <= 1500) return 0
    const base = 1500 + (this.getLevel() - 1) * 100
    return (this.eloRating - base) / 100
  }
}
