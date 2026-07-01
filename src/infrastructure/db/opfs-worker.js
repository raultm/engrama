/**
 * Web Worker para escrituras OPFS via createSyncAccessHandle().
 *
 * A diferencia de createWritable() (que crea un fichero temporal de copia
 * que queda en disco si el proceso se suspende antes de close()), esta API
 * escribe directamente en el fichero sin temporales. Elimina el problema de
 * acumulación de GB en iOS cuando el navegador es enviado al fondo.
 */

self.addEventListener('message', async ({ data: msg }) => {
  const { id, engramaId, fileName, payload } = msg
  try {
    const root = await navigator.storage.getDirectory()
    const dir  = await root.getDirectoryHandle(engramaId, { create: true })
    const fh   = await dir.getFileHandle(fileName, { create: true })
    const sah  = await fh.createSyncAccessHandle()
    try {
      sah.truncate(0)
      sah.write(payload, { at: 0 })
      sah.flush()
    } finally {
      sah.close()
    }
    self.postMessage({ id, ok: true })
  } catch (err) {
    self.postMessage({ id, ok: false, error: err.message })
  }
})
