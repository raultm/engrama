import { describe, it, expect } from 'vitest'
import { RANKS, getRank, getRankProgress } from '../../domain/ranks.js'

describe('getRank()', () => {
  it('ELO 1500 (inicio por defecto) → Estudiante', () => {
    expect(getRank(1500)).toBe('Estudiante')
  })

  it('retorna el rango correcto en cada umbral exacto', () => {
    const casos = [
      [2400, 'Gran Maestro'],
      [2200, 'Maestro'],
      [2000, 'Experto'],
      [1800, 'Conocedor'],
      [1600, 'Practicante'],
      [1400, 'Estudiante'],
      [1200, 'Aprendiz'],
      [1000, 'Novato'],
      [999,  'Curioso'],
      [0,    'Curioso'],
    ]
    for (const [elo, expected] of casos) {
      expect(getRank(elo), `ELO ${elo}`).toBe(expected)
    }
  })

  it('retorna Gran Maestro para ELO muy alto', () => {
    expect(getRank(9999)).toBe('Gran Maestro')
  })

  it('retorna Curioso para ELO muy bajo', () => {
    expect(getRank(1)).toBe('Curioso')
  })
})

describe('getRankProgress()', () => {
  it('retorna 0 al inicio exacto de cada rango (menos el máximo)', () => {
    const umbrales = RANKS.filter((_, i) => i > 0).map(r => r.min)
    for (const elo of umbrales) {
      expect(getRankProgress(elo), `ELO ${elo}`).toBeCloseTo(0)
    }
  })

  it('retorna ~0.5 en el punto medio de una banda', () => {
    // Banda Estudiante: 1400–1599, punto medio ≈ 1500
    expect(getRankProgress(1500)).toBeCloseTo(0.5)
  })

  it('retorna 1.0 en el rango máximo (Gran Maestro)', () => {
    expect(getRankProgress(2400)).toBe(1)
    expect(getRankProgress(3000)).toBe(1)
  })

  it('está siempre entre 0 y 1', () => {
    const elos = [0, 500, 1000, 1500, 2000, 2400, 9999]
    for (const elo of elos) {
      const p = getRankProgress(elo)
      expect(p, `ELO ${elo}`).toBeGreaterThanOrEqual(0)
      expect(p, `ELO ${elo}`).toBeLessThanOrEqual(1)
    }
  })
})
