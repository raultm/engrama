// Auto-descubre todos los archivos en src/data/seeds/
// Para añadir un mazo: coloca un .json o .md en esa carpeta y reinicia el servidor.

const jsonLoaders = import.meta.glob('./seeds/*.json')
const markdownLoaders = import.meta.glob('./seeds/*.md', { query: '?raw', import: 'default' })

const ICONS = ['◆', '✦', '◈', '◉', '◍', '◎', '◇', '✧']

function pathToId(path) {
  return path.replace(/^.*\//, '').replace(/\.(json|md)$/, '')
}

function metaFromJson(data) {
  const col = data.collections?.[0] ?? {}
  return { name: col.name ?? 'Sin nombre', description: col.description ?? '' }
}

function metaFromMarkdown(raw) {
  const normalized = raw.replace(/\r\n/g, '\n')
  const match = normalized.match(/^---\n([\s\S]*?)\n---/)
  const meta = {}
  if (match) {
    for (const line of match[1].split('\n')) {
      const i = line.indexOf(':')
      if (i === -1) continue
      meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
    }
  }
  return { name: meta.name ?? 'Sin nombre', description: meta.description ?? '' }
}

export async function buildSeedRegistry() {
  const entries = []
  let iconIdx = 0

  for (const [path, loader] of Object.entries(jsonLoaders)) {
    const mod = await loader()
    const data = mod.default ?? mod
    entries.push({
      id: pathToId(path),
      ...metaFromJson(data),
      icon: ICONS[iconIdx++ % ICONS.length],
      format: 'json',
      data,
    })
  }

  for (const [path, loader] of Object.entries(markdownLoaders)) {
    const raw = await loader()
    entries.push({
      id: pathToId(path),
      ...metaFromMarkdown(raw),
      icon: ICONS[iconIdx++ % ICONS.length],
      format: 'markdown',
      data: raw,
    })
  }

  return entries
}
