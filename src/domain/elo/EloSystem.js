const K_FACTOR_USER = 32
const K_FACTOR_CARD = 16
const DEFAULT_ELO = 1500

export class EloSystem {
  /**
   * Calculate ELO changes after a card answer.
   * rating: 0=forgotten, 1=hard, 2=good, 3=perfect
   */
  calculateChange(userElo, cardElo, rating) {
    const expectedUser = this._expected(userElo, cardElo)
    const actualUser = this._actualScore(rating)

    const userDelta = Math.round(K_FACTOR_USER * (actualUser - expectedUser))
    // Card moves opposite to user: harder = ELO up when user fails
    const cardDelta = Math.round(K_FACTOR_CARD * ((1 - actualUser) - (1 - expectedUser)))

    return {
      userDelta,
      cardDelta,
      newUserElo: Math.max(100, userElo + userDelta),
      newCardElo: Math.max(100, cardElo + cardDelta),
    }
  }

  _expected(ratingA, ratingB) {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
  }

  _actualScore(rating) {
    // 0=forgotten→0, 1=hard→0.25, 2=good→0.75, 3=perfect→1
    return [0, 0.25, 0.75, 1][rating] ?? 0
  }
}

export const eloSystem = new EloSystem()
