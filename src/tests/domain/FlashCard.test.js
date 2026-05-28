import { describe, it, expect } from 'vitest'
import { FlashCard } from '../../domain/entities/FlashCard.js'

describe('FlashCard', () => {
  function makeCard(overrides = {}) {
    return new FlashCard({
      id: 'test-1',
      collectionId: 'col-1',
      frontText: 'Question',
      backText: 'Answer',
      ...overrides,
    })
  }

  it('creates card with defaults', () => {
    const card = makeCard()
    expect(card.eloDifficulty).toBe(1500)
    expect(card.isUnlocked).toBe(true)
    expect(card.tags).toEqual([])
    expect(card.schedulerData).toEqual({})
  })

  it('isNew() returns true when no repetitions', () => {
    expect(makeCard().isNew()).toBe(true)
    expect(makeCard({ schedulerData: { repetitions: 0 } }).isNew()).toBe(true)
    expect(makeCard({ schedulerData: { repetitions: 1 } }).isNew()).toBe(false)
  })

  it('isDue() returns true when no nextReview', () => {
    expect(makeCard().isDue()).toBe(true)
  })

  it('isDue() returns false when review is in future', () => {
    const future = new Date(Date.now() + 86400000).toISOString()
    const card = makeCard({ schedulerData: { nextReview: future, repetitions: 1 } })
    expect(card.isDue()).toBe(false)
  })

  it('isDue() returns true when review is in past', () => {
    const past = new Date(Date.now() - 86400000).toISOString()
    const card = makeCard({ schedulerData: { nextReview: past, repetitions: 1 } })
    expect(card.isDue()).toBe(true)
  })

  it('update() preserves existing fields', () => {
    const card = makeCard()
    const updated = card.update({ frontText: 'New question' })
    expect(updated.frontText).toBe('New question')
    expect(updated.backText).toBe('Answer')
    expect(updated.id).toBe('test-1')
  })

  it('withElo() updates eloDifficulty', () => {
    const card = makeCard()
    const updated = card.withElo(1700)
    expect(updated.eloDifficulty).toBe(1700)
    expect(card.eloDifficulty).toBe(1500)
  })

  it('parses schedulerData from JSON string', () => {
    const card = makeCard({ schedulerData: '{"repetitions":3}' })
    expect(card.schedulerData.repetitions).toBe(3)
  })

  it('parses tags from JSON string', () => {
    const card = makeCard({ tags: '["js","es6"]' })
    expect(card.tags).toEqual(['js', 'es6'])
  })

  it('handles isUnlocked from SQLite integer', () => {
    expect(makeCard({ isUnlocked: 1 }).isUnlocked).toBe(true)
    expect(makeCard({ isUnlocked: 0 }).isUnlocked).toBe(false)
  })
})
