const STORAGE_KEY = 'engrama_theme'
const THEMES = ['dark', 'light']

export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY) ?? 'dark'
  applyTheme(saved)
}

export function toggleTheme() {
  const current = getTheme()
  const next = current === 'dark' ? 'light' : 'dark'
  applyTheme(next)
  return next
}

export function getTheme() {
  return document.documentElement.dataset.theme ?? 'dark'
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
  localStorage.setItem(STORAGE_KEY, theme)
}
