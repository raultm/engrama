import JSZip from 'jszip'
import { decompress as zstdDecompress } from 'fzstd'
import { FlashCard } from '../../domain/entities/FlashCard.js'
import { ImageStore } from '../../infrastructure/db/ImageStore.js'
import { parseSgf } from '../../domain/sgf/SgfParser.js'

async function getSqlJs() {
  return window.initSqlJs({ locateFile: f => new URL(f, document.baseURI).href })
}

export class AnkiImporter {
  constructor({ db, collectionRepository, flashCardRepository, userProfileRepository, studySessionService }) {
    this._db = db
    this._collectionRepo = collectionRepository
    this._cardRepo = flashCardRepository
    this._profileRepo = userProfileRepository
    this._studySessionService = studySessionService
  }

  async importApkg(file) {
    const zip = await JSZip.loadAsync(file)

    // Preferir el formato más nuevo — collection.anki2 en Anki 24.x es solo un placeholder
    const dbEntry = zip.file('collection.anki21b')
               ?? zip.file('collection.anki21')
               ?? zip.file('collection.anki2')
    if (!dbEntry) throw new Error('Archivo .apkg inválido: no se encontró la colección.')

    let dbBytes = await dbEntry.async('uint8array')

    // Detectar y descomprimir zstd (Anki 24.x+ — magic bytes 0x28 0xB5 0x2F 0xFD)
    if (dbBytes[0] === 0x28 && dbBytes[1] === 0xB5 && dbBytes[2] === 0x2F && dbBytes[3] === 0xFD) {
      try {
        dbBytes = zstdDecompress(dbBytes)
      } catch (err) {
        throw new Error('No se pudo descomprimir el archivo. Puede estar corrupto.')
      }
    }

    const mediaEntry = zip.file('media')
    let mediaIndex = {}
    if (mediaEntry) {
      try {
        let mediaBytes = await mediaEntry.async('uint8array')
        // El fichero media también puede estar comprimido con zstd en Anki 24.x
        if (mediaBytes[0] === 0x28 && mediaBytes[1] === 0xB5 && mediaBytes[2] === 0x2F && mediaBytes[3] === 0xFD) {
          try { mediaBytes = zstdDecompress(mediaBytes) } catch {}
        }
        // Intentar JSON (formato antiguo)
        try {
          const str = new TextDecoder().decode(mediaBytes)
          const parsed = JSON.parse(str)
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) mediaIndex = parsed
        } catch {
          // Formato nuevo: protobuf posicional (entrada N → archivo zip N)
          mediaIndex = _parseMediaProto(mediaBytes)
        }
      } catch {
        console.warn('[AnkiImporter] No se pudo parsear el índice de medios')
      }
    }

    // Extraer imágenes del ZIP → data URLs base64
    // En Anki 24.x los archivos media también están comprimidos con zstd individualmente
    const mediaCache = {}
    for (const [num, filename] of Object.entries(mediaIndex)) {
      if (!_isImageFile(filename)) continue
      const entry = zip.file(num)
      if (!entry) continue
      let bytes = await entry.async('uint8array')
      if (bytes[0] === 0x28 && bytes[1] === 0xB5 && bytes[2] === 0x2F && bytes[3] === 0xFD) {
        try { bytes = zstdDecompress(bytes) } catch {}
      }
      mediaCache[filename] = `data:${_mimeType(filename)};base64,${_toBase64(bytes)}`
    }

    const SQL = await getSqlJs()
    const ankiDb = new SQL.Database(dbBytes)

    // Read schema — supports both old (col.models JSON) and new (notetypes table) formats
    const { models, decks } = _readSchema(ankiDb)

    if (!models || Object.keys(models).length === 0) {
      ankiDb.close()
      throw new Error('No se pudieron leer los tipos de nota del archivo. El formato puede no ser compatible.')
    }

    const notesRows = (ankiDb.exec('SELECT id, mid, flds, tags, data FROM notes')[0]?.values) ?? []
    const cardsRows = (ankiDb.exec('SELECT id, nid, did, ord FROM cards')[0]?.values) ?? []
    ankiDb.close()

    // note id (string) → [{id, did, ord}]. El id de tarjeta de Anki se
    // conserva para poder sincronizar posteriores exportaciones del mismo mazo.
    const noteToCards = new Map()
    for (const [cardId, nid, did, ord] of cardsRows) {
      const key = String(nid)
      if (!noteToCards.has(key)) noteToCards.set(key, [])
      noteToCards.get(key).push({ id: String(cardId), did: String(did), ord })
    }

