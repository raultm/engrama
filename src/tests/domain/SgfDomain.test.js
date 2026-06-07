import { describe, it, expect } from 'vitest'
import { GoEngine }                     from '../../domain/sgf/GoEngine.js'
import { parseSgfTree, findVariation, nodeMove } from '../../domain/sgf/SgfTree.js'
import { parseSgf }                     from '../../domain/sgf/SgfParser.js'
import { TsumegoController }            from '../../domain/sgf/TsumegoController.js'

// ── GoEngine ──────────────────────────────────────────────────────────────────

describe('GoEngine — place y captura', () => {
  it('coloca una piedra en un tablero vacío', () => {
    const e = new GoEngine(9)
    e.place('aa', 'B')
    expect(e.board['aa']).toBe('B')
    expect(e.board['ab']).toBeUndefined()
  })

  it('captura una piedra enemiga sin libertades', () => {
    // Blanca en 'ba' (col 1, row 0). Sus vecinos: 'aa', 'ca', 'bb'.
    // Negras en 'aa', 'ca', 'bb' → 'ba' queda sin libertades al colocar en 'bb'.
    const e = new GoEngine(9, ['aa', 'ca'], ['ba'])
    const captured = e.place('bb', 'B')
    expect(captured).toContain('ba')
    expect(e.board['ba']).toBeUndefined()
  })

  it('no captura una piedra con libertades restantes', () => {
    // Blanca en 'ba'. Sólo tapamos 'aa' y 'ca', queda libre 'bb'.
    const e = new GoEngine(9, ['aa', 'ca'], ['ba'])
    e.place('aa', 'W')  // 'aa' ya es negra, solo ocupamos para no tocar 'bb'
    expect(e.board['ba']).toBe('W')
  })

  it('captura un grupo de varias piedras', () => {
    // Blancas en 'aa' y 'ba'. Sus libertades colectivas: 'ab', 'ca', 'bb'.
    // Negras en 'ab', 'ca' → última libertad 'bb'. Colocar B en 'bb' captura el grupo.
    const e = new GoEngine(9, ['ab', 'ca'], ['aa', 'ba'])
    const captured = e.place('bb', 'B')
    expect(captured).toContain('aa')
    expect(captured).toContain('ba')
    expect(e.board['aa']).toBeUndefined()
    expect(e.board['ba']).toBeUndefined()
  })

  it('snapshot devuelve copia del tablero actual', () => {
    const e = new GoEngine(9, ['aa'], [])
    const snap = e.snapshot()
    e.place('bb', 'W')
    expect(snap['bb']).toBeUndefined()  // la copia no debe cambiar
  })

  it('isEmpty detecta intersecciones vacías', () => {
    const e = new GoEngine(9, ['aa'], [])
    expect(e.isEmpty('aa')).toBe(false)
    expect(e.isEmpty('bb')).toBe(true)
  })

  it('los vecinos en la esquina son sólo 2', () => {
    const e = new GoEngine(9)
    // Esquina 'aa' sólo tiene vecinos 'ba' y 'ab'
    const neighbors = e._neighbors('aa')
    expect(neighbors).toHaveLength(2)
    expect(neighbors).toContain('ba')
    expect(neighbors).toContain('ab')
  })
})

// ── SgfTree ───────────────────────────────────────────────────────────────────

