import { describe, it, expect } from 'vitest'
import { StudySession, SessionStatus } from '../../domain/entities/StudySession.js'
import { FlashCard } from '../../domain/entities/FlashCard.js'

function makeCard(id) {
  return new FlashCard({ id, collectionId: 'col', frontText: 'Q', backText: 'A' })
}

function makeSession(cards = [makeCard('c1'), makeCard('c2')]) {
  return new StudySession({ id: 'sess-1', collectionId: 'col-1', schedulerType: 'sm2', cards })
}

// ── Estado básico ─────────────────────────────────────────────────────────

describe('StudySession — estado básico', () => {
  it('currentCard devuelve la primera tarjeta de la cola', () => {
    expect(makeSession().currentCard.id).toBe('c1')
  })

  it('isFinished es false cuando quedan tarjetas', () => {
    expect(makeSession().isFinished).toBe(false)
  })

  it('isFinished es true con cola vacía', () => {
    expect(makeSession([]).isFinished).toBe(true)
  })

  it('progress empieza en 0', () => {
    expect(makeSession().progress).toBe(0)
  })
})

// ── Progress y doneCount ──────────────────────────────────────────────────

describe('StudySession — progress y doneCount', () => {
  it('progress avanza al masterizar una tarjeta (rating ≥ 2)', () => {
    const s = makeSession([makeCard('c1'), makeCard('c2')])
    const updated = s.recordResult('c1', 3, makeCard('c1'), 10)
    expect(updated.progress).toBeCloseTo(0.5)
  })

  it('progress avanza cuando se agotan los reintentos de una tarjeta olvidada', () => {
    // MAX_REQUEUE = 2: c1 puede re-encolarse como máximo 2 veces.
    // Hay que conducir la cola en orden real para que el test sea correcto.
    const cards = [makeCard('c1'), makeCard('c2'), makeCard('c3'), makeCard('c4')]
    let s = makeSession(cards)

    s = s.recordResult('c1', 0, makeCard('c1'), -10) // falla 1ª → re-encola
    expect(s.doneCount).toBe(0)

    s = s.recordResult('c2', 3, makeCard('c2'),  10) // c2 pasa
    s = s.recordResult('c3', 3, makeCard('c3'),  10) // c3 pasa

    s = s.recordResult('c1', 0, makeCard('c1'), -10) // falla 2ª → re-encola

    s = s.recordResult('c4', 3, makeCard('c4'),  10) // c4 pasa

    // 3ª falla de c1: requeueCount ya es 2 (= MAX_REQUEUE) → ya NO se re-encola
    s = s.recordResult('c1', 0, makeCard('c1'), -10)
    expect(s.doneCount).toBe(4)   // todas las tarjetas procesadas
    expect(s.isFinished).toBe(true)
    expect(s.progress).toBe(1)
  })

  it('masteredCount solo cuenta tarjetas con rating ≥ 2', () => {
    let s = makeSession([makeCard('c1'), makeCard('c2'), makeCard('c3')])
    s = s.recordResult('c1', 0, makeCard('c1'), -10) // olvidada
    s = s.recordResult('c2', 1, makeCard('c2'),  -3) // difícil
    s = s.recordResult('c3', 3, makeCard('c3'),  12) // perfecta
    expect(s.masteredCount).toBe(1) // solo c3
  })

  it('masteredCount de-duplica si la misma tarjeta se contesta varias veces', () => {
    const cards = [makeCard('c1'), makeCard('c2'), makeCard('c3')]
    let s = makeSession(cards)
    s = s.recordResult('c1', 0, makeCard('c1'), -10) // falla → re-encola
    s = s.recordResult('c2', 3, makeCard('c2'),  10)
    s = s.recordResult('c1', 3, makeCard('c1'),   8) // la misma tarjeta, bien al segundo intento
    expect(s.masteredCount).toBe(2) // c1 y c2, no 3
  })

  it('progress llega a 1 cuando la sesión termina', () => {
    const cards = [makeCard('c1'), makeCard('c2')]
    let s = makeSession(cards)
    s = s.recordResult('c1', 3, makeCard('c1'), 10)
    s = s.recordResult('c2', 3, makeCard('c2'), 10)
    expect(s.progress).toBe(1)
    expect(s.isFinished).toBe(true)
  })
})

// ── Lógica de re-encola ───────────────────────────────────────────────────

