export class StudySessionRepository {
  constructor(db) {
    this._db = db
  }

  save(session, eloEnd) {
    const s = session.getSummary()
    const summary = JSON.stringify({
      eloStart: session.eloStart,
      eloEnd: eloEnd ?? null,
      forgotten: s.forgotten,
      hard: s.hard,
      good: s.good,
      perfect: s.perfect,
      totalEloChange: s.totalEloChange,
      totalCards: session.cards.length,
      answered: s.answered,
    })

    this._db.run(
      `INSERT OR REPLACE INTO study_sessions
       (id, collection_id, scheduler_type, status, started_at, completed_at, summary, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        session.id,
        session.collectionId,
        session.schedulerType,
        session.status,
        session.startedAt,
        session.completedAt,
        summary,
      ]
    )
  }

  markAbandoned(id) {
    this._db.run(
      `UPDATE study_sessions SET status = 'abandoned', completed_at = ? WHERE id = ? AND status = 'active'`,
      [new Date().toISOString(), id]
    )
  }

  findAll() {
    return this._db.queryAll(`SELECT * FROM study_sessions ORDER BY started_at DESC`)
  }
}
