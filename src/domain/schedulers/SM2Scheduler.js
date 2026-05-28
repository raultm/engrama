import { Scheduler } from './Scheduler.js'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const MIN_EASINESS = 1.3
const DEFAULT_EASINESS = 2.5
const MAX_SESSION_SIZE = 10

export class SM2Scheduler extends Scheduler {
  get type() {
    return 'sm2'
  }

  selectCards(cards, now = new Date()) {
    const due = cards.filter(c => c.isUnlocked && c.isDue(now))
    const reviews = shuffle(due.filter(c => !c.isNew()))
    const newCards = shuffle(due.filter(c => c.isNew()))
    return [...reviews, ...newCards].slice(0, MAX_SESSION_SIZE)
  }

  processAnswer(card, rating, now = new Date()) {
    const data = this._getOrInitData(card.schedulerData)
    const quality = this._ratingToQuality(rating)

    let { easiness, interval, repetitions } = data

    if (quality < 3) {
      repetitions = 0
      interval = 1
    } else {
      if (repetitions === 0) interval = 1
      else if (repetitions === 1) interval = 6
      else interval = Math.round(interval * easiness)
      repetitions += 1
    }

    easiness = Math.max(MIN_EASINESS, easiness + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

    const nextReview = new Date(now)
    nextReview.setDate(nextReview.getDate() + interval)

    const schedulerData = {
      easiness,
      interval,
      repetitions,
      nextReview: nextReview.toISOString(),
      lastRating: rating,
      lastReviewed: now.toISOString(),
    }

    return { schedulerData, intervalDays: interval }
  }

  _getOrInitData(existing) {
    return {
      easiness: existing?.easiness ?? DEFAULT_EASINESS,
      interval: existing?.interval ?? 0,
      repetitions: existing?.repetitions ?? 0,
    }
  }

  _ratingToQuality(rating) {
    // Map 0-3 ratings to SM2 quality 0-5
    return [0, 2, 4, 5][rating] ?? 0
  }
}
