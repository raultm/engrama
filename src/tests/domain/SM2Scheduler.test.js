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

    it('easiness increases on perfect (3) answer', () => {
      const card = makeCard('c1', { easiness: 2.0 })
      const { schedulerData } = scheduler.processAnswer(card, 3)
      expect(schedulerData.easiness).toBeGreaterThan(2.0)
    })

    it('hard (1) no re-encola pero sí reinicia el intervalo', () => {
      const card = makeCard('c1', { easiness: 2.5, interval: 10, repetitions: 5 })
      const { schedulerData } = scheduler.processAnswer(card, 1)
      expect(schedulerData.repetitions).toBe(0)
      expect(schedulerData.interval).toBe(1)
    })
  })

  describe('selectCards — límites de sesión', () => {
    it('limita la sesión a 10 tarjetas aunque haya más pendientes', () => {
      const cards = Array.from({ length: 15 }, (_, i) => makeCard(`c${i}`))
      expect(scheduler.selectCards(cards)).toHaveLength(10)
    })

    it('devuelve 0 tarjetas cuando todas están bloqueadas', () => {
      const cards = [makeCard('c1', {}, false), makeCard('c2', {}, false)]
      expect(scheduler.selectCards(cards)).toHaveLength(0)
    })

    it('sitúa los repasos antes que las tarjetas nuevas', () => {
      const future = new Date(Date.now() - 1000).toISOString() // pasado
      const review = makeCard('review', { nextReview: future, repetitions: 3 })
      const newCard = makeCard('new')
      const selected = scheduler.selectCards([newCard, review])
      expect(selected[0].id).toBe('review')
    })
  })

  // ── Intervalos adaptativos con fecha límite ───────────────────────────────

  describe('processAnswer — intervalos Olvidada/Difícil con fecha límite', () => {
    const card = makeCard('c1')
    const now  = new Date('2024-06-01T10:00:00Z')

    function deadlineIn(hours) {
      return now.getTime() + hours * 3_600_000
    }

    function hoursUntil(nextReview) {
      return (new Date(nextReview) - now) / 3_600_000
    }

    // ── Sin fecha límite: valores fijos ───────────────────────────────────

    it('Olvidada sin fecha límite → 4 horas exactas', () => {
      const { schedulerData } = scheduler.processAnswer(card, 0, now, null)
      expect(hoursUntil(schedulerData.nextReview)).toBeCloseTo(4)
    })

    it('Difícil sin fecha límite → 8 horas exactas', () => {
      const { schedulerData } = scheduler.processAnswer(card, 1, now, null)
      expect(hoursUntil(schedulerData.nextReview)).toBeCloseTo(8)
    })

    // ── Con fecha límite lejana: techo máximo activo ──────────────────────

    it('Olvidada con plazo lejano (30 días) → techo de 4 h', () => {
      const { schedulerData } = scheduler.processAnswer(card, 0, now, deadlineIn(720))
      expect(hoursUntil(schedulerData.nextReview)).toBeCloseTo(4)
    })

    it('Difícil con plazo lejano (30 días) → techo de 12 h', () => {
      const { schedulerData } = scheduler.processAnswer(card, 1, now, deadlineIn(720))
      expect(hoursUntil(schedulerData.nextReview)).toBeCloseTo(12)
    })

    // ── Con fecha límite próxima: intervalo se comprime ───────────────────

    it('Olvidada con plazo de 1 día → intervalo < 4 h', () => {
      const { schedulerData } = scheduler.processAnswer(card, 0, now, deadlineIn(24))
      const h = hoursUntil(schedulerData.nextReview)
      expect(h).toBeLessThan(4)
      expect(h).toBeGreaterThan(0)
    })

    it('Difícil con plazo de 1 día → intervalo < 12 h y < plazo total', () => {
      const { schedulerData } = scheduler.processAnswer(card, 1, now, deadlineIn(24))
      const h = hoursUntil(schedulerData.nextReview)
      expect(h).toBeLessThan(12)
      expect(h).toBeGreaterThan(0)
    })

    it('Olvidada con 3 días de plazo → escalada proporcional (< techo)', () => {
      // 72h / 20 = 3.6h < 4h → usa valor escalado
      const { schedulerData } = scheduler.processAnswer(card, 0, now, deadlineIn(72))
      expect(hoursUntil(schedulerData.nextReview)).toBeCloseTo(3.6, 1)
    })

    // ── Techo mínimo ──────────────────────────────────────────────────────

    it('Olvidada con plazo muy corto → mínimo 30 minutos', () => {
      const { schedulerData } = scheduler.processAnswer(card, 0, now, deadlineIn(1))
      expect(hoursUntil(schedulerData.nextReview)).toBeGreaterThanOrEqual(0.5)
    })

    // ── Buena/Perfecta no afectadas por el deadline ───────────────────────

    it('Buena con fecha límite → sigue usando días, no pocas horas (SM2 normal)', () => {
      const { schedulerData } = scheduler.processAnswer(card, 2, now, deadlineIn(72))
      // nextReview es al día siguiente a medianoche — siempre más de 10h desde las 10:00 UTC
      const h = hoursUntil(schedulerData.nextReview)
      expect(h).toBeGreaterThan(10)
    })

    it('Perfecta con fecha límite → sigue usando días, no pocas horas (SM2 normal)', () => {
      const { schedulerData } = scheduler.processAnswer(card, 3, now, deadlineIn(72))
      const h = hoursUntil(schedulerData.nextReview)
      expect(h).toBeGreaterThan(10)
    })
  })

  // ── Normalización a medianoche ────────────────────────────────────────────

  describe('processAnswer — normalización a medianoche para Buena/Perfecta', () => {
    it('Buena programa la revisión a las 00:00 del día siguiente', () => {
      const now = new Date('2024-06-01T14:30:00')
      const card = makeCard('c1')
      const { schedulerData } = scheduler.processAnswer(card, 2, now)
      const next = new Date(schedulerData.nextReview)
      expect(next.getHours()).toBe(0)
      expect(next.getMinutes()).toBe(0)
      expect(next.getSeconds()).toBe(0)
    })

    it('Olvidada NO normaliza a medianoche (es intra-día)', () => {
      const now = new Date('2024-06-01T10:00:00')
      const card = makeCard('c1')
      const { schedulerData } = scheduler.processAnswer(card, 0, now)
      // Debe ser ~14:00, no medianoche
      const next = new Date(schedulerData.nextReview)
      expect(next.getHours()).toBeGreaterThan(0)
    })
  })
})
