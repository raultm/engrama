const routes = new Map()
let currentRoute = null
let rootEl = null

export function defineRoute(path, handler) {
  routes.set(path, handler)
}

export function initRouter(el) {
  rootEl = el
  window.addEventListener('hashchange', _handleRoute)
  _handleRoute()
}

export function navigate(path) {
  window.location.hash = path
}

function _handleRoute() {
  const hash = window.location.hash.slice(1) || '/'
  const [basePath, ...rest] = hash.split('/')
  const path = basePath === '' ? '/' : '/' + basePath

  // Try exact match first, then parameterized
  let handler = routes.get(hash) || routes.get(path)
  const params = rest.join('/')

  if (handler) {
    currentRoute = hash
    handler(rootEl, params)
  } else {
    handler = routes.get('*')
    if (handler) handler(rootEl, hash)
  }
}

export function getCurrentRoute() {
  return currentRoute
}
