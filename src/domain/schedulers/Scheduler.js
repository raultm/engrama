/**
 * Interface contract for all scheduler implementations.
 * Each scheduler must implement these methods.
 *
 * Ratings:
 *   0 = forgotten
 *   1 = hard
 *   2 = good
 *   3 = perfect
 */
export class Scheduler {
  get type() {
    throw new Error('Scheduler must implement get type()')
  }

  /**
   * @param {FlashCard[]} cards
   * @param {Date} now
   * @returns {FlashCard[]} ordered cards to study
   */
  selectCards(cards, now = new Date()) {
    throw new Error('Scheduler must implement selectCards()')
  }

  /**
   * @param {FlashCard} card
   * @param {number} rating 0-3
   * @param {Date} now
   * @returns {{ schedulerData: object, intervalDays: number }}
   */
  processAnswer(card, rating, now = new Date()) {
    throw new Error('Scheduler must implement processAnswer()')
  }
}
