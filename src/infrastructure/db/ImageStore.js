const DB_NAME = 'engrama_images'
const STORE = 'images'
let _db = null

async function openDb() {
  if (_db) return _db
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = e => e.target.result.createObjectStore(STORE)
    req.onsuccess = e => { _db = e.target.result; resolve(_db) }
    req.onerror = () => reject(req.error)
  })
}

export const ImageStore = {
  async put(key, dataUrl) {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(dataUrl, key)
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error)
    })
  },

  async get(key) {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE).objectStore(STORE).get(key)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    })
  },

  async delete(key) {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(key)
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error)
    })
  },

  async clear() {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).clear()
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error)
    })
  },
}
