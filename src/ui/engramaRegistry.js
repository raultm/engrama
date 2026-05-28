const REGISTRY_KEY = 'engrama_registry'
const ACTIVE_KEY = 'engrama_active'

export function getRegistry() {
  try {
    return JSON.parse(localStorage.getItem(REGISTRY_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function registerEngrama(id, name) {
  const registry = getRegistry()
  if (!registry.find(e => e.id === id)) {
    registry.push({ id, name })
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry))
  }
}

export function getActiveId() {
  return localStorage.getItem(ACTIVE_KEY) ?? null
}

export function setActiveId(id) {
  localStorage.setItem(ACTIVE_KEY, id)
}

export function removeEngrama(id) {
  localStorage.removeItem(`engrama_db_${id}`)
  const registry = getRegistry().filter(e => e.id !== id)
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry))

  if (getActiveId() === id) {
    const next = registry[0] ?? null
    if (next) setActiveId(next.id)
    else localStorage.removeItem(ACTIVE_KEY)
  }
}

export function dbKey(id) {
  return `engrama_db_${id}`
}
