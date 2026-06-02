let sqlJsInstance = null

async function getSqlJs() {
  if (sqlJsInstance) return sqlJsInstance
  if (typeof window === 'undefined' || !window.initSqlJs) {
    throw new Error('sql.js no cargado. Asegúrate de incluir sql-wasm-browser.js en el HTML.')
  }
  sqlJsInstance = await window.initSqlJs({
    locateFile: (file) => new URL(file, document.baseURI).href
  })
  return sqlJsInstance
}

export class DatabaseAdapter {
  constructor(engramaId = 'default') {
    this._db = null
    this._dbKey = `engrama_db_${engramaId}`
  }

  async init() {
    const SQL = await getSqlJs()
    const saved = this._loadFromStorage()
    if (saved) {
      this._db = new SQL.Database(saved)
    } else {
      this._db = new SQL.Database()
    }
    await this._migrate()
    return this
  }

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

    // Columnas añadidas tras el schema inicial — ignorar si ya existen
    try { this._db.run(`ALTER TABLE study_sessions ADD COLUMN synced INTEGER DEFAULT 0`) } catch {}
    try { this._db.run(`ALTER TABLE flashcards ADD COLUMN card_type TEXT DEFAULT 'basic'`) } catch {}
    try { this._db.run(`ALTER TABLE flashcards ADD COLUMN extra_data TEXT DEFAULT '{}'`) } catch {}

    this.persist()
  }

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
    const rows = this.queryAll(sql, params)
    return rows[0] ?? null
  }

  persist() {
    const data = this._db.export()
    const arr = Array.from(data)
    localStorage.setItem(this._dbKey, JSON.stringify(arr))
  }

  _loadFromStorage() {
    const raw = localStorage.getItem(this._dbKey)
    if (!raw) return null
    try {
      return new Uint8Array(JSON.parse(raw))
    } catch {
      return null
    }
  }

  getSetting(key, defaultValue = null) {
    const row = this.queryOne(`SELECT value FROM settings WHERE key = ?`, [key])
    return row ? row.value : defaultValue
  }

  setSetting(key, value) {
    this.run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, [key, String(value)])
  }

  isSeeded() {
    const row = this.queryOne(`SELECT value FROM settings WHERE key = 'seeded'`)
    return row?.value === 'true'
  }

  reset() {
    localStorage.removeItem(this._dbKey)
  }

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
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  markSeeded() {
    this.run(`INSERT OR REPLACE INTO settings (key, value) VALUES ('seeded', 'true')`)
  }
}
