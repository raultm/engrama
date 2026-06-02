// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { BasicCardStrategy } from '../../ui/card-strategies/BasicCardStrategy.js'
import { ClozeCardStrategy } from '../../ui/card-strategies/ClozeCardStrategy.js'

function card(overrides = {}) {
  return {
    frontText: 'Pregunta de prueba',
    backText:  'Respuesta de prueba',
    cardType:  'basic',
    extraData: {},
    tags:      [],
    ...overrides,
  }
}

// ── BasicCardStrategy ─────────────────────────────────────────────────────

describe('BasicCardStrategy', () => {
  const strategy = new BasicCardStrategy()

  it('renderQuestion devuelve el frontText escapado', async () => {
    const html = await strategy.renderQuestion(card({ frontText: 'Hola mundo' }))
    expect(html).toContain('Hola mundo')
  })

  it('renderQuestion escapa HTML para prevenir XSS', async () => {
    const html = await strategy.renderQuestion(card({ frontText: '<script>alert(1)</script>' }))
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('renderAnswer contiene tanto la pregunta como la respuesta', async () => {
    const html = await strategy.renderAnswer(card({
      frontText: 'La pregunta',
      backText:  'La respuesta',
    }))
    expect(html).toContain('La pregunta')
    expect(html).toContain('La respuesta')
  })

  it('renderAnswer incluye un separador visual entre pregunta y respuesta', async () => {
    const html = await strategy.renderAnswer(card())
    expect(html).toContain('flashcard__divider')
  })

  it('getLabels devuelve Pregunta / Respuesta', () => {
    expect(strategy.getLabels()).toEqual({ question: 'Pregunta', answer: 'Respuesta' })
  })
})

// ── ClozeCardStrategy ─────────────────────────────────────────────────────

describe('ClozeCardStrategy', () => {
  const strategy = new ClozeCardStrategy()

  function clozeCard(text, clozeIndex = 1) {
    return card({ frontText: text, backText: '', cardType: 'cloze', extraData: { clozeIndex } })
  }

  it('renderQuestion oculta el grupo activo con [...]', async () => {
    const c = clozeCard('La capital de {{c1::Francia}} es París.')
    const html = await strategy.renderQuestion(c)
    expect(html).toContain('[...]')
    expect(html).not.toContain('Francia')
  })

  it('renderQuestion muestra los demás grupos sin ocultar', async () => {
    const c = clozeCard('{{c1::Madrid}} es capital de {{c2::España}}.', 1)
    const html = await strategy.renderQuestion(c)
    expect(html).toContain('[...]')    // c1 oculto
    expect(html).toContain('España')  // c2 visible
  })

  it('renderAnswer revela el grupo activo con clase cloze-answer', async () => {
    const c = clozeCard('La capital de {{c1::Francia}} es París.')
    const html = await strategy.renderAnswer(c)
    expect(html).toContain('cloze-answer')
    expect(html).toContain('Francia')
    expect(html).not.toContain('[...]')
  })

  it('usa el hint cuando se proporciona', async () => {
    const c = clozeCard('La capital de {{c1::Francia::país europeo}} es París.')
    const html = await strategy.renderQuestion(c)
    expect(html).toContain('país europeo')
  })

  it('maneja múltiples grupos cloze correctamente', async () => {
    const text = '{{c1::Madrid}} es la capital de {{c2::España}} en {{c3::Europa}}.'
    const c1 = clozeCard(text, 1)
    const c2 = clozeCard(text, 2)

    const html1 = await strategy.renderQuestion(c1)
    expect(html1).toContain('[...]')   // c1 oculto
    expect(html1).toContain('España') // c2 visible
    expect(html1).toContain('Europa') // c3 visible

    const html2 = await strategy.renderQuestion(c2)
    expect(html2).toContain('Madrid') // c1 visible
    expect(html2).toContain('[...]')   // c2 oculto
    expect(html2).toContain('Europa') // c3 visible
  })

  it('convierte saltos de línea en <br>', async () => {
    const c = clozeCard('Línea uno\nLínea dos con {{c1::hueco}}.')
    const html = await strategy.renderQuestion(c)
    expect(html).toContain('<br>')
  })

  it('escapa HTML en el texto de contexto', async () => {
    const c = clozeCard('<b>Texto</b> con {{c1::hueco}}.')
    const html = await strategy.renderQuestion(c)
    expect(html).not.toContain('<b>')
    expect(html).toContain('&lt;b&gt;')
  })

  it('getLabels devuelve Completar / Respuesta', () => {
    expect(strategy.getLabels()).toEqual({ question: 'Completar', answer: 'Respuesta' })
  })
})