    // Convert notes to our card format grouped by deck id
    const deckCards = new Map() // deckId(string) → FlashCard[]
    for (const [noteId, mid, flds, tags, data] of notesRows) {
      const model = models[String(mid)]
      if (!model) continue

      const fields = (flds ?? '').split('\x1f')
      const fieldMap = {}
      model.flds.forEach((f, i) => { fieldMap[f.name] = fields[i] ?? '' })

      const noteTags = (tags ?? '').trim().split(/\s+/).filter(Boolean)
      const noteElo = _eloFromNoteData(data)
      const conversionTags = noteElo == null ? noteTags : [...noteTags, `elo:${noteElo}`]
      const cardList = noteToCards.get(String(noteId)) ?? []

      let converted = []
      try {
        converted = await this._convertNote(String(noteId), model, fieldMap, conversionTags, cardList, mediaCache)
      } catch (err) {
        console.warn(`[AnkiImporter] note ${noteId} skipped:`, err.message)
      }

      for (const { deckId, cardData } of converted) {
        if (!deckCards.has(deckId)) deckCards.set(deckId, [])
        deckCards.get(deckId).push({ ...cardData, tags: noteTags })
      }
    }

    // Build deck hierarchy
    // Exclude deck "1" (Default) unless it's the only one or has cards
    const allDecks = Object.entries(decks)
    const nonDefault = allDecks.filter(([id]) => id !== '1')
    const finalDecks = nonDefault.length > 0 ? nonDefault : allDecks

    // Sort: parents before children (fewer '::' first)
    finalDecks.sort((a, b) => {
      const d = a[1].name.split('::').length - b[1].name.split('::').length
      return d !== 0 ? d : a[1].name.localeCompare(b[1].name)
    })

    // Map deck id → collection id
    const deckToColId = {}
    for (const [deckId] of finalDecks) {
      deckToColId[deckId] = `anki-deck-${deckId}`
    }

    // Sync: el .apkg es la fuente de los contenidos, pero no del progreso.
    // Los IDs nativos de Anki permiten actualizar una tarjeta sin perder su
    // planificación SM-2, ELO, estado de desbloqueo o silenciado.
    this._profileRepo.getOrCreate()
    const totalCards = this._syncDecks(finalDecks, deckCards, deckToColId)

    // Store images in IndexedDB (after DB is persisted to avoid size issues)
    for (const [filename, dataUrl] of Object.entries(mediaCache)) {
      await ImageStore.put(`anki-img-${filename}`, dataUrl)
    }

