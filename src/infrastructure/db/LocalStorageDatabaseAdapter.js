import { DatabaseAdapter } from './DatabaseAdapter.js'

export class LocalStorageDatabaseAdapter extends DatabaseAdapter {
  async _loadData() {
    const raw = localStorage.getItem(this._dbKey)
    if (!raw) return null
    try { return new Uint8Array(JSON.parse(raw)) } catch { return null }
  }

  persist() {
    localStorage.setItem(this._dbKey, JSON.stringify(Array.from(this._db.export())))
  }

  restore(data) {
    localStorage.setItem(this._dbKey, JSON.stringify(Array.from(data)))
  }

  reset() {
    localStorage.removeItem(this._dbKey)
  }
}