describe('StudySession — re-encola', () => {
  it('re-encola tras rating 0 cuando hay reintentos disponibles', () => {
    const cards = [makeCard('c1'), makeCard('c2'), makeCard('c3')]
    const s = makeSession(cards)
    const updated = s.recordResult('c1', 0, makeCard('c1'), -10)
    // c1 debería volver a aparecer pronto en la cola
    expect(updated.queue.some(c => c.id === 'c1')).toBe(true)
  })

  it('NO re-encola cuando rating ≥ 2', () => {
    const s = makeSession()
    const updated = s.recordResult('c1', 2, makeCard('c1'), 5)
    expect(updated.queue.some(c => c.id === 'c1')).toBe(false)
  })

  it('inserta la re-encolada cerca del frente (posición ≤ 2)', () => {
    const cards = [makeCard('c1'), makeCard('c2'), makeCard('c3'), makeCard('c4'), makeCard('c5')]
    const s = makeSession(cards)
    const updated = s.recordResult('c1', 0, makeCard('c1'), -10)
    // c1 debe estar en posición 0, 1 o 2 de la nueva cola
    const pos = updated.queue.findIndex(c => c.id === 'c1')
    expect(pos).toBeGreaterThanOrEqual(0)
    expect(pos).toBeLessThanOrEqual(2)
  })

  it('re-encola la última tarjeta si falla y aún hay reintentos (la sesión no termina)', () => {
    const s = makeSession([makeCard('c1')])
    const updated = s.recordResult('c1', 0, makeCard('c1'), -10)
    expect(updated.isFinished).toBe(false)
    expect(updated.queue.some(c => c.id === 'c1')).toBe(true)
  })

  it('termina la sesión si la última tarjeta falla tras agotar los reintentos', () => {
    let s = makeSession([makeCard('c1')])
    s = s.recordResult('c1', 0, makeCard('c1'), -10) // re-encola (1/2)
    s = s.recordResult('c1', 0, makeCard('c1'), -10) // re-encola (2/2)
    s = s.recordResult('c1', 0, makeCard('c1'), -10) // reintentos agotados
    expect(s.isFinished).toBe(true)
  })
})

// ── Silenciar tarjeta ─────────────────────────────────────────────────────

describe('StudySession — muteCurrentCard', () => {
  it('quita la tarjeta actual de la cola y del total, sin registrar resultado', () => {
    const cards = [makeCard('c1'), makeCard('c2'), makeCard('c3')]
    const s = makeSession(cards)
    const updated = s.muteCurrentCard()
    expect(updated.queue.some(c => c.id === 'c1')).toBe(false)
    expect(updated.cards.some(c => c.id === 'c1')).toBe(false)
    expect(updated.cards.length).toBe(2)
    expect(updated.results).toEqual([])
  })

  it('termina la sesión si la tarjeta silenciada era la última', () => {
    const s = makeSession([makeCard('c1')])
    const updated = s.muteCurrentCard()
    expect(updated.isFinished).toBe(true)
    expect(updated.status).toBe(SessionStatus.COMPLETED)
  })

  it('no hace nada si no hay tarjeta actual', () => {
    const s = makeSession([])
    const updated = s.muteCurrentCard()
    expect(updated).toBe(s)
  })
})

// ── Completado y resumen ──────────────────────────────────────────────────

describe('StudySession — completado y resumen', () => {
  it('transiciona a COMPLETED al procesar la última tarjeta', () => {
    const s = makeSession([makeCard('c1')])
    const updated = s.recordResult('c1', 3, makeCard('c1'), 10)
    expect(updated.status).toBe(SessionStatus.COMPLETED)
    expect(updated.completedAt).not.toBeNull()
  })

  it('getSummary cuenta cada calificación correctamente', () => {
    let s = makeSession([makeCard('c1'), makeCard('c2'), makeCard('c3'), makeCard('c4')])
    s = s.recordResult('c1', 0, makeCard('c1'), -10)
    s = s.recordResult('c2', 1, makeCard('c2'),  -3)
    s = s.recordResult('c3', 2, makeCard('c3'),   5)
    s = s.recordResult('c4', 3, makeCard('c4'),  12)
    const sum = s.getSummary()
    expect(sum.forgotten).toBe(1)
    expect(sum.hard).toBe(1)
    expect(sum.good).toBe(1)
    expect(sum.perfect).toBe(1)
    expect(sum.totalEloChange).toBe(4)
  })
})
