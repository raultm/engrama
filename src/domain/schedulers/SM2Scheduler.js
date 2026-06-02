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
// Divisores para calcular el intervalo relativo al tiempo disponible:
//   Olvidada → tiempo_total / 20   (ej: 7 días → 8.4h)
//   Difícil  → tiempo_total / 10   (ej: 7 días → 16.8h)
const FORGOTTEN_DIVISOR   = 20
const HARD_DIVISOR        = 10
const MIN_INTERVAL_HOURS  = 0.5   // mínimo 30 minutos

// Valores fijos cuando no hay fecha límite configurada
const FORGOTTEN_DEFAULT_H = 4
const HARD_DEFAULT_H      = 8

// Techo máximo — aunque el plazo sea lejano, las tarjetas pendientes
// no se programan a más de estos valores
const FORGOTTEN_MAX_H = 4
const HARD_MAX_H      = 12

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

  processAnswer(card, rating, now = new Date(), deadlineMs = null) {
    const data = this._getOrInitData(card.schedulerData)
    const quality = this._ratingToQuality(rating)

    let { easiness, interval, repetitions } = data

    const forgotten = rating === 0
    const hard      = rating === 1

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

    let nextReview
    if (forgotten || hard) {
      const delayH = _shortDelay(forgotten, deadlineMs, now)
      nextReview = new Date(now.getTime() + delayH * 3_600_000)
    } else {
      nextReview = new Date(now)
      nextReview.setDate(nextReview.getDate() + interval)
      nextReview.setHours(0, 0, 0, 0)
    }

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

// Calcula el intervalo en horas para tarjetas olvidadas/difíciles.
// Con fecha límite: fracción proporcional del tiempo disponible.
// Sin fecha límite: valores fijos razonables.
function _shortDelay(forgotten, deadlineMs, now) {
  const maxH = forgotten ? FORGOTTEN_MAX_H : HARD_MAX_H
  if (deadlineMs) {
    const hoursLeft = Math.max(0, (deadlineMs - now.getTime()) / 3_600_000)
    const divisor   = forgotten ? FORGOTTEN_DIVISOR : HARD_DIVISOR
    // El techo impide que un plazo lejano genere intervalos de días
    return Math.min(maxH, Math.max(MIN_INTERVAL_HOURS, hoursLeft / divisor))
  }
  return forgotten ? FORGOTTEN_DEFAULT_H : HARD_DEFAULT_H
}
