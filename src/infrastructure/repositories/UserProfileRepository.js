import { UserProfile } from '../../domain/entities/UserProfile.js'

export class UserProfileRepository {
  constructor(db) {
    this._db = db
  }

  get() {
    const row = this._db.queryOne(`SELECT * FROM user_profile WHERE id = 1`)
    if (!row) return null
    return new UserProfile({
      id: row.id,
      displayName: row.display_name,
      eloRating: row.elo_rating,
      totalCardsStudied: row.total_cards_studied,
      totalSessionsCompleted: row.total_sessions_completed,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })
  }

  save(profile) {
    this._db.run(
      `INSERT OR REPLACE INTO user_profile
       (id, display_name, elo_rating, total_cards_studied, total_sessions_completed, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [profile.id, profile.displayName, profile.eloRating,
       profile.totalCardsStudied, profile.totalSessionsCompleted,
       profile.createdAt, profile.updatedAt]
    )
    return profile
  }

  getOrCreate() {
    const existing = this.get()
    if (existing) return existing
    const fresh = new UserProfile({})
    return this.save(fresh)
  }
}
