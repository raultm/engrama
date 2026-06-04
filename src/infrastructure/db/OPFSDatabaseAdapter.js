import { DatabaseAdapter } from './DatabaseAdapter.js'

/**
 * Implementación con OPFS (Origin Private File System).
 *
 * Ventajas sobre localStorage:
 *   - Sin límite de 5-10 MB (puede usar cientos de MB)
 *   - Formato binario nativo — sin serialización JSON
 *
 * Las escrituras son debounced (100ms) para no bloquear cada run().
 * Antes de cerrar la página se fuerza un flush.
 *
 * Migración automática: si existe dato en localStorage lo mueve a OPFS
 * y libera localStorage en el primer init().
 */
export class OPFSDatabaseAdapter extends DatabaseAdapter {
  constructor(engramaId) {
    super(engramaId)
    this._opfsDir     = engramaId          // carpeta raíz del engrama en OPFS
    this._opfsFile    = 'db.sqlite'        // BD dentro de esa carpeta
    this._flushTimer  = null
    this._writePromise = null
    this._setupFlushOnHide()
  }

  // ── Carga ─────────────────────────────────────────────────────────────────

  async _loadData() {
    // 1. Intentar OPFS
    const opfsData = await this._readOPFS()
    if (opfsData) return opfsData

    // 2. Migrar desde localStorage si existe
    const raw = localStorage.getItem(this._dbKey)
    if (!raw) return null
    try {
      const data = new Uint8Array(JSON.parse(raw))
      // Los datos se escribirán en OPFS en el primer persist()
      this._migrateFrom = this._dbKey  // marca para borrar LS tras migrar
      return data
    } catch {
      return null
    }
  }

  async _engramaDir(create = false) {
    const root = await navigator.storage.getDirectory()
    return root.getDirectoryHandle(this._opfsDir, { create })
  }

  async _readOPFS() {
    try {
      const dir  = await this._engramaDir(false)
      const fh   = await dir.getFileHandle(this._opfsFile)
      const file = await fh.getFile()
      const buf  = await file.arrayBuffer()
      return new Uint8Array(buf)
    } catch {
      return null
    }
  }

  // ── Persistencia ──────────────────────────────────────────────────────────

  /**
   * Programa una escritura debounced — no bloquea cada run().
   * Múltiples run() rápidos → una sola escritura en OPFS.
   */
  persist() {
    if (this._flushTimer) clearTimeout(this._flushTimer)
    this._flushTimer = setTimeout(() => {
      this._flushTimer = null
      this._flush()
    }, 100)
  }

  /** Escribe inmediatamente (usado en el evento pagehide). */
  async flushNow() {
    if (this._flushTimer) {
      clearTimeout(this._flushTimer)
      this._flushTimer = null
    }
    await this._flush()
  }

  async _flush() {
    // Serializar la BD en memoria
    const data = this._db.export()
    // Serializar escrituras para no solapar
    this._writePromise = (this._writePromise ?? Promise.resolve())
      .then(() => this._writeOPFS(data))
      .catch(err => console.warn('[OPFS] escritura fallida:', err))
    await this._writePromise
  }

  async _writeOPFS(data) {
    const dir      = await this._engramaDir(true)
    const fh       = await dir.getFileHandle(this._opfsFile, { create: true })
    const writable = await fh.createWritable()
    await writable.write(data)
    await writable.close()

    if (this._migrateFrom) {
      localStorage.removeItem(this._migrateFrom)
      this._migrateFrom = null
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  async reset() {
    try {
      const root = await navigator.storage.getDirectory()
      // Eliminar toda la carpeta del engrama (DB + imágenes)
      await root.removeEntry(this._opfsDir, { recursive: true })
    } catch {}
    localStorage.removeItem(this._dbKey)
  }

  // ── Flush en pagehide ─────────────────────────────────────────────────────

  _setupFlushOnHide() {
    // visibilitychange es más fiable que beforeunload en móvil
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.flushNow()
    })
    window.addEventListener('pagehide', () => this.flushNow())
  }
}
