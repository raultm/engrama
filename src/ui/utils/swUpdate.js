/**
 * Fuerza una comprobación de actualización del Service Worker.
 * registration.update() ignora la caché HTTP, por lo que funciona incluso
 * si el servidor sirve sw.js con caché positiva.
 *
 * Retorna una promesa que resuelve con:
 *   'unsupported' — el navegador no soporta SW
 *   'no-sw'       — no hay SW registrado
 *   'updating'    — se encontró una nueva versión, la página se recargará sola
 *   'up-to-date'  — ya se tiene la última versión
 */
export function checkForUpdate() {
  if (!('serviceWorker' in navigator)) return Promise.resolve('unsupported')

  return navigator.serviceWorker.getRegistration().then(reg => {
    if (!reg) return 'no-sw'

    // Si ya hay un SW esperando activación, activarlo ahora
    if (reg.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' })
      return 'updating'
    }

    return new Promise(resolve => {
      const timer = setTimeout(() => {
        reg.removeEventListener('updatefound', onFound)
        resolve('up-to-date')
      }, 10_000)

      function onFound() {
        clearTimeout(timer)
        resolve('updating')
        // Con registerType:'autoUpdate' el nuevo SW llama a skipWaiting()
        // → controllerchange → location.reload() gestionado por vite-plugin-pwa
      }

      reg.addEventListener('updatefound', onFound, { once: true })
      reg.update()
    })
  })
}
