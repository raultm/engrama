export class MarkdownSeedParser {
  parse(markdown) {
    const { meta, body } = this._parseFrontMatter(markdown)
    const slug = this._slugify(meta.name ?? 'seed')
    const cards = this._parseCards(body, slug)

    return {
      collections: [{
        id: `seed-${slug}`,
        name: meta.name ?? 'Sin nombre',
        description: meta.description ?? '',
        schedulerType: meta.schedulerType ?? 'sm2',
        flashCards: cards,
      }]
    }
  }

  _parseFrontMatter(markdown) {
    const match = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
    if (!match) return { meta: {}, body: markdown }

    const meta = {}
    for (const line of match[1].split('\n')) {
      const colon = line.indexOf(':')
      if (colon === -1) continue
      const key = line.slice(0, colon).trim()
      const val = line.slice(colon + 1).trim()
      if (key) meta[key] = val
    }
    return { meta, body: match[2] }
  }

  _parseCards(body, slug) {
    // Split on ## headings — each heading starts a new card
    const blocks = body.split(/\n(?=## )/).map(b => b.trim()).filter(Boolean)

    return blocks.map((block, i) => {
      const headingMatch = block.match(/^## (.+)/)
      if (!headingMatch) return null

      const frontText = headingMatch[1].trim()
      const commentMatch = block.match(/<!--([\s\S]*?)-->/)
      const cardMeta = commentMatch ? this._parseMetaComment(commentMatch[1]) : {}

      const backText = block
        .replace(/^## .+\n?/, '')
        .replace(/<!--[\s\S]*?-->/, '')
        .trim()

      return {
        id: `${slug}-${String(i + 1).padStart(3, '0')}`,
        frontText,
        backText,
        eloDifficulty: cardMeta.elo ? Number(cardMeta.elo) : 1500,
        isUnlocked: cardMeta.locked !== 'true',
        tags: cardMeta.tags ? cardMeta.tags.split(',').map(t => t.trim()) : [],
      }
    }).filter(Boolean)
  }

  _parseMetaComment(comment) {
    const meta = {}
    for (const token of comment.trim().split(/\s+/)) {
      const colon = token.indexOf(':')
      if (colon === -1) continue
      meta[token.slice(0, colon)] = token.slice(colon + 1)
    }
    return meta
  }

  _slugify(name) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }
}
