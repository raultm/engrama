import { describe, it, expect } from 'vitest'
import { EloSystem } from '../../domain/elo/EloSystem.js'

describe('EloSystem', () => {
  const elo = new EloSystem()

  it('user gains ELO on perfect answer', () => {
    const { userDelta } = elo.calculateChange(1500, 1500, 3)
    expect(userDelta).toBeGreaterThan(0)
  })

  it('user loses ELO on forgotten answer', () => {
    const { userDelta } = elo.calculateChange(1500, 1500, 0)
    expect(userDelta).toBeLessThan(0)
  })

  it('card gains ELO when user forgets it', () => {
    const { cardDelta } = elo.calculateChange(1500, 1500, 0)
    expect(cardDelta).toBeGreaterThan(0)
  })

  it('card loses ELO when user answers perfectly', () => {
    const { cardDelta } = elo.calculateChange(1500, 1500, 3)
    expect(cardDelta).toBeLessThan(0)
  })

  it('beating a hard card (higher ELO) gives more user ELO', () => {
    const { userDelta: easyWin } = elo.calculateChange(1500, 1000, 3)
    const { userDelta: hardWin } = elo.calculateChange(1500, 2000, 3)
    expect(hardWin).toBeGreaterThan(easyWin)
  })

  it('forgetting easy card (lower ELO) loses more user ELO', () => {
    const { userDelta: easyLoss } = elo.calculateChange(1500, 1000, 0)
    const { userDelta: hardLoss } = elo.calculateChange(1500, 2000, 0)
    expect(Math.abs(easyLoss)).toBeGreaterThan(Math.abs(hardLoss))
  })

  it('new ELOs are never below 100', () => {
    const { newUserElo, newCardElo } = elo.calculateChange(101, 3000, 0)
    expect(newUserElo).toBeGreaterThanOrEqual(100)
  })

  it('hard answer (1) gives partial ELO gain', () => {
    const { userDelta: hardDelta } = elo.calculateChange(1500, 1500, 1)
    const { userDelta: perfectDelta } = elo.calculateChange(1500, 1500, 3)
    expect(hardDelta).toBeLessThan(perfectDelta)
  })
})
