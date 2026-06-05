import { describe, it, expect } from 'vitest'
import { MarkdownSeedParser } from '../../application/services/MarkdownSeedParser.js'

const parser = new MarkdownSeedParser()

const BASIC_MD = `---
name: Test Deck
description: Mazo de prueba
schedulerType: sm2
---

## ¿Cuál es la capital de Francia?
París
<!-- tags:geo elo:1300 -->

## Fórmula del agua
H2O
<!-- elo:1200 -->
`

const TSUMEGO_MD = `---
name: Tsumego Test
description: Pruebas de tsumego
schedulerType: sm2
---

## Captura la piedra

\`\`\`sgf
(;FF[4]GM[1]SZ[9]PL[B]AB[bc][dc][cb]AW[cc]
(;B[cd]C[Correct!])
(;B[bb]C[Wrong!]))
\`\`\`

<!-- cardType:tsumego elo:1500 tags:go,tsumego -->
`

// ── Colección y metadatos ─────────────────────────────────────────────────────

describe('MarkdownSeedParser — colección', () => {
  it('extrae nombre, descripción y schedulerType del frontmatter', () => {
    const result = parser.parse(BASIC_MD)
    const col = result.collections[0]
    expect(col.name).toBe('Test Deck')
    expect(col.description).toBe('Mazo de prueba')
    expect(col.schedulerType).toBe('sm2')
  })

  it('genera un id basado en el nombre del mazo', () => {
    const result = parser.parse(BASIC_MD)
    expect(result.collections[0].id).toBe('seed-test-deck')
  })

  it('parsea sin frontmatter (no lanza)', () => {
    const result = parser.parse('## Pregunta\nRespuesta')
    expect(result.collections[0].flashCards.length).toBeGreaterThan(0)
  })
})

// ── Tarjetas básicas ──────────────────────────────────────────────────────────

describe('MarkdownSeedParser — tarjetas básicas', () => {
  it('genera dos tarjetas a partir del markdown', () => {
    const { collections: [col] } = parser.parse(BASIC_MD)
    expect(col.flashCards).toHaveLength(2)
  })

  it('el frontText es el título del encabezado', () => {
    const { collections: [col] } = parser.parse(BASIC_MD)
    expect(col.flashCards[0].frontText).toBe('¿Cuál es la capital de Francia?')
  })

  it('lee el elo de los metadatos del comentario HTML', () => {
    const { collections: [col] } = parser.parse(BASIC_MD)
    expect(col.flashCards[0].eloDifficulty).toBe(1300)
    expect(col.flashCards[1].eloDifficulty).toBe(1200)
  })

  it('lee los tags separados por coma', () => {
    const { collections: [col] } = parser.parse(BASIC_MD)
    expect(col.flashCards[0].tags).toContain('geo')
  })

  it('usa elo 1500 por defecto si no se especifica', () => {
    const md = `---\nname: X\n---\n\n## Pregunta\nRespuesta\n`
    const { collections: [col] } = parser.parse(md)
    expect(col.flashCards[0].eloDifficulty).toBe(1500)
  })
})

// ── Tarjetas tsumego ──────────────────────────────────────────────────────────

describe('MarkdownSeedParser — tarjetas tsumego', () => {
  it('genera una tarjeta de tipo tsumego', () => {
    const { collections: [col] } = parser.parse(TSUMEGO_MD)
    expect(col.flashCards).toHaveLength(1)
    expect(col.flashCards[0].cardType).toBe('tsumego')
  })

  it('el extraData contiene boardSize, blackStones, whiteStones y sgf', () => {
    const { collections: [col] } = parser.parse(TSUMEGO_MD)
    const card = col.flashCards[0]
    expect(card.extraData.boardSize).toBe(9)
    expect(card.extraData.blackStones).toContain('bc')
    expect(card.extraData.whiteStones).toContain('cc')
    expect(card.extraData.sgf).toBeTruthy()
  })

  it('el extraData ya no incluye correctMoves (fue eliminado)', () => {
    const { collections: [col] } = parser.parse(TSUMEGO_MD)
    expect(col.flashCards[0].extraData.correctMoves).toBeUndefined()
  })

  it('el frontText usa el título del bloque', () => {
    const { collections: [col] } = parser.parse(TSUMEGO_MD)
    expect(col.flashCards[0].frontText).toBe('Captura la piedra')
  })

  it('playerToMove se infiere correctamente de PL[B]', () => {
    const { collections: [col] } = parser.parse(TSUMEGO_MD)
    expect(col.flashCards[0].extraData.playerToMove).toBe('B')
  })
})
