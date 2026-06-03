/**
 * Parsea un SGF completo en un árbol de nodos para navegar variaciones.
 *
 * Estructura de un nodo:
 *   { props: Map<string, string[]>, children: SgfNode[] }
 *
 * props contiene todas las propiedades del nodo ('B', 'W', 'C', etc.)
 * children son las variaciones (primer hijo = línea principal/correcta).
 */

export function parseSgfTree(text) {
  const tokens = _tokenize(text)
  const root   = { props: new Map(), children: [] }
  _parseNode(tokens, { pos: 0 }, root)
  // El árbol empieza en el primer hijo real (la raíz del SGF = root.children[0])
  return root.children[0] ?? root
}

/**
 * Dado un nodo actual y una jugada (coordenada SGF), devuelve el nodo hijo que
 * corresponde a esa jugada, o null si no existe ninguna variación con esa jugada.
 *
 * @param {object} node     - Nodo actual en el árbol
 * @param {string} coord    - Coordenada SGF de la jugada ('de', 'bb', ...)
 * @param {string} color    - 'B' | 'W'
 * @returns {{ child: object|null, isMain: boolean }}
 */
export function findVariation(node, coord, color) {
  for (let i = 0; i < node.children.length; i++) {
    const child  = node.children[i]
    const moves  = child.props.get(color) ?? []
    if (moves.includes(coord)) {
      return { child, isMain: i === 0 }
    }
  }
  return { child: null, isMain: false }
}

/**
 * Devuelve el primer movimiento de un nodo como { color, coord } o null.
 */
export function nodeMove(node) {
  for (const color of ['B', 'W']) {
    const moves = node.props.get(color) ?? []
    if (moves.length) return { color, coord: moves[0] }
  }
  return null
}

// ── Parser interno ────────────────────────────────────────────────────────

function _tokenize(text) {
  // Tokens: '(' | ')' | ';' | PROP_ID | '[' VALUE ']'
  const tokens = []
  let i = 0
  while (i < text.length) {
    const ch = text[i]
    if (ch === '(' || ch === ')' || ch === ';') {
      tokens.push({ type: ch }); i++
    } else if (ch === '[') {
      // Leer hasta el ']' sin escapar — simplificado para tsumego
      const start = ++i
      while (i < text.length && text[i] !== ']') i++
      tokens.push({ type: 'VAL', value: text.slice(start, i) }); i++
    } else if (/[A-Z]/.test(ch)) {
      const start = i
      while (i < text.length && /[A-Z]/.test(text[i])) i++
      tokens.push({ type: 'ID', value: text.slice(start, i) })
    } else {
      i++ // ignorar espacios, saltos de línea, etc.
    }
  }
  return tokens
}

function _parseNode(tokens, state, parent) {
  while (state.pos < tokens.length) {
    const tok = tokens[state.pos]

    if (tok.type === '(') {
      state.pos++
      const node = { props: new Map(), children: [] }
      parent.children.push(node)
      _parseSequence(tokens, state, node)
      // esperamos ')'
      if (state.pos < tokens.length && tokens[state.pos].type === ')') state.pos++
    } else if (tok.type === ')') {
      return  // fin de la variación actual
    } else {
      state.pos++
    }
  }
}

function _parseSequence(tokens, state, node) {
  let currentNode = node

  while (state.pos < tokens.length) {
    const tok = tokens[state.pos]

    if (tok.type === ';') {
      state.pos++
      // Leer propiedades del nodo
      const props = new Map()
      while (state.pos < tokens.length && tokens[state.pos].type === 'ID') {
        const id = tokens[state.pos].value; state.pos++
        const vals = []
        while (state.pos < tokens.length && tokens[state.pos].type === 'VAL') {
          vals.push(tokens[state.pos].value); state.pos++
        }
        props.set(id, vals)
      }

      if (currentNode === node && node.props.size === 0) {
        // Primer ';' → es el nodo actual
        node.props = props
      } else {
        // Siguiente ';' en la secuencia → hijo
        const next = { props, children: [] }
        currentNode.children.push(next)
        currentNode = next
      }
    } else if (tok.type === '(') {
      // Subvariación
      _parseNode(tokens, state, currentNode)
    } else if (tok.type === ')') {
      return
    } else {
      state.pos++
    }
  }
}
