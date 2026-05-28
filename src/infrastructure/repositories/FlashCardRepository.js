import { FlashCard } from '../../domain/entities/FlashCard.js'

export class FlashCardRepository {
  constructor(db) {
    this._db = db
  }

  findById(id) {
    const row = this._db.queryOne(`SELECT * FROM flashcards WHERE id = ?`, [id])
    return row ? this._rowToCard(row) : null
  }

  findByCollection(collectionId) {
    const rows = this._db.queryAll(
      `SELECT * FROM flashcards WHERE collection_id = ?`, [collectionId]
    )
    return rows.map(r => this._rowToCard(r))
  }

  save(card) {
    this._db.run(
      `INSERT OR REPLACE INTO flashcards
       (id, collection_id, front_text, back_text, elo_difficulty, created_at, updated_at,
        scheduler_data, tags, prerequisites, is_unlocked)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        card.id, card.collectionId, card.frontText, card.backText,
        card.eloDifficulty, card.createdAt, card.updatedAt,
        JSON.stringify(card.schedulerData), JSON.stringify(card.tags),
        JSON.stringify(card.prerequisites), card.isUnlocked ? 1 : 0,
      ]
    )
    return card
  }

  saveMany(cards) {
    for (const card of cards) this.save(card)
  }

  unlockCardsUpToElo(userElo) {
    this._db.run(
      `UPDATE flashcards SET is_unlocked = 1, updated_at = ? WHERE is_unlocked = 0 AND elo_difficulty <= ?`,
      [new Date().toISOString(), userElo]
    )
  }

  findAll() {
    const rows = this._db.queryAll(`SELECT * FROM flashcards`)
    return rows.map(r => this._rowToCard(r))
  }

  delete(id) {
    this._db.run(`DELETE FROM flashcards WHERE id = ?`, [id])
  }

  _rowToCard(row) {
    return new FlashCard({
      id: row.id,
      collectionId: row.collection_id,
      frontText: row.front_text,
      backText: row.back_text,
      eloDifficulty: row.elo_difficulty,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      schedulerData: row.scheduler_data,
      tags: row.tags,
      prerequisites: row.prerequisites,
      isUnlocked: row.is_unlocked,
    })
  }
}
