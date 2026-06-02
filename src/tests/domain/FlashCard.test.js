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

  // ── Tipos de tarjeta y extraData ─────────────────────────────────────────

  it('cardType por defecto es "basic"', () => {
    expect(makeCard().cardType).toBe('basic')
  })

  it('cardType falsy cae a "basic"', () => {
    expect(makeCard({ cardType: null }).cardType).toBe('basic')
    expect(makeCard({ cardType: ''   }).cardType).toBe('basic')
  })

  it('preserva cardType cuando se proporciona', () => {
    expect(makeCard({ cardType: 'cloze'           }).cardType).toBe('cloze')
    expect(makeCard({ cardType: 'image_occlusion' }).cardType).toBe('image_occlusion')
  })

  it('extraData por defecto es objeto vacío', () => {
    expect(makeCard().extraData).toEqual({})
  })

  it('parsea extraData desde JSON string (como llega de SQLite)', () => {
    const card = makeCard({ extraData: '{"clozeIndex":2}' })
    expect(card.extraData).toEqual({ clozeIndex: 2 })
  })

  it('preserva extraData complejo a través de update()', () => {
    const masks = [{ id: '0', type: 'rect', x: 0.1, y: 0.2, w: 0.3, h: 0.4 }]
    const card = makeCard({ cardType: 'image_occlusion', extraData: { imageId: 'img-1', masks } })
    const updated = card.update({ frontText: 'nuevo' })
    expect(updated.extraData.imageId).toBe('img-1')
    expect(updated.extraData.masks).toHaveLength(1)
    expect(updated.cardType).toBe('image_occlusion')
  })
})
