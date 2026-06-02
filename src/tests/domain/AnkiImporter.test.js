import { describe, it, expect } from 'vitest'
import {
  _parseNewIOField,
  _parseMediaProto,
  _eloFromTags,
  _isUnlockedFromTags,
} from '../../application/services/AnkiImporter.js'

// ── _eloFromTags ──────────────────────────────────────────────────────────

describe('_eloFromTags', () => {
  it('devuelve 1500 por defecto cuando no hay etiqueta elo', () => {
    expect(_eloFromTags([])).toBe(1500)
    expect(_eloFromTags(['ciencias', 'geografía'])).toBe(1500)
  })

  it('lee elo:XXXX', () => {
    expect(_eloFromTags(['elo:1700'])).toBe(1700)
  })

  it('lee elo=XXXX', () => {
    expect(_eloFromTags(['elo=1800'])).toBe(1800)
  })

  it('es insensible a mayúsculas', () => {
    expect(_eloFromTags(['ELO:1600'])).toBe(1600)
  })

  it('ignora etiquetas que no son exactamente elo:N', () => {
    expect(_eloFromTags(['noelo:1600', 'elo:1600extra'])).toBe(1500)
  })

  it('usa el primero que encuentre si hay varios', () => {
    expect(_eloFromTags(['elo:1600', 'elo:1800'])).toBe(1600)
  })
})

// ── _isUnlockedFromTags ───────────────────────────────────────────────────

describe('_isUnlockedFromTags', () => {
  it('devuelve true (desbloqueada) por defecto', () => {
    expect(_isUnlockedFromTags([])).toBe(true)
    expect(_isUnlockedFromTags(['ciencias'])).toBe(true)
  })

  it('bloquea con etiqueta "locked"', () => {
    expect(_isUnlockedFromTags(['locked'])).toBe(false)
  })

  it('bloquea con "locked:true"', () => {
    expect(_isUnlockedFromTags(['locked:true'])).toBe(false)
  })

  it('bloquea con "locked=true"', () => {
    expect(_isUnlockedFromTags(['locked=true'])).toBe(false)
  })

  it('es insensible a mayúsculas', () => {
    expect(_isUnlockedFromTags(['LOCKED'])).toBe(false)
    expect(_isUnlockedFromTags(['Locked:True'])).toBe(false)
  })

  it('NO bloquea con "locked:false"', () => {
    expect(_isUnlockedFromTags(['locked:false'])).toBe(true)
  })
})

// ── _parseNewIOField ──────────────────────────────────────────────────────

describe('_parseNewIOField', () => {
  // Formato: {{cN::image-occlusion:shape:prop=val:...}}
  // Coordenadas normalizadas (0–1). id = String(N-1) para coincidir con card.ord

  it('parsea una máscara rect correctamente', () => {
    const text = '{{c1::image-occlusion:rect:left=.0803:top=.7665:width=.0637:height=.1141:oi=1}}'
    const masks = _parseNewIOField(text)
    expect(masks).toHaveLength(1)
    const [m] = masks
    expect(m.id).toBe('0')
    expect(m.type).toBe('rect')
    expect(m.x).toBeCloseTo(0.0803)
    expect(m.y).toBeCloseTo(0.7665)
    expect(m.w).toBeCloseTo(0.0637)
    expect(m.h).toBeCloseTo(0.1141)
  })

  it('el id es N-1 para coincidir con card.ord', () => {
    const text = '{{c3::image-occlusion:rect:left=.1:top=.2:width=.3:height=.4:oi=1}}'
    const [m] = _parseNewIOField(text)
    expect(m.id).toBe('2') // c3 → ord=2
  })

  it('parsea múltiples máscaras en orden', () => {
    const text = [
      '{{c1::image-occlusion:rect:left=.08:top=.77:width=.06:height=.11:oi=1}}',
      '{{c2::image-occlusion:rect:left=.17:top=.77:width=.07:height=.04:oi=1}}',
    ].join('<br>')
    const masks = _parseNewIOField(text)
    expect(masks).toHaveLength(2)
    expect(masks[0].id).toBe('0')
    expect(masks[1].id).toBe('1')
    expect(masks[1].x).toBeCloseTo(0.17)
  })

  it('parsea forma ellipse', () => {
    const text = '{{c1::image-occlusion:ellipse:left=.1:top=.2:width=.3:height=.4:oi=1}}'
    const [m] = _parseNewIOField(text)
    expect(m.type).toBe('ellipse')
    expect(m.x).toBeCloseTo(0.1)
    expect(m.y).toBeCloseTo(0.2)
  })

  it('parsea forma polygon con puntos', () => {
    const text = '{{c1::image-occlusion:polygon:left=.55:top=.49:points=.55,.50 .58,.57 .66,.58 .66,.49:oi=1}}'
    const [m] = _parseNewIOField(text)
    expect(m.type).toBe('polygon')
    expect(m.points).toHaveLength(4)
    expect(m.points[0][0]).toBeCloseTo(0.55)
    expect(m.points[0][1]).toBeCloseTo(0.50)
  })

  it('ignora puntos malformados en polygon', () => {
    const text = '{{c1::image-occlusion:polygon:left=.1:top=.1:points=.5,.5 bad,x .3,.3:oi=1}}'
    const [m] = _parseNewIOField(text)
    // Solo los puntos válidos
    expect(m.points).toHaveLength(2)
  })

  it('devuelve array vacío si no hay marcadores', () => {
    expect(_parseNewIOField('texto normal sin marcadores')).toHaveLength(0)
    expect(_parseNewIOField('')).toHaveLength(0)
  })
})

// ── _parseMediaProto ──────────────────────────────────────────────────────

describe('_parseMediaProto', () => {
  // Construir bytes de protobuf mínimos a mano:
  // MediaFiles { repeated MediaFile files = 1; }
  // MediaFile  { string name = 1; ... }

  function buildProto(filename) {
    const nameBytes = new TextEncoder().encode(filename)
    // Inner field: tag 0x0a (field 1, wire 2) + length + bytes
    const inner = [0x0a, nameBytes.length, ...nameBytes]
    // Outer field: tag 0x0a (field 1, wire 2) + length + inner
    return new Uint8Array([0x0a, inner.length, ...inner])
  }

  it('extrae un nombre de archivo', () => {
    const bytes = buildProto('imagen.webp')
    const map = _parseMediaProto(bytes)
    expect(map['0']).toBe('imagen.webp')
  })

  it('mapea posición N → archivo zip N', () => {
    const enc = new TextEncoder()
    function entry(name) {
      const nb = enc.encode(name)
      const inner = [0x0a, nb.length, ...nb]
      return [0x0a, inner.length, ...inner]
    }
    const bytes = new Uint8Array([...entry('primera.jpg'), ...entry('segunda.png')])
    const map = _parseMediaProto(bytes)
    expect(map['0']).toBe('primera.jpg')
    expect(map['1']).toBe('segunda.png')
  })

  it('devuelve objeto vacío con bytes vacíos', () => {
    expect(_parseMediaProto(new Uint8Array([]))).toEqual({})
  })
})
