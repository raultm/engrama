import { BasicCardStrategy } from '../card-strategies/BasicCardStrategy.js'
import { ClozeCardStrategy } from '../card-strategies/ClozeCardStrategy.js'
import { ImageOcclusionCardStrategy } from '../card-strategies/ImageOcclusionCardStrategy.js'

const REGISTRY = {
  basic:            new BasicCardStrategy(),
  cloze:            new ClozeCardStrategy(),
  image_occlusion:  new ImageOcclusionCardStrategy(),
}

export function getStrategy(cardType) {
  return REGISTRY[cardType] ?? REGISTRY.basic
}

export async function fillCardContent(card, { questionEl, tagsEl }) {
  const strategy = getStrategy(card.cardType)

  const labelEl = questionEl.closest('.flashcard__front')?.querySelector('.flashcard__label')
  if (labelEl) labelEl.textContent = strategy.getLabels().question

  const flashcard = questionEl.closest('.flashcard')
  if (flashcard) flashcard.dataset.cardType = card.cardType

  questionEl.innerHTML = await strategy.renderQuestion(card)

  if (tagsEl) {
    tagsEl.innerHTML = card.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')
  }
}

export async function fillAnswerContent(card, { questionEl }) {
  const strategy = getStrategy(card.cardType)

  const labelEl = questionEl.closest('.flashcard__front')?.querySelector('.flashcard__label')
  if (labelEl) labelEl.textContent = strategy.getLabels().answer

  questionEl.innerHTML = await strategy.renderAnswer(card)
}


function escapeHtml(str) {
  const d = document.createElement('div')
  d.textContent = str ?? ''
  return d.innerHTML
}
