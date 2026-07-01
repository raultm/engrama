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
    this._opfsDir      = engramaId
    this._opfsFile     = 'db.sqlite'
    this._flushTimer   = null
    this._writePromise = null
    this._dirty        = false
    this._worker       = null
    this._pending      = new Map()
    this._msgId        = 0
    this._setupFlushOnHide()
  }

  _getWorker() {
    if (this._worker) return this._worker
    try {
      this._worker = new Worker(new URL('./opfs-worker.js', import.meta.url), { type: 'module' })
      this._worker.addEventListener('message', ({ data }) => {
        const resolve = this._pending.get(data.id)
        if (resolve) {
          this._pending.delete(data.id)
          resolve(data)
        }
      })
      return this._worker
    } catch {
      return null
    }
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
   *
   * El debounce es de 1500ms (en vez de los típicos 100ms) para reducir
   * drásticamente el número de ficheros temporales que iOS crea internamente
   * con createWritable() y que no limpia si el proceso se suspende antes de
   * que close() complete. La pérdida máxima de datos en un crash es ~1.5s.
   */
  persist() {
    this._dirty = true
    if (this._flushTimer) clearTimeout(this._flushTimer)
    this._flushTimer = setTimeout(() => {
      this._flushTimer = null
      this._flush()
    }, 1500)
  }

  /** Escribe inmediatamente (usado en el evento pagehide/visibilitychange). */
  async flushNow() {
    // Si no hay cambios pendientes, no crear una escritura innecesaria en OPFS
    // (cada createWritable() en iOS genera un fichero temporal que puede
    // acumularse si el proceso se suspende antes de que close() complete).
    if (!this._dirty) return
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
    const worker = this._getWorker()

    if (worker) {
      // Ruta principal: Worker + createSyncAccessHandle() — sin ficheros temporales.
      const id = ++this._msgId
      await new Promise((resolve, reject) => {
        this._pending.set(id, (result) =>
          result.ok ? resolve() : reject(new Error(result.error))
        )
        // Transferir el buffer al Worker (copia cero) y escribir allí.
        worker.postMessage(
          { id, engramaId: this._opfsDir, fileName: this._opfsFile, payload: data },
          [data.buffer]
        )
      })
    } else {
      // Fallback: createWritable() si el Worker no está disponible.
      const dir      = await this._engramaDir(true)
      const fh       = await dir.getFileHandle(this._opfsFile, { create: true })
      const writable = await fh.createWritable()
      await writable.write(data)
      await writable.close()
    }

    this._dirty = false

    if (this._migrateFrom) {
      localStorage.removeItem(this._migrateFrom)
      this._migrateFrom = null
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  async reset() {
    this._worker?.terminate()
    this._worker = null
    try {
      const root = await navigator.storage.getDirectory()
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
