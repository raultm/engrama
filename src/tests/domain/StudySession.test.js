import { describe, it, expect } from 'vitest'
import { StudySession, SessionStatus } from '../../domain/entities/StudySession.js'
import { FlashCard } from '../../domain/entities/FlashCard.js'

function makeCard(id) {
  return new FlashCard({ id, collectionId: 'col', frontText: 'Q', backText: 'A' })
}

function makeSession(cards = [makeCard('c1'), makeCard('c2')]) {
  return new StudySession({
    id: 'sess-1',
    collectionId: 'col-1',
    schedulerType: 'sm2',
    cards,
  })
}

describe('StudySession', () => {
  it('currentCard returns first card initially', () => {
    const session = makeSession()
    expect(session.currentCard.id).toBe('c1')
  })

  it('isFinished is false when cards remain', () => {
    expect(makeSession().isFinished).toBe(false)
  })

  it('isFinished is true when no cards', () => {
    expect(makeSession([]).isFinished).toBe(true)
  })

  it('progress starts at 0', () => {
    expect(makeSession().progress).toBe(0)
  })

  it('recordResult advances currentIndex', () => {
    const session = makeSession()
    const updated = session.recordResult('c1', 3, makeCard('c1'), 10)
    expect(updated.currentCard.id).toBe('c2')
    expect(updated.currentIndex).toBe(1)
  })

  it('session completes after last card', () => {
    const session = makeSession([makeCard('c1')])
    const updated = session.recordResult('c1', 3, makeCard('c1'), 10)
    expect(updated.isFinished).toBe(true)
    expect(updated.status).toBe(SessionStatus.COMPLETED)
    expect(updated.completedAt).not.toBeNull()
  })

  it('getSummary counts ratings correctly', () => {
    let session = makeSession([makeCard('c1'), makeCard('c2'), makeCard('c3'), makeCard('c4')])
    session = session.recordResult('c1', 0, makeCard('c1'), -10)
    session = session.recordResult('c2', 1, makeCard('c2'), -3)
    session = session.recordResult('c3', 2, makeCard('c3'), 5)
    session = session.recordResult('c4', 3, makeCard('c4'), 12)
    const summary = session.getSummary()
    expect(summary.forgotten).toBe(1)
    expect(summary.hard).toBe(1)
    expect(summary.good).toBe(1)
    expect(summary.perfect).toBe(1)
    expect(summary.totalEloChange).toBe(4)
  })
})