    this._db.markSeeded()
    return { deckCount: finalDecks.length, cardCount: totalCards }
  }

  /**
   * Sincroniza los mazos incluidos en el .apkg.
   *
   * Una tarjeta existente conserva los campos que pertenecen al estudio de la
   * persona (ELO, scheduler, bloqueo y silenciado); el paquete actualiza el
   * contenido que pertenece al autor del mazo. Los mazos hijos que ya no
   * existen y las tarjetas eliminadas se retiran dentro de cada raíz importada.
   */
  _syncDecks(finalDecks, deckCards, deckToColId) {
    const now = new Date().toISOString()
    const incomingCollectionIds = new Set(finalDecks.map(([deckId]) => deckToColId[deckId]))
    const incomingCardIds = new Set(
      [...deckCards.values()].flatMap(cards => cards.map(card => card.id))
    )

    // Solo se limpian las raíces incluidas en esta importación. Otros mazos
    // que pueda tener el mismo Engrama no se ven afectados.
    const rootDeckIds = finalDecks
      .filter(([, deck]) => !deck.name.includes('::'))
      .map(([deckId]) => deckToColId[deckId])
    const existingCollectionIds = new Set()
    for (const rootId of rootDeckIds) {
      if (this._collectionRepo.findById(rootId)) {
        this._collectCollectionIds(rootId, existingCollectionIds)
      }
    }

    // Crear o actualizar la jerarquía antes de mover/guardar tarjetas.
    for (const [deckId, deck] of finalDecks) {
      const colId = deckToColId[deckId]
      const nameParts = deck.name.split('::')
      const shortName = nameParts[nameParts.length - 1]
      const parentName = nameParts.slice(0, -1).join('::')
      const parentEntry = parentName
        ? finalDecks.find(([, candidate]) => candidate.name === parentName)
        : null
      const existing = this._collectionRepo.findById(colId)

      this._collectionRepo.save({
        id: colId,
        parentId: parentEntry ? deckToColId[parentEntry[0]] : null,
        name: shortName,
        description: '',
        schedulerType: 'sm2',
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      })
    }

    let totalCards = 0
    for (const [deckId] of finalDecks) {
      const collectionId = deckToColId[deckId]
      for (const cardData of deckCards.get(deckId) ?? []) {
        const incoming = new FlashCard({ ...cardData, collectionId })
        const existing = this._cardRepo.findById(incoming.id)
          ?? this._findLegacyCard(collectionId, incoming)
        this._cardRepo.save(existing ? _mergeImportedCard(existing, incoming) : incoming)
        totalCards++
      }
    }

    // Las tarjetas que ya no vienen en el .apkg se eliminan, pero una tarjeta
    // movida entre submazos conserva su ID y no se toca aquí.
    for (const collectionId of existingCollectionIds) {
      for (const card of this._cardRepo.findByCollection(collectionId)) {
        if (!incomingCardIds.has(card.id)) this._cardRepo.delete(card.id)
      }
    }

    // Borrar primero las hojas evita dejar colecciones huérfanas.
    for (const collectionId of [...existingCollectionIds].reverse()) {
      if (!incomingCollectionIds.has(collectionId)) this._collectionRepo.delete(collectionId)
    }

    return totalCards
  }

  _collectCollectionIds(collectionId, ids) {
    if (ids.has(collectionId)) return
    ids.add(collectionId)
    for (const child of this._collectionRepo.findChildren(collectionId)) {
      this._collectCollectionIds(child.id, ids)
    }
  }

  // Las versiones anteriores del importador usaban UUIDs aleatorios. En la
  // primera importación con sincronización intentamos migrar esas tarjetas si
  // su contenido sigue siendo idéntico. A partir de ahí se usa el ID de Anki.
  _findLegacyCard(collectionId, incoming) {
    const matches = this._cardRepo.findByCollection(collectionId).filter(card =>
      !card.id.startsWith('anki-card-') && _sameImportedContent(card, incoming)
    )
    return matches.length === 1 ? matches[0] : null
  }

  // ── Note conversion ────────────────────────────────────────────────────────

  async _convertNote(noteId, model, fieldMap, tags, cardList, mediaCache) {
    const modelType = model.type // 0=standard, 1=cloze, 3=image_occlusion(new)
    const modelName = (model.name ?? '').toLowerCase()

    if (modelType === 3 || modelName.includes('image occlusion')) {
      return this._convertImageOcclusion(noteId, model, fieldMap, tags, cardList, mediaCache)
    }
    if (modelType === 1) {
      return this._convertCloze(noteId, fieldMap, tags, cardList)
    }
    if (modelName.includes('tsumego')) {
      return this._convertTsumego(noteId, fieldMap, tags, cardList)
    }
    return this._convertStandard(noteId, model, fieldMap, tags, cardList, mediaCache)
  }

  _convertStandard(noteId, model, fieldMap, tags, cardList, mediaCache = {}) {
    const fieldNames = model.flds.map(f => f.name)
    const f0 = _processField(fieldMap[fieldNames[0]] ?? '', mediaCache) || '(sin texto)'
    const f1 = _processField(fieldMap[fieldNames[1]] ?? '', mediaCache) || '(sin texto)'
    const now = new Date().toISOString()

    return cardList.map(({ id, did, ord }) => ({
      deckId: did,
      cardData: {
        id: _toEngramaCardId(id),
        frontText: ord === 0 ? f0 : f1,
        backText:  ord === 0 ? f1 : f0,
        cardType:  'basic',
        extraData: {},
        tags, eloDifficulty: _eloFromTags(tags), createdAt: now, updatedAt: now,
        schedulerData: {}, prerequisites: [], isUnlocked: _isUnlockedFromTags(tags),
      },
    }))
  }

  _convertCloze(noteId, fieldMap, tags, cardList) {
    const textField = fieldMap['Text'] ?? Object.values(fieldMap)[0] ?? ''
    const cleanText = _stripHtmlKeepCloze(textField)
    const now = new Date().toISOString()

    return cardList.map(({ id, did, ord }) => ({
      deckId: did,
      cardData: {
        id: _toEngramaCardId(id),
        frontText: cleanText,
        backText:  '',
        cardType:  'cloze',
        extraData: { clozeIndex: ord + 1 },
        tags, eloDifficulty: _eloFromTags(tags), createdAt: now, updatedAt: now,
        schedulerData: {}, prerequisites: [], isUnlocked: _isUnlockedFromTags(tags),
      },
    }))
  }

  _convertTsumego(noteId, fieldMap, tags, cardList) {
    // El campo SGF contiene el texto del problema en formato SGF
    const sgfText = fieldMap['SGF'] ?? fieldMap['sgf'] ?? Object.values(fieldMap)[0] ?? ''
    const nombre  = _stripHtml(fieldMap['Nombre'] ?? fieldMap['nombre'] ?? '')
    if (!sgfText.trim()) return []

    const parsed = parseSgf(sgfText)
    const now    = new Date().toISOString()

    return cardList.map(({ id, did, ord }) => ({
      deckId: did,
      cardData: {
        id: _toEngramaCardId(id),
        frontText:    nombre || parsed.comment || `Problema ${ord + 1}`,
        backText:     parsed.correctMoves[0] ?? '',
        cardType:     'tsumego',
        extraData: {
          sgf:          sgfText,
          boardSize:    parsed.boardSize,
          blackStones:  parsed.blackStones,
          whiteStones:  parsed.whiteStones,
          playerToMove: parsed.playerToMove,
          comment:      parsed.comment,
        },
        tags, eloDifficulty: _eloFromTags(tags), createdAt: now, updatedAt: now,
        schedulerData: {}, prerequisites: [], isUnlocked: _isUnlockedFromTags(tags),
      },
    }))
  }

  async _convertImageOcclusion(noteId, model, fieldMap, tags, cardList, mediaCache) {
    const now = new Date().toISOString()

    // Buscar la imagen en cualquier campo
    let imageId = null
    for (const value of Object.values(fieldMap)) {
      const src = _extractImgSrc(value)
      if (src && mediaCache[src]) { imageId = `anki-img-${src}`; break }
    }
    if (!imageId) return []

    // Detectar formato de máscaras:
    // • Nuevo (Anki 24.x): campo 'Oclusión' con {{cN::image-occlusion:rect:...}}
    // • Antiguo (IOE plugin): campo 'SVG' con elementos SVG
    const occlusionText = fieldMap['Oclusión'] ?? fieldMap['Occlusion']
                       ?? fieldMap['oclusión'] ?? fieldMap['occlusion'] ?? ''
    const masks = occlusionText.includes('image-occlusion:')
      ? _parseNewIOField(occlusionText)
      : _extractShapes(fieldMap)

    const header    = _stripHtml(fieldMap['Encabezado'] ?? fieldMap['Header'] ?? '')
    const backExtra = _stripHtml(fieldMap['Reverso Extra'] ?? fieldMap['Back Extra'] ?? fieldMap['Remarks'] ?? '')

    return cardList.map(({ id, did, ord }) => {
      const activeMask   = masks.find(m => m.id === String(ord)) ?? masks[ord] ?? null
      const activeMaskId = activeMask?.id ?? String(ord)
      const label        = activeMask?.label || backExtra || ''
      return {
        deckId: did,
        cardData: {
          id: _toEngramaCardId(id),
          frontText: header || '',
          backText:  label,
          cardType:  'image_occlusion',
          extraData: { imageId, masks, activeMaskId, header, backExtra },
          tags, eloDifficulty: _eloFromTags(tags), createdAt: now, updatedAt: now,
          schedulerData: {}, prerequisites: [], isUnlocked: _isUnlockedFromTags(tags),
        },
      }
    })
  }
}

