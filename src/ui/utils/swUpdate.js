/**
 * Fuerza una comprobación del Service Worker y recarga si hay actualización.
 * registration.update() ignora la caché HTTP.
 *
 * Retorna una promesa que resuelve con:
 *   'unsupported' — el navegador no soporta SW
 *   'no-sw'       — no hay SW registrado
 *   'updating'    — nueva versión encontrada, recargando
 *   'up-to-date'  — ya se tiene la última versión
 *   'error'       — fallo de red u otro error
 */
export async function checkForUpdate() {
  if (!('serviceWorker' in navigator)) return 'unsupported'

  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) return 'no-sw'

  // Escuchar controllerchange antes de update() para no perder el evento
  const reloadOnActivation = () => location.reload()
  navigator.serviceWorker.addEventListener('controllerchange', reloadOnActivation, { once: true })

  // Si ya hay un SW esperando, activarlo directamente
  if (reg.waiting) {
    reg.waiting.postMessage({ type: 'SKIP_WAITING' })
    return 'updating'
  }

  return new Promise(resolve => {
    const cleanup = (result) => {
      clearTimeout(timer)
      reg.removeEventListener('updatefound', onFound)
      if (result !== 'updating') {
        navigator.serviceWorker.removeEventListener('controllerchange', reloadOnActivation)
      }
      resolve(result)
    }

    const timer = setTimeout(() => cleanup('up-to-date'), 10_000)

    function onFound() {
      // Nuevo SW instalándose — cuando active, controllerchange recargará
      cleanup('updating')
    }

    reg.addEventListener('updatefound', onFound, { once: true })
    reg.update().catch(() => cleanup('error'))
  })
}