describe('parseSgfTree', () => {
  it('parsea un SGF lineal de una sola variación', () => {
    const tree = parseSgfTree('(;GM[1]SZ[9]PL[B];B[aa];W[bb])')
    expect(tree).toBeTruthy()
    expect(tree.props.get('SZ')).toEqual(['9'])
    expect(tree.props.get('GM')).toEqual(['1'])
    // el nodo raíz tiene un hijo (;B[aa])
    expect(tree.children).toHaveLength(1)
  })

  it('parsea variaciones múltiples en el primer nivel', () => {
    const sgf = '(;GM[1]SZ[9]PL[B](;B[aa]C[Correct!])(;B[bb]C[Wrong!]))'
    const tree = parseSgfTree(sgf)
    expect(tree.children).toHaveLength(2)
    expect(tree.children[0].props.get('C')).toEqual(['Correct!'])
    expect(tree.children[1].props.get('C')).toEqual(['Wrong!'])
  })

  it('parsea una secuencia de jugadas en la variación principal', () => {
    const sgf = '(;GM[1]SZ[9];B[aa];W[bb];B[cc])'
    const tree = parseSgfTree(sgf)
    // raíz → hijo B[aa] → hijo W[bb] → hijo B[cc]
    const move1 = tree.children[0]
    const move2 = move1.children[0]
    expect(move1.props.get('B')).toEqual(['aa'])
    expect(move2.props.get('W')).toEqual(['bb'])
  })
})

describe('findVariation', () => {
  it('encuentra el hijo correcto por coordenada y color', () => {
    const sgf = '(;SZ[9](;B[aa]C[Correct!])(;B[bb]C[Wrong!]))'
    const tree = parseSgfTree(sgf)
    const { child, isMain } = findVariation(tree, 'aa', 'B')
    expect(child).toBeTruthy()
    expect((child.props.get('C') ?? [])[0]).toBe('Correct!')
    expect(isMain).toBe(true)
  })

  it('devuelve null si la jugada no existe en ninguna variación', () => {
    const sgf = '(;SZ[9](;B[aa])(;B[bb]))'
    const tree = parseSgfTree(sgf)
    const { child } = findVariation(tree, 'zz', 'B')
    expect(child).toBeNull()
  })

  it('isMain=false para variación no principal', () => {
    const sgf = '(;SZ[9](;B[aa])(;B[bb]))'
    const tree = parseSgfTree(sgf)
    const { isMain } = findVariation(tree, 'bb', 'B')
    expect(isMain).toBe(false)
  })
})

describe('nodeMove', () => {
  it('extrae el primer movimiento de un nodo', () => {
    const sgf = '(;B[cc])'
    const tree = parseSgfTree(sgf)
    const m = nodeMove(tree)
    expect(m).toEqual({ color: 'B', coord: 'cc' })
  })

  it('devuelve null para nodo sin movimiento', () => {
    const tree = parseSgfTree('(;SZ[9]C[Solo propiedades])')
    const m = nodeMove(tree)
    expect(m).toBeNull()
  })
})

// ── SgfParser ─────────────────────────────────────────────────────────────────

describe('parseSgf', () => {
  it('extrae boardSize, playerToMove y piedras iniciales', () => {
    const sgf = '(;FF[4]GM[1]SZ[9]PL[B]AB[cc][dd]AW[ee])'
    const p = parseSgf(sgf)
    expect(p.boardSize).toBe(9)
    expect(p.playerToMove).toBe('B')
    expect(p.blackStones).toContain('cc')
    expect(p.blackStones).toContain('dd')
    expect(p.whiteStones).toContain('ee')
  })

  it('por defecto boardSize 9 si no hay SZ', () => {
    const p = parseSgf('(;GM[1];B[aa])')
    expect(p.boardSize).toBe(9)
  })

  it('infiere playerToMove del primer movimiento si no hay PL', () => {
    const p = parseSgf('(;GM[1]SZ[9];W[aa])')
    expect(p.playerToMove).toBe('W')
  })

  it('extrae el comentario C del nodo raíz', () => {
    const p = parseSgf('(;SZ[9]C[Negras juegan.]AB[aa])')
    expect(p.comment).toBe('Negras juegan.')
  })
})

// ── TsumegoController ─────────────────────────────────────────────────────────

const SIMPLE_SGF = `(;GM[1]SZ[9]PL[B]
  AB[bb][cb][bc]AW[cc]
  (;B[cd]C[Correct!])
  (;B[dc]C[Wrong!])
)`