// ── Schema reader: fusiona col JSON (formato antiguo) + tablas separadas (formato nuevo) ──
// Anki 24.x: col.models y col.decks solo tienen el mazo por defecto;
// los datos reales están en las tablas notetypes/decks.

function _readSchema(ankiDb) {
  let models = {}
  let decks  = {}

  // 1. Leer de col (formato antiguo — JSON en columnas)
  try {
    const colRows = ankiDb.exec('SELECT models, decks FROM col LIMIT 1')
    if (colRows.length) {
      const [modelsJson, decksJson] = colRows[0].values[0]
      if (modelsJson) {
        try {
          const m = JSON.parse(modelsJson)
          if (m && typeof m === 'object' && !Array.isArray(m)) models = m
        } catch {}
      }
      if (decksJson) {
        try {
          const d = JSON.parse(decksJson)
          if (d && typeof d === 'object' && !Array.isArray(d)) decks = d
        } catch {}
      }
    }
  } catch {}

  // 2. Fusionar con tabla notetypes (formato nuevo — siempre intentarlo)
  try {
    const fieldRows = ankiDb.exec('SELECT ntid, ord, name FROM fields ORDER BY ntid, ord')
    const fieldsByNt = {}
    if (fieldRows.length) {
      for (const [ntid, ord, name] of fieldRows[0].values) {
        const key = String(ntid)
        if (!fieldsByNt[key]) fieldsByNt[key] = []
        fieldsByNt[key].push({ name, ord })
      }
    }

    const ntRows = ankiDb.exec('SELECT id, name FROM notetypes')
    if (ntRows.length) {
      for (const [id, name] of ntRows[0].values) {
        const key = String(id)
        if (models[key]) continue  // ya existe del formato antiguo
        const nl   = (name ?? '').toLowerCase()
        const type = nl.includes('cloze') ? 1
                   : (nl.includes('image occlusion') || nl.includes('oclusión')) ? 3
                   : 0
        const flds = (fieldsByNt[key] ?? []).sort((a, b) => a.ord - b.ord)
        models[key] = {
          id: key, name, type,
          flds: flds.length ? flds : [{ name: 'Front', ord: 0 }, { name: 'Back', ord: 1 }],
          tmpls: [{ name: 'Card 1', ord: 0 }],
        }
      }
    }
  } catch (err) {
    console.warn('[AnkiImporter] notetypes table:', err.message)
  }

  // 3. Fusionar con tabla decks (formato nuevo — siempre intentarlo)
  try {
    const deckRows = ankiDb.exec('SELECT id, name FROM decks')
    if (deckRows.length) {
      for (const [id, name] of deckRows[0].values) {
        const key = String(id)
        if (!decks[key]) decks[key] = { id: parseInt(key), name }
      }
    }
  } catch {}

  return { models, decks }
}

