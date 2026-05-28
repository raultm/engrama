import { Collection } from '../../domain/entities/Collection.js'
import { FlashCard } from '../../domain/entities/FlashCard.js'
import { MarkdownSeedParser } from './MarkdownSeedParser.js'

const parser = new MarkdownSeedParser()

export class SeedService {
  constructor({ db, collectionRepository, flashCardRepository, userProfileRepository }) {
    this._db = db
    this._collectionRepo = collectionRepository
    this._cardRepo = flashCardRepository
    this._profileRepo = userProfileRepository
  }

  async seedFromRegistry(entry) {
    const seedData = entry.format === 'markdown' ? parser.parse(entry.data) : entry.data
    return this.seedIfEmpty(seedData)
  }

  async seedIfEmpty(seedData) {
    if (this._db.isSeeded()) return false
    this._profileRepo.getOrCreate()
    for (const colData of seedData.collections) {
      this._importCollection(colData, null)
    }
    this._db.markSeeded()
    return true
  }

  /**
   * Importa un archivo subido por el usuario.
   * - Misma colección raíz → sync (preserva ELO y schedulerData, añade nuevas, elimina borradas)
   * - Colección distinta → borrado completo + reimportación + recarga
   */
  async importFile(rawText, format) {
    const seedData = format === 'markdown' ? parser.parse(rawText) : JSON.parse(rawText)
    const rootId = seedData.collections?.[0]?.id
    if (!rootId) throw new Error('El archivo no contiene colecciones válidas.')

    const existingRoot = this._collectionRepo.findById(rootId)

    if (existingRoot) {
      this._syncTree(seedData)
      return { replaced: false }
    } else {
      this._db.clearAllData()
      this._profileRepo.getOrCreate()
      for (const colData of seedData.collections) {
        this._importCollection(colData, null)
      }
      this._db.markSeeded()
      return { replaced: true }
    }
  }

  // ── Sync de colección existente ──────────────────────────────────────────

  _syncTree(seedData) {
    const { collections: seedCols, cards: seedCards } = this._flattenTree(seedData.collections, null)

    const rootId = seedData.collections[0].id
    const dbColIds = this._getDbCollectionIds(rootId)
    const dbCardIds = this._getDbCardIds(dbColIds)

    const seedColIds = new Set(seedCols.map(c => c.id))
    const seedCardIds = new Set(seedCards.map(c => c.id))

    // Elimina tarjetas que ya no están en el archivo
    for (const id of dbCardIds) {
      if (!seedCardIds.has(id)) this._cardRepo.delete(id)
    }

    // Elimina colecciones que ya no están (orden hoja→raíz para evitar FK)
    const dbColSet = new Set(dbColIds)
    for (const id of [...dbColIds].reverse()) {
      if (!seedColIds.has(id)) this._collectionRepo.delete(id)
    }

    // Añade o actualiza metadatos de colecciones
    for (const col of seedCols) {
      this._collectionRepo.save(col)
    }

    // Añade tarjetas nuevas; las existentes no se tocan (se preserva ELO y schedulerData)
    for (const card of seedCards) {
      if (!dbCardIds.has(card.id)) this._cardRepo.save(card)
    }
  }

  _flattenTree(collections, parentId) {
    const cols = []
    const cards = []

    for (const data of collections) {
      const col = new Collection({
        id: data.id,
        parentId,
        name: data.name,
        description: data.description ?? '',
        schedulerType: data.schedulerType ?? 'sm2',
        createdAt: data.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      cols.push(col)

      for (const cardData of data.flashCards ?? []) {
        cards.push(new FlashCard({
          id: cardData.id,
          collectionId: col.id,
          frontText: cardData.frontText,
          backText: cardData.backText,
          eloDifficulty: cardData.eloDifficulty ?? 1500,
          isUnlocked: cardData.isUnlocked ?? true,
          tags: cardData.tags ?? [],
          createdAt: cardData.createdAt ?? new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))
      }

      if (data.children?.length) {
        const { collections: cc, cards: cc2 } = this._flattenTree(data.children, col.id)
        cols.push(...cc)
        cards.push(...cc2)
      }
    }

    return { collections: cols, cards }
  }

  _getDbCollectionIds(rootId) {
    const ids = []
    const queue = [rootId]
    while (queue.length) {
      const id = queue.shift()
      if (!this._collectionRepo.findById(id)) continue
      ids.push(id)
      const children = this._db.queryAll(`SELECT id FROM collections WHERE parent_id = ?`, [id])
      queue.push(...children.map(r => r.id))
    }
    return ids
  }

  _getDbCardIds(colIds) {
    if (!colIds.length) return new Set()
    const placeholders = colIds.map(() => '?').join(',')
    const rows = this._db.queryAll(
      `SELECT id FROM flashcards WHERE collection_id IN (${placeholders})`, colIds
    )
    return new Set(rows.map(r => r.id))
  }

  // ── Importación completa ─────────────────────────────────────────────────

  _importCollection(data, parentId) {
    const col = new Collection({
      id: data.id,
      parentId,
      name: data.name,
      description: data.description ?? '',
      schedulerType: data.schedulerType ?? 'sm2',
      createdAt: data.createdAt ?? new Date().toISOString(),
      updatedAt: data.updatedAt ?? new Date().toISOString(),
    })
    this._collectionRepo.save(col)

    for (const cardData of data.flashCards ?? []) {
      this._cardRepo.save(new FlashCard({
        id: cardData.id,
        collectionId: col.id,
        frontText: cardData.frontText,
        backText: cardData.backText,
        eloDifficulty: cardData.eloDifficulty ?? 1500,
        isUnlocked: cardData.isUnlocked ?? true,
        tags: cardData.tags ?? [],
        createdAt: cardData.createdAt ?? new Date().toISOString(),
        updatedAt: cardData.updatedAt ?? new Date().toISOString(),
      }))
    }

    for (const child of data.children ?? []) {
      this._importCollection(child, col.id)
    }
  }
}
