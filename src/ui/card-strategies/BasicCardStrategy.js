import { CardStrategy } from './CardStrategy.js'
import { ImageStore } from '../../infrastructure/db/ImageStore.js'

export class BasicCardStrategy extends CardStrategy {
  async renderQuestion(card) {
    return _render(await _resolveImages(card.frontText))
  }

  async renderAnswer(card) {
    const [q, a] = await Promise.all([
      _resolveImages(card.frontText),
      _resolveImages(card.backText),
    ])
    return `<div class="basic-answer__question">${_render(q)}</div>
            <div class="flashcard__divider"></div>
            <div class="basic-answer__back">${_render(a)}</div>`
  }
}

// Sustituye <img data-anki-src="key"> por la data URL real desde IndexedDB.
async function _resolveImages(text) {
  const t = text ?? ''
  if (!t.includes('data-anki-src')) return t

  // Recopilar claves únicas
  const keys = new Set()
  for (const [, key] of t.matchAll(/data-anki-src="([^"]+)"/g)) keys.add(key)

  // Resolver todas en paralelo
  const resolved = Object.fromEntries(
    await Promise.all([...keys].map(async k => [k, await ImageStore.get(k)]))
  )

  return t.replace(/<img[^>]+data-anki-src="([^"]+)"[^>]*>/g, (_, key) =>
    resolved[key] ? `<img src="${resolved[key]}">` : ''
  )
}

// Si el texto contiene HTML (imágenes de Anki ya resueltas o <br>), usar innerHTML.
// Si es texto plano, escaparlo para prevenir XSS.
function _render(text) {
  const t = text ?? ''
  return /<img\b|<br\b/i.test(t) ? t : escapeHtml(t)
}

function escapeHtml(str) {
  const d = document.createElement('div')
  d.textContent = str ?? ''
  return d.innerHTML
}
