/**
 * Almacén de imágenes unificado.
 * Primario: OPFS (carpeta images/ en el directorio privado del origen).
 * Fallback: IndexedDB (navegadores sin OPFS).
 *
 * La migración es lazy: si una imagen no está en OPFS pero sí en IndexedDB,
 * se mueve a OPFS en el mismo get() y se devuelve sin interrupción.
 */

const IDB_NAME  = 'engrama_images'
const IDB_STORE = 'images'

let _opfs      = null   // cached Boolean
let _idb       = null   // cached IDBDatabase
let _engramaId = null   // engrama activo

async function useOpfs() {
  if (_opfs !== null) return _opfs
  try { _opfs = !!(await navigator.storage?.getDirectory()) }
  catch { _opfs = false }
  return _opfs
}

async function imagesDir() {
  const root      = await navigator.storage.getDirectory()
  const engramaDir = await root.getDirectoryHandle(_engramaId ?? 'default', { create: true })
  return engramaDir.getDirectoryHandle('images', { create: true })
}

async function opfsGet(key) {
  try {
    const dir  = await imagesDir()
    const fh   = await dir.getFileHandle(key)
    const file = await fh.getFile()
    return file.text()
  } catch { return null }
}

async function opfsPut(key, value) {
  const dir      = await imagesDir()
  const fh       = await dir.getFileHandle(key, { create: true })
  const writable = await fh.createWritable()
  await writable.write(value)
  await writable.close()
}

async function opfsDelete(key) {
  try { (await imagesDir()).removeEntry(key) } catch {}
}

async function opfsClear() {
  try {
    const root       = await navigator.storage.getDirectory()
    const engramaDir = await root.getDirectoryHandle(_engramaId ?? 'default')
    await engramaDir.removeEntry('images', { recursive: true })
  } catch {}
}

async function idbOpen() {
  if (_idb) return _idb
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE)
    req.onsuccess = e => { _idb = e.target.result; resolve(_idb) }
    req.onerror = () => reject(req.error)
  })
}

async function idbGet(key) {
  const db = await idbOpen()
  return new Promise((resolve, reject) => {
    const req = db.transaction(IDB_STORE).objectStore(IDB_STORE).get(key)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror  = () => reject(req.error)
  })
}

async function idbPut(key, value) {
  const db = await idbOpen()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).put(value, key)
    tx.oncomplete = resolve
    tx.onerror    = () => reject(tx.error)
  })
}

async function idbDelete(key) {
  try {
    const db = await idbOpen()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      tx.objectStore(IDB_STORE).delete(key)
      tx.oncomplete = resolve
      tx.onerror    = () => reject(tx.error)
    })
  } catch {}
}

async function idbClear() {
  try {
    const db = await idbOpen()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      tx.objectStore(IDB_STORE).clear()
      tx.oncomplete = resolve
      tx.onerror    = () => reject(tx.error)
    })
  } catch {}
}

export const ImageStore = {
  init(engramaId) {
    _engramaId = engramaId
  },


  async put(key, dataUrl) {
    if (await useOpfs()) {
      await opfsPut(key, dataUrl)
    } else {
      await idbPut(key, dataUrl)
    }
  },

  async get(key) {
    if (await useOpfs()) {
      const value = await opfsGet(key)
      if (value) return value
      const idbValue = await idbGet(key)
      if (idbValue) {
        opfsPut(key, idbValue)   // migrar a OPFS en background
        return idbValue
      }
      return null
    }
    return idbGet(key)
  },

  async delete(key) {
    await opfsDelete(key)
    await idbDelete(key)
  },

  async clear() {
    await opfsClear()
    await idbClear()
  },
}
