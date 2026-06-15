/**
 * Configuración de la aplicación, cargada desde `public/app-config.json`.
 *
 * Permite personalizar un despliegue (título, visibilidad de ajustes y
 * secciones de Estadísticas) sin recompilar. El fichero solo necesita
 * incluir las claves que se quieran cambiar — el resto se completa con
 * DEFAULTS. Si está vacío, no existe, no es accesible (sin conexión) o no es
 * JSON válido, se usan los valores por defecto — la app nunca deja de
 * arrancar por esto. `public/app-config.json.example` documenta todas las
 * claves disponibles.
 */

const DEFAULTS = {
  appTitle: 'Engrama',
  showDownloadDb: true,
  showEloMargin: true,
  statsCards: { elo: true, due: true, newCards: true, total: true },
}

let _config = DEFAULTS

export async function loadAppConfig() {
  try {
    const res = await fetch('./app-config.json')
    if (res.ok) _config = _mergeConfig(DEFAULTS, await res.json())
  } catch {
    _config = DEFAULTS
  }
  return _config
}

export function getAppConfig() {
  return _config
}

function _mergeConfig(defaults, overrides) {
  return {
    ...defaults,
    ...overrides,
    statsCards: { ...defaults.statsCards, ...overrides.statsCards },
  }
}