// ── Exports para tests ─────────────────────────────────────────────────────
export {
  _parseNewIOField,
  _parseMediaProto,
  _eloFromTags,
  _isUnlockedFromTags,
  _eloFromNoteData,
  _toEngramaCardId,
  _mergeImportedCard,
}

// ── Parsers para formatos Anki 24.x ────────────────────────────────────────

// Parsea máscaras del nuevo formato: {{cN::image-occlusion:rect:left=X:top=Y:width=W:height=H:oi=1}}
// Coordenadas ya normalizadas (0–1). id = String(clozeNum - 1) para coincidir con card.ord
function _parseNewIOField(text) {
  const masks = []
  const re = /\{\{c(\d+)::image-occlusion:([^}]+)\}\}/g
  let m
  while ((m = re.exec(text)) !== null) {
    const id    = String(parseInt(m[1]) - 1)
    const parts = m[2].split(':')
    // m[2] ya empieza DESPUÉS de "image-occlusion:" → parts[0]=tipo, parts[1..]=propiedades
    const shape = parts[0] ?? 'rect'
    const props = {}
    for (const p of parts.slice(1)) {
      const eq = p.indexOf('=')
      if (eq < 0) continue
      const key = p.slice(0, eq)
      const val = p.slice(eq + 1)
      // 'points' es una lista de pares "x,y" separados por espacios — no es un número
      props[key] = (key === 'points') ? val : parseFloat(val)
    }

    let mask
    if (shape === 'polygon') {
      const rawPts = typeof props.points === 'string' ? props.points : ''
      const points = rawPts.trim().split(/\s+/).map(pair => {
        const [px, py] = pair.split(',').map(Number)
        return [px, py]
      }).filter(([px, py]) => isFinite(px) && isFinite(py))
      mask = { id, type: 'polygon', x: props.left ?? 0, y: props.top ?? 0, w: 0, h: 0, points, label: '' }
    } else if (shape === 'ellipse') {
      const cx = props.cx, cy = props.cy, rx = props.rx, ry = props.ry
      mask = {
        id, type: 'ellipse', label: '',
        x: cx != null ? cx - (rx ?? 0) : (props.left ?? 0),
        y: cy != null ? cy - (ry ?? 0) : (props.top  ?? 0),
        w: rx != null ? rx * 2 : (props.width  ?? 0),
        h: ry != null ? ry * 2 : (props.height ?? 0),
      }
    } else {
      mask = { id, type: 'rect', label: '', x: props.left ?? 0, y: props.top ?? 0, w: props.width ?? 0, h: props.height ?? 0 }
    }
    masks.push(mask)
  }
  return masks
}