function makeCtrl(sgf = SIMPLE_SGF) {
  const p = parseSgf(sgf)
  return new TsumegoController({
    boardSize: p.boardSize,
    blackStones: p.blackStones,
    whiteStones: p.whiteStones,
    playerToMove: p.playerToMove,
    sgf,
  })
}

describe('TsumegoController — solve', () => {
  it('estado inicial: modo solve, sin resultado', () => {
    const ctrl = makeCtrl()
    expect(ctrl.mode).toBe('solve')
    expect(ctrl.result).toBeNull()
    expect(ctrl.currentStep).toBe(0)
  })

  it('handleMove con jugada correcta → classification correct', () => {
    const ctrl = makeCtrl()
    const res = ctrl.handleMove('cd')
    expect(res.classification).toBe('correct')
    expect(ctrl.currentStep).toBe(1)
  })

  it('handleMove con jugada incorrecta → classification wrong', () => {
    const ctrl = makeCtrl()
    const res = ctrl.handleMove('dc')
    expect(res.classification).toBe('wrong')
    expect(ctrl._pathCorrect).toBe(false)
  })

  it('variación neutral (sin marcador) marca el camino como incorrecto', () => {
    // SGF con RIGHT en primera variación, segunda sin comentario (neutral)
    // El jugador elige la variación neutral → debe resultar en wrong
    const sgf = `(;SZ[9]PL[B]AB[aa](;B[bb]C[RIGHT])(;B[cc]))`
    const ctrl = makeCtrl(sgf)
    ctrl.handleMove('cc')  // variación neutral
    expect(ctrl._pathCorrect).toBe(false)
    ctrl.finalizeResult()
    expect(ctrl.result).toBe('wrong')
  })

  it('handleMove con jugada no contemplada → wrong_unknown y freeMode', () => {
    const ctrl = makeCtrl()
    const res = ctrl.handleMove('aa')
    expect(res.classification).toBe('wrong_unknown')
    expect(ctrl.freeMode).toBe(true)
  })

  it('finalizeResult devuelve correct si el camino fue correcto', () => {
    const ctrl = makeCtrl()
    ctrl.handleMove('cd')
    ctrl.finalizeResult()
    expect(ctrl.result).toBe('correct')
  })

  it('finalizeResult devuelve wrong si se jugó una variación incorrecta', () => {
    const ctrl = makeCtrl()
    ctrl.handleMove('dc')
    ctrl.finalizeResult()
    expect(ctrl.result).toBe('wrong')
  })

  it('isSequenceEnd tras última jugada de la variación', () => {
    const ctrl = makeCtrl()
    ctrl.handleMove('cd')
    expect(ctrl.isSequenceEnd()).toBe(true)
  })

  it('getBoardState refleja las piedras tras la jugada', () => {
    const ctrl = makeCtrl()
    ctrl.handleMove('cd')
    const { blackStones } = ctrl.getBoardState()
    expect(blackStones).toContain('cd')
  })
})

describe('TsumegoController — getAnnotations', () => {
  it('posición inicial muestra jugadas correctas e incorrectas', () => {
    const ctrl = makeCtrl()
    const ann = ctrl.getAnnotations()
    expect(ann.correctMoves).toContain('cd')
    expect(ann.wrongMoves).toContain('dc')
    expect(ann.lastMove).toBeNull()
  })

  it('tras una jugada, lastMove coincide con la coordenada jugada', () => {
    const ctrl = makeCtrl()
    ctrl.handleMove('cd')
    const ann = ctrl.getAnnotations()
    expect(ann.lastMove).toBe('cd')
  })
})

