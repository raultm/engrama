import { OPFSDatabaseAdapter }        from './OPFSDatabaseAdapter.js'
import { LocalStorageDatabaseAdapter } from './LocalStorageDatabaseAdapter.js'

export async function createDatabaseAdapter(engramaId) {
  if (await _opfsAvailable()) {
    try {
      const db = new OPFSDatabaseAdapter(engramaId)
      await db.init()
      return db
    } catch (err) {
      console.warn(`[DB] OPFS falló → localStorage (${engramaId}):`, err.message)
    }
  }

  const db = new LocalStorageDatabaseAdapter(engramaId)
  await db.init()
  return db
}

async function _opfsAvailable() {
  try {
    return !!(await navigator.storage?.getDirectory())
  } catch {
    return false
  }
}
