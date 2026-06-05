import { CardStrategy } from './CardStrategy.js'
import { ImageStore } from '../../infrastructure/db/ImageStore.js'
import { escapeHtml } from '../utils/html.js'

export class ImageOcclusionCardStrategy extends CardStrategy {
  async renderQuestion(card) {
    const { imageId, masks = [], activeMaskId, header } = card.extraData
    const dataUrl = await ImageStore.get(imageId)
    if (!dataUrl) return '<p class="occlusion-error">Imagen no disponible</p>'

    const headerHtml = header ? `<p class="occlusion-header">${escapeHtml(header)}</p>` : ''
    const svgShapes  = masks.map(mask => shapeToSvg(mask, mask.id === activeMaskId, false)).join('')

    return `${headerHtml}<div class="occlusion-container"><img src="${dataUrl}" class="occlusion-image" alt="" draggable="false"><svg class="occlusion-svg-overlay" viewBox="0 0 1 1" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">${svgShapes}</svg></div>`
  }

  async renderAnswer(card) {
    const { imageId, masks = [], activeMaskId, header } = card.extraData
    const dataUrl = await ImageStore.get(imageId)
    if (!dataUrl) return '<p class="occlusion-error">Imagen no disponible</p>'

    const headerHtml = header ? `<p class="occlusion-header">${escapeHtml(header)}</p>` : ''
    const svgShapes  = masks.map(mask => shapeToSvg(mask, false, mask.id === activeMaskId)).join('')

    const label    = card.backText || masks.find(m => m.id === activeMaskId)?.label || ''
    const labelHtml = label ? `<p class="occlusion-answer-label">${escapeHtml(label)}</p>` : ''

    return `${headerHtml}<div class="occlusion-container"><img src="${dataUrl}" class="occlusion-image" alt="" draggable="false"><svg class="occlusion-svg-overlay" viewBox="0 0 1 1" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">${svgShapes}</svg></div>${labelHtml}`
  }

  getLabels() { return { question: 'Imagen', answer: 'Imagen' } }
}

// ── SVG shape renderer ─────────────────────────────────────────────────────

const FILL_DEFAULT  = '#2d3748'
const FILL_ACTIVE   = '#2563eb'
const STROKE_DEFAULT = '#4a5568'
const STROKE_ACTIVE  = '#60a5fa'
const STROKE_REVEALED = 'rgba(96,165,250,0.7)'
const SW = '0.003'  // stroke-width en coordenadas normalizadas (~1.7px a 600px)

function shapeToSvg(mask, isActive, isRevealed) {
  const fill   = isRevealed ? 'none' : (isActive ? FILL_ACTIVE : FILL_DEFAULT)
  const stroke = isRevealed ? STROKE_REVEALED : (isActive ? STROKE_ACTIVE : STROKE_DEFAULT)

  if (mask.type === 'polygon' && mask.points?.length) {
    const pts = mask.points.map(([px, py]) => `${px},${py}`).join(' ')
    return `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${SW}"/>`
  }
  if (mask.type === 'ellipse') {
    const cx = mask.x + mask.w / 2
    const cy = mask.y + mask.h / 2
    return `<ellipse cx="${cx}" cy="${cy}" rx="${mask.w / 2}" ry="${mask.h / 2}" fill="${fill}" stroke="${stroke}" stroke-width="${SW}"/>`
  }
  // rect (default)
  return `<rect x="${mask.x}" y="${mask.y}" width="${mask.w}" height="${mask.h}" fill="${fill}" stroke="${stroke}" stroke-width="${SW}"/>`
}