// Parsea el índice de medios en formato protobuf (Anki 24.x)
// Estructura: MediaFiles { repeated MediaFile files = 1; } / MediaFile { string name = 1; ... }
// Mapping posicional: entrada N → archivo zip N
function _parseMediaProto(bytes) {
  const map = {}
  const dec = new TextDecoder()
  let pos = 0
  let idx = 0

  function readVar() {
    let v = 0, s = 0
    while (pos < bytes.length) {
      const b = bytes[pos++]
      v += (b & 0x7F) * Math.pow(2, s)
      s += 7
      if (!(b & 0x80)) break
    }
    return v
  }

  function skipField(w) {
    if (w === 0) readVar()
    else if (w === 1) pos += 8
    else if (w === 2) pos += readVar()
    else if (w === 5) pos += 4
  }

  while (pos < bytes.length) {
    const tag = readVar()
    const field = tag >>> 3
    const wire  = tag & 7
    if (wire !== 2) { skipField(wire); continue }
    const len = readVar()
    const end = pos + len
    if (field !== 1) { pos = end; continue }

    let name = null
    while (pos < end) {
      const t = readVar()
      const f = t >>> 3
      const w = t & 7
      if (w !== 2) { skipField(w); continue }
      const l = readVar()
      if (f === 1 && l > 0) name = dec.decode(bytes.slice(pos, pos + l))
      pos += l
    }
    pos = end
    if (name) map[String(idx++)] = name
  }
  return map
}

// ── Helpers ────────────────────────────────────────────────────────────────

// Anki mantiene el ID de cada card al editar y volver a exportar un mazo. Es
// el vínculo estable entre el contenido del autor y el progreso en Engrama.
function _toEngramaCardId(ankiCardId) {
  if (!ankiCardId) throw new Error('La tarjeta de Anki no tiene identificador.')
  return `anki-card-${ankiCardId}`
}

function _mergeImportedCard(existing, incoming) {
  return existing.update({
    id: incoming.id,
    collectionId: incoming.collectionId,
    frontText: incoming.frontText,
    backText: incoming.backText,
    cardType: incoming.cardType,
    extraData: incoming.extraData,
    tags: incoming.tags,
    // ELO, schedulerData, isUnlocked y muted son datos de estudio: se
    // conservan aunque el autor modifique la tarjeta en Anki.
  })
}

function _sameImportedContent(existing, incoming) {
  return existing.frontText === incoming.frontText
    && existing.backText === incoming.backText
    && existing.cardType === incoming.cardType
    && JSON.stringify(existing.extraData) === JSON.stringify(incoming.extraData)
}

function _eloFromNoteData(data) {
  try {
    const elo = JSON.parse(data)?.engrama?.elo
    return Number.isInteger(elo) && elo >= 100 && elo <= 3000 ? elo : null
  } catch {
    return null
  }
}


function _eloFromTags(tags) {
  for (const tag of tags) {
    const m = tag.match(/^elo[=:](\d+)$/i)
    if (m) return parseInt(m[1], 10)
  }
  return 1500
}

function _isUnlockedFromTags(tags) {
  for (const tag of tags) {
    if (/^locked[=:]?true$/i.test(tag) || /^locked$/i.test(tag)) return false
  }
  return true
}

function _stripHtml(html) {
  if (!html) return ''
  const d = document.createElement('div')
  d.innerHTML = html
  return (d.textContent || d.innerText || '').trim()
}

/**
 * Procesa un campo de nota Anki para uso en tarjetas básicas:
 * - Sustituye src de <img> por data URLs del mediaCache
 * - Normaliza <br>
 * - Elimina scripts y event handlers (seguridad básica)
 * - Elimina el resto de etiquetas HTML conservando su texto
 */
