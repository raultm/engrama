import { describe, it, expect } from 'vitest'
import { Collection } from '../../domain/entities/Collection.js'
import { FlashCard } from '../../domain/entities/FlashCard.js'

function makeCard(id) {
  return new FlashCard({ id, collectionId: 'col', frontText: 'Q', backText: 'A' })
}

function makeCollection(id, cards = [], children = []) {
  return new Collection({ id, name: id, flashCards: cards, children })
}

describe('Collection', () => {
  it('getAllFlashCardsRecursive returns own cards', () => {
    const col = makeCollection('root', [makeCard('c1'), makeCard('c2')])
    expect(col.getAllFlashCardsRecursive()).toHaveLength(2)
  })

  it('getAllFlashCardsRecursive includes nested child cards', () => {
    const child = makeCollection('child', [makeCard('c2'), makeCard('c3')])
    const root = makeCollection('root', [makeCard('c1')], [child])
    const all = root.getAllFlashCardsRecursive()
    expect(all).toHaveLength(3)
    expect(all.map(c => c.id)).toContain('c1')
    expect(all.map(c => c.id)).toContain('c2')
    expect(all.map(c => c.id)).toContain('c3')
  })

  it('handles deeply nested collections', () => {
    const deep = makeCollection('deep', [makeCard('d1')])
    const mid = makeCollection('mid', [makeCard('m1')], [deep])
    const root = makeCollection('root', [makeCard('r1')], [mid])
    expect(root.getAllFlashCardsRecursive()).toHaveLength(3)
  })

  it('getTotalCardCount returns correct count', () => {
    const child = makeCollection('child', [makeCard('c1'), makeCard('c2')])
    const root = makeCollection('root', [makeCard('r1')], [child])
    expect(root.getTotalCardCount()).toBe(3)
  })

  it('getDueCardCount only counts due cards', () => {
    const future = new Date(Date.now() + 86400000).toISOString()
    const past = new Date(Date.now() - 1000).toISOString()
    const dueCard = makeCard('due')
    const notDueCard = new FlashCard({
      id: 'not-due', collectionId: 'col', frontText: 'Q', backText: 'A',
      schedulerData: { nextReview: future, repetitions: 1 }
    })
    const col = makeCollection('root', [dueCard, notDueCard])
    expect(col.getDueCardCount()).toBe(1)
  })

  it('addChild returns new collection with child', () => {
    const root = makeCollection('root')
    const child = makeCollection('child')
    const updated = root.addChild(child)
    expect(updated.children).toHaveLength(1)
    expect(root.children).toHaveLength(0)
  })
})
