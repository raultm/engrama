import { describe, it, expect } from 'vitest'
import { SM2Scheduler } from '../../domain/schedulers/SM2Scheduler.js'
import { FlashCard } from '../../domain/entities/FlashCard.js'

function makeCard(id, schedulerData = {}, isUnlocked = true) {
  return new FlashCard({
    id,
    collectionId: 'col',
    frontText: 'Q',
    backText: 'A',
    schedulerData,
    isUnlocked,
  })
}

describe('SM2Scheduler', () => {
  const scheduler = new SM2Scheduler()

  it('type is sm2', () => {
    expect(scheduler.type).toBe('sm2')
  })

  describe('selectCards', () => {
    it('returns due unlocked cards', () => {
      const cards = [makeCard('c1'), makeCard('c2')]
      expect(scheduler.selectCards(cards)).toHaveLength(2)
    })

    it('excludes locked cards', () => {
      const cards = [makeCard('c1'), makeCard('c2', {}, false)]
      expect(scheduler.selectCards(cards)).toHaveLength(1)
    })

    it('excludes future review cards', () => {
      const future = new Date(Date.now() + 86400000).toISOString()
      const cards = [
        makeCard('due'),
        makeCard('not-due', { nextReview: future, repetitions: 1 }),
      ]
      expect(scheduler.selectCards(cards)).toHaveLength(1)
    })
  })

  describe('processAnswer', () => {
    it('forgotten (0) resets repetitions', () => {
      const card = makeCard('c1', { easiness: 2.5, interval: 10, repetitions: 5 })
      const { schedulerData } = scheduler.processAnswer(card, 0)
      expect(schedulerData.repetitions).toBe(0)
      expect(schedulerData.interval).toBe(1)
    })

    it('perfect (3) increases interval', () => {
      const card = makeCard('c1', { easiness: 2.5, interval: 0, repetitions: 0 })
      const { schedulerData } = scheduler.processAnswer(card, 3)
      expect(schedulerData.repetitions).toBe(1)
      expect(schedulerData.interval).toBe(1)
    })

    it('second perfect answer gives interval 6', () => {
      const card = makeCard('c1', { easiness: 2.5, interval: 1, repetitions: 1 })
      const { schedulerData } = scheduler.processAnswer(card, 3)
      expect(schedulerData.interval).toBe(6)
    })

    it('third perfect answer multiplies by easiness', () => {
      const card = makeCard('c1', { easiness: 2.5, interval: 6, repetitions: 2 })
      const { schedulerData } = scheduler.processAnswer(card, 3)
      expect(schedulerData.interval).toBe(15)
    })

    it('sets nextReview date in future', () => {
      const card = makeCard('c1')
      const now = new Date()
      const { schedulerData } = scheduler.processAnswer(card, 3, now)
      const nextReview = new Date(schedulerData.nextReview)
      expect(nextReview > now).toBe(true)
    })

    it('easiness decreases on hard (1) answer', () => {
      const card = makeCard('c1', { easiness: 2.5 })
      const { schedulerData } = scheduler.processAnswer(card, 1)
      expect(schedulerData.easiness).toBeLessThan(2.5)
    })

    it('easiness never goes below 1.3', () => {
      const card = makeCard('c1', { easiness: 1.3, interval: 1, repetitions: 1 })
      const { schedulerData } = scheduler.processAnswer(card, 0)
      expect(schedulerData.easiness).toBeGreaterThanOrEqual(1.3)
    })
  })
})
