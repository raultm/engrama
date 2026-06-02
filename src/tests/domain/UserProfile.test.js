import { describe, it, expect } from 'vitest'
import { UserProfile } from '../../domain/entities/UserProfile.js'

// ELO 1500 es el punto de inicio: banda Estudiante (1400–1599)
const defaults = { id: 1, eloRating: 1500 }

describe('UserProfile.getLevelProgress()', () => {
  it('retorna progreso dentro de la banda Curioso para ELO < 1000', () => {
    // Curioso: 0–999, banda de 1000 puntos. ELO 800 → 80%
    const p = new UserProfile({ ...defaults, eloRating: 800 })
    expect(p.getLevelProgress()).toBeCloseTo(0.8)
  })

  it('retorna progreso correcto dentro de la banda Estudiante (1400–1600)', () => {
    const p = new UserProfile({ ...defaults, eloRating: 1500 })
    // 1500 está a (1500-1400)/(1600-1400) = 100/200 = 0.5 de camino hacia Practicante
    expect(p.getLevelProgress()).toBeCloseTo(0.5)
  })

  it('retorna 0 al inicio exacto de un rango', () => {
    const p = new UserProfile({ ...defaults, eloRating: 1400 })
    expect(p.getLevelProgress()).toBe(0)
  })

  it('retorna 1.0 en el rango máximo (Gran Maestro ≥ 2400)', () => {
    const p = new UserProfile({ ...defaults, eloRating: 2500 })
    expect(p.getLevelProgress()).toBe(1)
  })

  it('no supera 1.0 aunque el ELO exceda el rango máximo', () => {
    const p = new UserProfile({ ...defaults, eloRating: 9999 })
    expect(p.getLevelProgress()).toBeLessThanOrEqual(1)
  })
})

describe('UserProfile.withElo()', () => {
  it('actualiza el ELO', () => {
    const p = new UserProfile(defaults).withElo(1700)
    expect(p.eloRating).toBe(1700)
  })

  it('clampea el ELO a un mínimo de 100', () => {
    const p = new UserProfile(defaults).withElo(-500)
    expect(p.eloRating).toBe(100)
  })

  it('preserva el resto de campos', () => {
    const original = new UserProfile({ ...defaults, totalCardsStudied: 42 })
    const updated = original.withElo(1600)
    expect(updated.totalCardsStudied).toBe(42)
    expect(updated.id).toBe(defaults.id)
  })

  it('devuelve una instancia nueva (inmutabilidad)', () => {
    const original = new UserProfile(defaults)
    const updated = original.withElo(1600)
    expect(updated).not.toBe(original)
    expect(original.eloRating).toBe(1500)
  })
})

describe('UserProfile.withSessionCompleted()', () => {
  it('incrementa totalCardsStudied y totalSessionsCompleted', () => {
    const p = new UserProfile({ ...defaults, totalCardsStudied: 10, totalSessionsCompleted: 2 })
    const updated = p.withSessionCompleted(10)
    expect(updated.totalCardsStudied).toBe(20)
    expect(updated.totalSessionsCompleted).toBe(3)
  })

  it('preserva el ELO', () => {
    const p = new UserProfile({ ...defaults, eloRating: 1650 })
    expect(p.withSessionCompleted(5).eloRating).toBe(1650)
  })
})
