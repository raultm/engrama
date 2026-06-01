import { CardStrategy } from './CardStrategy.js'

export class BasicCardStrategy extends CardStrategy {
  async renderQuestion(card) {
    return escapeHtml(card.frontText)
  }

  async renderAnswer(card) {
    return `<div class="basic-answer__question">${escapeHtml(card.frontText)}</div>
            <div class="flashcard__divider"></div>
            <div class="basic-answer__back">${escapeHtml(card.backText)}</div>`
  }
}

function escapeHtml(str) {
  const d = document.createElement('div')
  d.textContent = str ?? ''
  return d.innerHTML
}
