import { Collection } from '../../domain/entities/Collection.js'
import { FlashCard } from '../../domain/entities/FlashCard.js'

export class CollectionRepository {
  constructor(db) {
    this._db = db
  }

  findAll() {
    const rows = this._db.queryAll(`SELECT * FROM collections ORDER BY name ASC`)
    return rows.map(r => this._rowToCollection(r))
  }

  findById(id) {
    const row = this._db.queryOne(`SELECT * FROM collections WHERE id = ?`, [id])
    return row ? this._rowToCollection(row) : null
  }

  findRoots() {
    const rows = this._db.queryAll(`SELECT * FROM collections WHERE parent_id IS NULL ORDER BY name ASC`)
    return rows.map(r => this._rowToCollection(r))
  }

  findChildren(parentId) {
    const rows = this._db.queryAll(`SELECT * FROM collections WHERE parent_id = ? ORDER BY name ASC`, [parentId])
    return rows.map(r => this._rowToCollection(r))
  }

  save(collection) {
    this._db.run(
      `INSERT OR REPLACE INTO collections (id, parent_id, name, description, scheduler_type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [collection.id, collection.parentId, collection.name, collection.description,
       collection.schedulerType, collection.createdAt, collection.updatedAt]
    )
    return collection
  }

  delete(id) {
    this._db.run(`DELETE FROM collections WHERE id = ?`, [id])
  }

  buildTree(parentId = null) {
    const collections = parentId
      ? this.findChildren(parentId)
      : this.findRoots()

    return collections.map(col => {
      const children = this.buildTree(col.id)
      const cardRows = this._db.queryAll(
        `SELECT * FROM flashcards WHERE collection_id = ?`, [col.id]
      )
      const flashCards = cardRows.map(r => new FlashCard({
        id: r.id,
        collectionId: r.collection_id,
        frontText: r.front_text,
        backText: r.back_text,
        eloDifficulty: r.elo_difficulty,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        schedulerData: r.scheduler_data,
        tags: r.tags,
        prerequisites: r.prerequisites,
        isUnlocked: r.is_unlocked,
      }))
      return new Collection({ ...col, children, flashCards })
    })
  }

  _rowToCollection(row) {
    return new Collection({
      id: row.id,
      parentId: row.parent_id,
      name: row.name,
      description: row.description,
      schedulerType: row.scheduler_type,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })
  }
}