function _processField(html, mediaCache = {}) {
  if (!html) return ''

  let r = html

  // Eliminar bloques script/style completos
  r = r.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')

  // Sustituir <img src="filename"> por una referencia a ImageStore.
  // La imagen ya se guardará en IndexedDB al final del importApkg;
  // aquí solo almacenamos la clave para no sobrecargar localStorage.
  r = r.replace(/<img\b[^>]*>/gi, m => {
    const src = (m.match(/\bsrc=["']([^"']+)["']/i) ?? [])[1]
    if (!src || !mediaCache[src]) return ''   // omitir imágenes que no existen en el ZIP
    return `<img data-anki-src="anki-img-${src}">`
  })

  // Normalizar <br>
  r = r.replace(/<br\s*\/?>/gi, '<br>')

  // Eliminar event handlers
  r = r.replace(/\s+on\w+="[^"]*"/gi, '')

  // Eliminar todas las etiquetas excepto <img> y <br> (ya seguros)
  r = r.replace(/<(?!\/?(?:img|br)\b)[^>]+>/gi, '')

  // Limpiar entidades HTML de Anki ([sound:...], etc.)
  r = r.replace(/\[sound:[^\]]*\]/g, '')

  return r.trim()
}

function _stripHtmlKeepCloze(html) {
  // Remove <img> and [sound:...] but preserve text and {{cN::}} markers
  return (html ?? '')
    .replace(/<img[^>]*>/gi, '')
    .replace(/\[sound:[^\]]*\]/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim()
}

function _extractImgSrc(html) {
  if (!html) return null
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  return m ? m[1] : null
}

function _extractShapes(fieldMap) {
  // Look for a field containing SVG (old Image Occlusion Enhanced plugin)
  let svgContent = null
  for (const [name, value] of Object.entries(fieldMap)) {
    const lname = name.toLowerCase()
    if ((lname.includes('occlusion') || lname === 'svg') && value && value.includes('<')) {
      svgContent = value
      break
    }
  }
  if (!svgContent) {
    for (const value of Object.values(fieldMap)) {
      if (value && (value.includes('<svg') || value.includes('<rect'))) {
        svgContent = value
        break
      }
    }
  }
  return svgContent ? _parseSvgShapes(svgContent) : []
}

function _parseSvgShapes(svgContent) {
  try {
    const doc = document.createElement('div')
    doc.innerHTML = svgContent
    const svgEl = doc.querySelector('svg')
    if (!svgEl) return []

    const vb = svgEl.getAttribute('viewBox')
    let vbW = parseFloat(svgEl.getAttribute('width') || 1)
    let vbH = parseFloat(svgEl.getAttribute('height') || 1)
    if (vb) {
      const p = vb.trim().split(/[\s,]+/)
      vbW = parseFloat(p[2]) || vbW
      vbH = parseFloat(p[3]) || vbH
    }
    if (!vbW || !vbH) return []

    const shapes = []
    svgEl.querySelectorAll('rect, ellipse').forEach((el, idx) => {
      const id = el.getAttribute('id') || String(idx)
      const label = el.querySelector('title')?.textContent?.trim() || ''

      if (el.tagName.toLowerCase() === 'rect') {
        shapes.push({
          id, type: 'rect', label,
          x: parseFloat(el.getAttribute('x') || 0) / vbW,
          y: parseFloat(el.getAttribute('y') || 0) / vbH,
          w: parseFloat(el.getAttribute('width') || 0) / vbW,
          h: parseFloat(el.getAttribute('height') || 0) / vbH,
        })
      } else {
        const cx = parseFloat(el.getAttribute('cx') || 0) / vbW
        const cy = parseFloat(el.getAttribute('cy') || 0) / vbH
        const rx = parseFloat(el.getAttribute('rx') || 0) / vbW
        const ry = parseFloat(el.getAttribute('ry') || 0) / vbH
        shapes.push({ id, type: 'ellipse', label, x: cx - rx, y: cy - ry, w: rx * 2, h: ry * 2 })
      }
    })
    return shapes
  } catch {
    return []
  }
}

function _isImageFile(filename) {
  return /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(filename)
}

function _mimeType(filename) {
  const ext = filename.split('.').pop().toLowerCase()
  return ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
            gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
            bmp: 'image/bmp' })[ext] ?? 'image/jpeg'
}

function _toBase64(bytes) {
  const chunkSize = 65536
  const chunks = []
  for (let i = 0; i < bytes.length; i += chunkSize) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, Math.min(i + chunkSize, bytes.length))))
  }
  return btoa(chunks.join(''))
}
