/**
 * Clase base compartida para los adaptadores de base de datos.
 * Toda la lógica SQL es idéntica — solo difieren la carga y el guardado.
 *
 * Subclases deben implementar:
 *   async _loadData()   → Uint8Array | null
 *   persist()           → void  (puede ser async internamente)
 *   reset()             → void | Promise<void>
 */

let sqlJsInstance = null

export async function getSqlJs() {
  if (sqlJsInstance) return sqlJsInstance
  if (typeof window === 'undefined' || !window.initSqlJs) {
    throw new Error('sql.js no cargado.')
  }
  sqlJsInstance = await window.initSqlJs({
    locateFile: (file) => new URL(file, document.baseURI).href,
  })
  return sqlJsInstance
}

export class DatabaseAdapter {
  constructor(engramaId = 'default') {
    this._engramaId = engramaId
    this._dbKey     = `engrama_db_${engramaId}`
    this._db        = null
  }

  // ── Ciclo de vida ─────────────────────────────────────────────────────────

  async init() {
    const SQL  = await getSqlJs()
    const data = await this._loadData()           // implementado en subclase
    this._db   = data ? new SQL.Database(data) : new SQL.Database()
    await this._migrate()
    return this
  }

  /** Carga datos del almacenamiento. Devuelve Uint8Array o null. */
  async _loadData() { throw new Error('_loadData() not implemented') }

  /** Persiste la BD en el almacenamiento. */
  persist() { throw new Error('persist() not implemented') }

  /** Elimina la BD del almacenamiento. */
  reset() { throw new Error('reset() not implemented') }

  // ── API SQL (compartida) ──────────────────────────────────────────────────

  exec(sql, params = []) {
    return this._db.exec(sql, params)
  }

  run(sql, params = []) {
    this._db.run(sql, params)
    this.persist()
  }

  queryAll(sql, params = []) {
    const result = this._db.exec(sql, params)
    if (!result.length) return []
    const { columns, values } = result[0]
    return values.map(row =>
      Object.fromEntries(columns.map((col, i) => [col, row[i]]))
    )
  }

  queryOne(sql, params = []) {
    return this.queryAll(sql, params)[0] ?? null
  }

  // ── Settings ──────────────────────────────────────────────────────────────

  getSetting(key, defaultValue = null) {
    const row = this.queryOne(`SELECT value FROM settings WHERE key = ?`, [key])
    return row ? row.value : defaultValue
  }

  setSetting(key, value) {
    if (value == null) {
      this.run(`DELETE FROM settings WHERE key = ?`, [key])
    } else {
      this.run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, [key, String(value)])
    }
  }

  isSeeded() {
    return this.queryOne(`SELECT value FROM settings WHERE key = 'seeded'`)?.value === 'true'
  }

  markSeeded() {
    this.run(`INSERT OR REPLACE INTO settings (key, value) VALUES ('seeded', 'true')`)
  }

  // ── Utilidades ────────────────────────────────────────────────────────────

  clearAllData() {
    this._db.run(`DELETE FROM flashcards`)
    this._db.run(`DELETE FROM collections`)
    this._db.run(`DELETE FROM user_profile`)
    this._db.run(`DELETE FROM study_sessions`)
    this._db.run(`DELETE FROM settings`)
    this.persist()
  }

  download(filename = 'engrama.db') {
    const data = this._db.export()
    const blob = new Blob([data], { type: 'application/x-sqlite3' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  // ── Migraciones ───────────────────────────────────────────────────────────

  async _migrate() {
    this._db.run(`
      CREATE TABLE IF NOT EXISTS collections (
        id TEXT PRIMARY KEY,
        parent_id TEXT,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        scheduler_type TEXT DEFAULT 'sm2',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS flashcards (
        id TEXT PRIMARY KEY,
        collection_id TEXT NOT NULL,
        front_text TEXT NOT NULL,
        back_text TEXT NOT NULL,
        elo_difficulty REAL DEFAULT 1500,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        scheduler_data TEXT DEFAULT '{}',
        tags TEXT DEFAULT '[]',
        prerequisites TEXT DEFAULT '[]',
        is_unlocked INTEGER DEFAULT 1,
        FOREIGN KEY (collection_id) REFERENCES collections(id)
      );
      CREATE TABLE IF NOT EXISTS user_profile (
        id INTEGER PRIMARY KEY DEFAULT 1,
        display_name TEXT DEFAULT 'Estudiante',
        elo_rating REAL DEFAULT 1500,
        total_cards_studied INTEGER DEFAULT 0,
        total_sessions_completed INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS study_sessions (
        id TEXT PRIMARY KEY,
        collection_id TEXT NOT NULL,
        scheduler_type TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        started_at TEXT NOT NULL,
        completed_at TEXT,
        summary TEXT DEFAULT '{}'
      );
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `)
    try { this._db.run(`ALTER TABLE study_sessions ADD COLUMN synced INTEGER DEFAULT 0`) } catch {}
    try { this._db.run(`ALTER TABLE flashcards ADD COLUMN card_type TEXT DEFAULT 'basic'`) } catch {}
    try { this._db.run(`ALTER TABLE flashcards ADD COLUMN extra_data TEXT DEFAULT '{}'`) } catch {}

    this.persist()
  }
}
