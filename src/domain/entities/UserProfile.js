import { getRankProgress } from '../ranks.js'

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

  getLevelProgress() {
    return getRankProgress(this.eloRating)
  }
}