describe('TsumegoController — navegación review', () => {
  it('stepBack y stepForward navegan el historial', () => {
    const ctrl = makeCtrl()
    ctrl.handleMove('cd')
    ctrl.finalizeResult()
    ctrl.enterReview()

    expect(ctrl.currentStep).toBe(1)
    ctrl.stepBack()
    expect(ctrl.currentStep).toBe(0)
    ctrl.stepForward()
    expect(ctrl.currentStep).toBe(1)
  })

  it('resetToStart vuelve al inicio', () => {
    const ctrl = makeCtrl()
    ctrl.handleMove('cd')
    ctrl.enterReview()
    ctrl.resetToStart()
    expect(ctrl.currentStep).toBe(0)
  })

  it('goToEnd va al final del historial', () => {
    const ctrl = makeCtrl()
    ctrl.handleMove('cd')
    ctrl.enterReview()
    ctrl.resetToStart()
    ctrl.goToEnd()
    expect(ctrl.currentStep).toBe(ctrl.totalSteps)
  })

  it('canStepBack y canStepForward reflejan los límites', () => {
    const ctrl = makeCtrl()
    ctrl.handleMove('cd')
    ctrl.enterReview()
    expect(ctrl.canStepBack).toBe(true)
    expect(ctrl.canStepForward).toBe(false)
    ctrl.resetToStart()
    expect(ctrl.canStepBack).toBe(false)
    expect(ctrl.canStepForward).toBe(true)
  })
})

describe('TsumegoController — clasificación sin marcadores explícitos', () => {
  it('_treeHasMarkers=false cuando ninguna variación tiene marcadores', () => {
    const sgf = '(;SZ[9]PL[B]AB[aa](;B[bb])(;B[cc]))'
    const ctrl = makeCtrl(sgf)
    expect(ctrl._treeHasMarkers).toBe(false)
  })

  it('sin marcadores, la línea principal (primera variación) se clasifica como correct', () => {
    const sgf = '(;SZ[9]PL[B]AB[aa](;B[bb])(;B[cc]))'
    const ctrl = makeCtrl(sgf)
    const ann = ctrl.getAnnotations()
    expect(ann.correctMoves).toContain('bb')
    expect(ann.neutralMoves).toContain('cc')
  })

  it('_treeHasMarkers=true cuando hay marcadores en alguna variación', () => {
    const ctrl = makeCtrl(SIMPLE_SGF)
    expect(ctrl._treeHasMarkers).toBe(true)
  })

  it('un marcador solo en el nodo final ilumina también los pasos previos del camino', () => {
    // La secuencia principal (bb -> dd) solo lleva "Correct!" en el nodo final;
    // el paso intermedio (bb) no tiene comentario propio pero debe heredar
    // la clasificación de su línea principal, no quedar en 'neutral'.
    const sgf = '(;SZ[9]PL[B]AB[aa]' +
      '(;B[bb];W[cc];B[dd]C[Correct!])' +
      '(;B[ee]C[Wrong]))'
    const ctrl = makeCtrl(sgf)
    const first = ctrl.getAnnotations()
    expect(first.correctMoves).toContain('bb')
    expect(first.wrongMoves).toContain('ee')
  })
})

describe('TsumegoController — respuesta del oponente', () => {
  const SGF_WITH_RESPONSE = `(;SZ[9]PL[B]AB[aa]AW[ba]
    (;B[ca]C[Correct!];W[da])
  )`

  it('hasOpponentResponse devuelve true si el nodo actual tiene respuesta', () => {
    const ctrl = makeCtrl(SGF_WITH_RESPONSE)
    ctrl.handleMove('ca')
    expect(ctrl.hasOpponentResponse()).toBe(true)
  })

  it('playOpponentResponse avanza el tablero con la jugada del oponente', () => {
    const ctrl = makeCtrl(SGF_WITH_RESPONSE)
    ctrl.handleMove('ca')
    const resp = ctrl.playOpponentResponse()
    expect(resp).toBeTruthy()
    expect(resp.coord).toBe('da')
    expect(ctrl.currentStep).toBe(2)
  })
})
