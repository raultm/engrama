import { CardStrategy } from './CardStrategy.js'
import { escapeHtml } from '../utils/html.js'

export class ClozeCardStrategy extends CardStrategy {
  async renderQuestion(card) {
    return renderClozeHtml(card.frontText, card.extraData.clozeIndex ?? 1, false)
  }

  async renderAnswer(card) {
    return renderClozeHtml(card.frontText, card.extraData.clozeIndex ?? 1, true)
  }

  getLabels() { return { question: 'Completar', answer: 'Respuesta' } }
}

function renderClozeHtml(text, clozeIndex, revealed) {
  const parts = []
  let lastIndex = 0
  const regex = /\{\{c(\d+)::([\s\S]*?)(?:::([\s\S]*?))?\}\}/g
  let m

  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) parts.push(escapeHtml(text.slice(lastIndex, m.index)))

    const idx = parseInt(m[1])
    const answer = m[2]
    const hint = m[3]

    if (idx === clozeIndex) {
      if (revealed) {
        parts.push(`<span class="cloze-answer">${escapeHtml(answer)}</span>`)
      } else {
        const hintText = hint ? escapeHtml(hint) : '...'
        parts.push(`<span class="cloze-blank">[${hintText}]</span>`)
      }
    } else {
      parts.push(escapeHtml(answer))
    }

    lastIndex = m.index + m[0].length
  }

  if (lastIndex < text.length) parts.push(escapeHtml(text.slice(lastIndex)))

  return parts.join('').replace(/\n/g, '<br>')
}
