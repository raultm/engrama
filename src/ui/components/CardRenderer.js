import { BasicCardStrategy } from '../card-strategies/BasicCardStrategy.js'
import { ClozeCardStrategy } from '../card-strategies/ClozeCardStrategy.js'
import { ImageOcclusionCardStrategy } from '../card-strategies/ImageOcclusionCardStrategy.js'
import { TsumegoCardStrategy } from '../card-strategies/TsumegoCardStrategy.js'
import { escapeHtml } from '../utils/html.js'

const REGISTRY = {
  basic:            new BasicCardStrategy(),
  cloze:            new ClozeCardStrategy(),
  image_occlusion:  new ImageOcclusionCardStrategy(),
  tsumego:          new TsumegoCardStrategy(),
}

export function getStrategy(cardType) {
  return REGISTRY[cardType] ?? REGISTRY.basic
}

export async function fillCardContent(card, { questionEl, tagsEl, onReveal }) {
  const strategy = getStrategy(card.cardType)

  const labelEl = questionEl.closest('.flashcard__front')?.querySelector('.flashcard__label')
  if (labelEl) labelEl.textContent = strategy.getLabels().question

  const flashcard = questionEl.closest('.flashcard')
  if (flashcard) flashcard.dataset.cardType = card.cardType

  questionEl.innerHTML = await strategy.renderQuestion(card)

  // Hook post-render: permite a estrategias interactivas (ej: tsumego) añadir
  // event listeners tras insertar el HTML en el DOM.
  strategy.postRender(card, questionEl, onReveal)

  if (tagsEl) {
    tagsEl.innerHTML = card.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')
  }
}

export async function fillAnswerContent(card, { questionEl }) {
  const strategy = getStrategy(card.cardType)

  const labelEl = questionEl.closest('.flashcard__front')?.querySelector('.flashcard__label')
  if (labelEl) labelEl.textContent = strategy.getLabels().answer

  questionEl.innerHTML = await strategy.renderAnswer(card)

  // Hook opcional: permite a estrategias con estado (ej: tsumego) re-enganchar
  // listeners al DOM tras el reemplazo de innerHTML.
  strategy.postReveal?.(card, questionEl)
}
