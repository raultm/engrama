/**
 * Genera tsumego-basicos.sgf.
 * Cada posición se verifica con GoEngine antes de escribirla.
 *
 * Uso:  node scripts/generate-tsumego-seed.mjs
 */

import { writeFile, mkdir } from 'fs/promises'
import { join, dirname }    from 'path'
import { fileURLToPath }    from 'url'
import { GoEngine }         from '../src/domain/sgf/GoEngine.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Helpers ───────────────────────────────────────────────────────────────
const s   = (c, r) => String.fromCharCode(96 + c) + String.fromCharCode(96 + r)
const S   = (pairs) => pairs.map(([c,r]) => s(c,r))
const P   = (name, coords) => coords.length ? name + coords.map(c=>`[${c}]`).join('') : ''

/** Verifica que jugar `move` con `color` capture exactamente los `expected` coords */
function verify(boardSize, black, white, moveColor, moveCoord, expectedCaptures) {
  const eng = new GoEngine(boardSize, S(black), S(white))
  const captured = eng.place(moveCoord, moveColor)
  const capSet   = new Set(captured)
  const expSet   = new Set(expectedCaptures)
  const ok       = expSet.size === capSet.size && [...expSet].every(c => capSet.has(c))
  if (!ok) {
    console.error(`✗ Verificación fallida para jugada ${moveCoord}:`)
    console.error(`  Capturadas: [${[...capSet]}]`)
    console.error(`  Esperadas:  [${[...expSet]}]`)
    process.exit(1)
  }
  return true
}

/** Construye el SGF de un problema con variaciones */
function buildSgf({ comment, boardSize, black, white, player = 'B', lines }) {
  const bC = S(black), wC = S(white)
  const root = [
    `FF[4]GM[1]SZ[${boardSize}]`,
    `C[${comment}]`,
    `PL[${player}]`,
    P('AB', bC), P('AW', wC),
  ].filter(Boolean).join('')

  const mkLine = (moves, note) => {
    const seq = moves.map(([p,c,r]) => `;${p}[${s(c,r)}]`).join('')
    return `(${seq}\nC[${note}])`
  }

  const variations = [
    mkLine(lines.correct.moves, lines.correct.note),
    ...(lines.wrong ?? []).map(w => mkLine(w.moves, w.note)),
  ].join('\n')

  return `(;${root}\n${variations})`
}

// ════════════════════════════════════════════════════════════════════════════
//  PROBLEMAS — posiciones verificadas con GoEngine
// ════════════════════════════════════════════════════════════════════════════

const problems = []

// ── 1. Captura piedra solitaria ──────────────────────────────────────────
// W en cc(3,3). B rodea bc(2,3),dc(4,3),cb(3,2). Falta cd(3,4).
// Verificar: B[cd] captura cc.
verify(9, [[2,3],[4,3],[3,2]], [[3,3]], 'B', s(3,4), [s(3,3)])
problems.push(buildSgf({
  comment:   'Negras juegan. La piedra blanca tiene una sola libertad — captúrala.',
  boardSize: 9,
  black:     [[2,3],[4,3],[3,2]],
  white:     [[3,3]],
  lines: {
    correct: {
      moves: [['B',3,4]],
      note:  '¡Correcto! La piedra blanca queda sin libertades y es capturada.',
    },
    wrong: [
      { moves: [['B',1,1]], note: 'Incorrecto — la blanca aún tiene libertad en C4.' },
    ],
  },
}))

// ── 2. Punto vital del grupo en L ────────────────────────────────────────
// W: aa(1,1),ba(2,1),ab(1,2). B: ca(3,1),ac(1,3). Solo queda bb(2,2) libre.
// Verificar: B[bb] captura aa,ba,ab.
verify(9, [[3,1],[1,3]], [[1,1],[2,1],[1,2]], 'B', s(2,2), [s(2,1),s(1,1),s(1,2)])
problems.push(buildSgf({
  comment:   'Negras juegan. Encuentra el punto vital para matar el grupo en L de las blancas.',
  boardSize: 9,
  black:     [[3,1],[1,3]],
  white:     [[1,1],[2,1],[1,2]],
  lines: {
    correct: {
      moves: [['B',2,2]],
      note:  '¡Correcto! B2 es el punto vital. El grupo queda sin libertades y muere.',
    },
    wrong: [
      { moves: [['B',3,2]], note: 'Incorrecto — las blancas aún pueden hacer ojo en B2.' },
    ],
  },
}))

// ── 3. Captura dos piedras secuencialmente (B,B) ─────────────────────────
// W: cb(3,2),db(4,2). B rodea: ba(2,1),ca(3,1),ea(5,1),eb(5,2),cc(3,3),bc(2,3),bb(2,2).
// Libertades W: da(4,1) y dc(4,3). B rellena ambas (sin respuesta W).
// Verificar paso 1: B[da] no captura (W aún tiene dc).
// Verificar paso 2: después de B[da], B[dc] captura cb,db.
{
  const eng = new GoEngine(9, S([[2,1],[3,1],[5,1],[5,2],[3,3],[2,3],[2,2]]), S([[3,2],[4,2]]))
  eng.place(s(4,1), 'B')
  const c2 = eng.place(s(4,3), 'B')
  if (!new Set(c2).has(s(3,2)) || !new Set(c2).has(s(4,2))) {
    console.error('✗ Problema 3: captura no funciona'); process.exit(1)
  }
  console.log('✓ P3 verificado')
}
problems.push(buildSgf({
  comment:   'Negras juegan. El grupo blanco tiene dos libertades. Rellénalas para capturarlo.',
  boardSize: 9,
  black:     [[2,1],[3,1],[5,1],[5,2],[3,3],[2,3],[2,2]],
  white:     [[3,2],[4,2]],
  lines: {
    correct: {
      moves: [['B',4,1],['B',4,3]],
      note:  '¡Correcto! Has capturado las dos piedras blancas.',
    },
    wrong: [
      { moves: [['B',4,3],['B',4,1]], note: '¡También correcto! El orden inverso funciona igual.' },
      { moves: [['B',1,9]], note: 'Incorrecto — el grupo blanco escapa.' },
    ],
  },
}))

// ── 4. Captura grupo en T (1 movimiento) ─────────────────────────────────
// W: cc(3,3),dc(4,3),bc(2,3). B rodea: bb(2,2),cb(3,2),db(4,2),eb(5,2),
//    ac(1,3),ec(5,3),bd(2,4),cd(3,4),dd(4,4). Libre: da(4,1)... no.
// Intentar otro enfoque: W en fila de 3 con 1 libertad.
// W: ba(2,1),ca(3,1),da(4,1). B rodea: aa(1,1),ea(5,1),bb(2,2),cb(3,2),db(4,2).
// W lib:
//   ba: aa[B],ca[W],bb[B] → 0
//   ca: ba[W],da[W],cb[B] → 0
//   da: ca[W],ea[B],db[B] → 0
// 0 libertades. Demasiado rodeadas.
// Quitar cb de B. B: aa,ea,bb,db.
//   ca: ba[W],da[W],cb[libre] → lib: cb!
// 1 libertad: cb. B[cb] captura todo.
verify(9, [[1,1],[5,1],[2,2],[4,2]], [[2,1],[3,1],[4,1]], 'B', s(3,2), [s(2,1),s(3,1),s(4,1)])
problems.push(buildSgf({
  comment:   'Negras juegan. El grupo de tres piedras en línea tiene una sola libertad. Captúralo.',
  boardSize: 9,
  black:     [[1,1],[5,1],[2,2],[4,2]],
  white:     [[2,1],[3,1],[4,1]],
  lines: {
    correct: {
      moves: [['B',3,2]],
      note:  '¡Correcto! C2 era la única libertad. Has capturado las tres piedras.',
    },
    wrong: [
      { moves: [['B',3,1]], note: 'Incorrecto — C1 ya está ocupado por blancas.' },
    ],
  },
}))

// ── 5. Escapada bloqueada — B cierra, W responde, B remata ───────────────
// W: ec(5,3) intentará escapar a ed(5,4) cuando B[fc] bloquee.
// Setup: W en ec(5,3). B rodea: dc(4,3),gc(7,3),eb(5,2),ed(5,4).
// W lib: fc(6,3).
// B[fc] → W capturada directamente (1 mov). No hay respuesta.
// Para tener respuesta W, necesito que W tenga 2 libs con una "escapada".
// W: ec,fc. B rodea: dc,gc,eb,ed,fb,fd. Libs: ee? No.
//   ec: dc[B],fc[W],eb[B],ed[B] → 0 desde ec
//   fc: ec[W],gc[B],fb[B],fd[B] → 0 desde fc
// 0 libs. Quitar dc de B.
// B: gc,eb,ed,fb,fd. W: ec,fc.
//   ec: dc[libre],fc[W],eb[B],ed[B] → lib: dc
//   fc: ec[W],gc[B],fb[B],fd[B] → 0
// 1 lib: dc. 1 mov.
// Para 2 libs quitar también gc de B.
// B: eb,ed,fb,fd. W: ec,fc.
//   ec: dc[libre],fc[W],eb[B],ed[B] → lib: dc
//   fc: ec[W],gc[libre],fb[B],fd[B] → lib: gc
// 2 libs: dc y gc. B rellena ambas en secuencia (B,B sin respuesta W).
// Verificar:
{
  const eng = new GoEngine(9, S([[5,2],[5,4],[6,2],[6,4]]), S([[5,3],[6,3]]))
  eng.place(s(4,3), 'B')
  const c = eng.place(s(7,3), 'B')
  if (!new Set(c).has(s(5,3))) { console.error('✗ P5 fail'); process.exit(1) }
  console.log('✓ P5 verificado')
}
problems.push(buildSgf({
  comment:   'Negras juegan. Cierra las dos libertades del grupo blanco para capturarlo.',
  boardSize: 9,
  black:     [[5,2],[5,4],[6,2],[6,4]],
  white:     [[5,3],[6,3]],
  lines: {
    correct: {
      moves: [['B',4,3],['B',7,3]],
      note:  '¡Correcto! Has capturado el grupo de dos piedras.',
    },
    wrong: [
      { moves: [['B',7,3],['B',4,3]], note: '¡También correcto! El orden inverso funciona igual.' },
      { moves: [['B',1,9]], note: 'Incorrecto — las blancas escapan.' },
    ],
  },
}))

// ── 6. Secuencia B→W→B con captura real ─────────────────────────────────
// Diseño: W tiene una piedra "puenteada" entre dos grupos B que no puede escapar.
// W: ee(5,5). B rodea de,fe,ef,ed — W tiene 0 libs. Quitar ed.
// B: de(4,5),fe(6,5),ef(5,6). W: ee(5,5). W lib: ed(5,4).
// B[ed] → captura ee. 1 mov.
// Para B→W→B: W tiene 2 libs. W responde en una lib (sin escapar de verdad porque
// al jugar la "respuesta" W no puede salvarse).
// W: de(4,5),ee(5,5). B rodea: ce,fe,dd,ed,ef,df. W lib:
//   de: ce[B],ee[W],dd[B],df[B] → 0
//   ee: de[W],fe[B],ed[B],ef[B] → 0
// 0 libs. Quitar ed y df de B. B: ce,fe,dd,ef.
//   de: ce[B],ee[W],dd[B],df[libre] → lib: df
//   ee: de[W],fe[B],ed[libre],ef[B] → lib: ed
// 2 libs: df y ed.
// Secuencia: B[df] → W ya tiene 1 lib ed → (sin respuesta W) → B[ed] → captura.
// Pero ¿qué respuesta W lógica tendría entre B[df] y B[ed]?
// W podría jugar en df antes de B… pero ya B está en df.
//
// Para W respondiendo: W juega en otro lugar (inútil) o W intenta capturar a B.
// Si W[dd]... pero dd es B. No puede jugar en punto ocupado.
// W no tiene jugadas útiles. Así que la secuencia es B-B sin respuesta.
//
// Conclusión: para el seed de demo, la "respuesta W" en el SGF no es necesaria
// para los problemas básicos. El motor muestra capturas cuando ocurren.
// Los problemas 1-5 ya demuestran bien la captura.
// Problema 6 será una posición un poco más grande (grupo de 4).
// W: dd,ed,de,ee (cuadrado 2x2). B rodea exterior.
// B: cd,fd,ce,fe,dc,ec,df,ef,dg,eg,cf,ff.
// W lib de dd: cd[B],ed[W],dc[B],de[W] → 0
// W lib de ed: dd[W],fd[B],ec[B],ee[W] → 0
// W lib de de: dd[W],ee[W],ce[B],df[B] → 0
// W lib de ee: ed[W],fe[B],de[W],ef[B] → 0
// 0 libertades. Completamente rodeado desde el inicio.
// Dejar 2 libertades: quitar dc y ef de B.
// B: cd,fd,ce,fe,ec,df,dg,eg,cf,ff.
// W lib:
//   dd: cd[B],ed[W],dc[libre],de[W] → lib: dc
//   ed: dd[W],fd[B],ec[B],ee[W] → 0
//   de: dd[W],ee[W],ce[B],df[B] → 0
//   ee: ed[W],fe[B],de[W],ef[libre] → lib: ef
// 2 libs: dc y ef. B rellena ambas en 2 movimientos.
{
  const eng = new GoEngine(9,
    S([[3,4],[6,4],[3,5],[6,5],[5,3],[4,6],[5,7],[4,7],[3,6],[6,6]]),
    S([[4,4],[5,4],[4,5],[5,5]])
  )
  eng.place(s(4,3), 'B')
  const c = eng.place(s(5,6), 'B')
  if (c.length !== 4) { console.error('✗ P6 fail, captured:', c); process.exit(1) }
  console.log('✓ P6 verificado')
}
problems.push(buildSgf({
  comment:   'Negras juegan. El cuadrado blanco tiene dos libertades. Captúralo en dos movimientos.',
  boardSize: 9,
  black:     [[3,4],[6,4],[3,5],[6,5],[5,3],[4,6],[5,7],[4,7],[3,6],[6,6]],
  white:     [[4,4],[5,4],[4,5],[5,5]],
  lines: {
    correct: {
      moves: [['B',4,3],['B',5,6]],
      note:  '¡Correcto! Has capturado el grupo de cuatro piedras.',
    },
    wrong: [
      { moves: [['B',5,6],['B',4,3]], note: '¡También correcto! El orden inverso funciona igual.' },
      { moves: [['B',1,9]], note: 'Incorrecto — el grupo blanco escapa.' },
    ],
  },
}))

// ── 7. Ko — Problema avanzado (B→W captura→B recaptura) ─────────────────
// Secuencia real con respuesta W:
// W: bb(2,2) — piedra con 1 libertad tras rodeo B.
// B rodea: ab,ba,bc — W lib: cb.
// B[cb] → captura bb. (No hay respuesta W — solo 1 mov)
//
// Para que W RESPONDA (capture), necesito que B haga un sacrificio
// que W captura, y luego B recaptura el grupo completo.
//
// Snapback verificado:
// Stage 0 (inicial): W: ab(1,2),bb(2,2). B rodea: aa,ba,bc,cb,ac.
// W{ab,bb} lib:
//   ab: aa[B],bb[W],ac[B] y borde izq. → 0 desde ab
//   bb: ba[B],ab[W],bc[B],cb[B] → 0 desde bb
// 0 libs antes de B[?]. No funciona.
//
// Snapback correcto en Go requiere geometría específica.
// Para el seed demos, el problema 7 será una lección de "atari doble"
// donde B juega un movimiento que ataca dos grupos W simultáneamente.
//
// W: be(2,5) y W: de(4,5) — dos piedras separadas.
// B rodea: ae,ce,bf,df — W libs: bd(2,4),bb(2,2)? No.
//   be: ae[B],ce[B],bf[B],bd[libre] → lib: bd
//   de: ce[B],ee[libre],df[B],dd[libre] → libs: ee,dd
// Las 2 W no están conectadas y tienen distintas libertades.
// B[ce] ya es B. Hmm.
//
// Doble ataque (B atacha 2 grupos con 1 jugada):
// W: bc(2,3) y W: dc(4,3). B rodea ambas dejando cc(3,3) como punto que conecta los 2 ataris.
// W{bc} lib: ac[libre],cc[libre],bb[libre],bd[libre]. Muchas libs.
// Demasiado abierto.
//
// PROBLEMA 7 FINAL: Versión simple de B→W→B
// W tiene 1 piedra. B hace "escalera de 2 movimientos":
// B pone en atari, W "escapa" (según SGF), B cierra.
// Aunque W no se salve realmente, el SGF dicta la respuesta W para demo.
//
// W: ee(5,5). B rodea de,fe,ef — lib: ed(5,4).
// B[ed] captura ee directamente. 1 mov.
//
// Para B→W→B: W tiene 2 libs (ed y una más). Necesito quitar fe de B.
// B: de,ef. W: ee. Lib: ed y fe→libre.
//   ee: de[B],fe[libre],ef[B],ed[libre] → libs: fe,ed
// B[ed] → W lib: fe → B[fe] → captura.
// W respuesta entre los 2 B: ninguna (W no tiene jugada útil).
//
// Para forzar respuesta W en SGF: W intenta escapar a gf(7,6).
// Pero gf no es vecino de ee. W no puede jugar ahí (no conecta con ee).
// En Go un jugador puede jugar EN CUALQUIER PARTE del tablero aunque no conecte.
// Así que W[gf] sería un movimiento "otro lugar" que el motor auto-jugaría.
//
// SGF: (;B[ed] ;W[gf] ;B[fe] C[Correcto — has cerrado el grupo aunque W jugó en otro lugar])
//
// ¿Funciona con el motor? Después de B[ed]: W lib en fe. W juega gf (irrelevante).
// Motor auto-juega W[gf]. Luego B[fe] → W{ee} capturada. ✓
//
verify(9, S([[4,5],[5,6]]), S([[5,5]]), 'B', s(5,4), [])  // B[ed] no captura (fe libre)
{
  const eng = new GoEngine(9, S([[4,5],[5,6],[5,4],[7,6]]), S([[5,5]]))
  const c = eng.place(s(6,5), 'B')
  if (!new Set(c).has(s(5,5))) { console.error('✗ P7 fail'); process.exit(1) }
  console.log('✓ P7 verificado')
}
problems.push(buildSgf({
  comment:   'Negras juegan. Pon la piedra blanca en atari y cierra la escapada aunque intente huir.',
  boardSize: 9,
  black:     [[4,5],[5,6]],
  white:     [[5,5]],
  lines: {
    correct: {
      // B[ed] → pone ee en atari → W[gf] intenta "huir" (irrelevante) → B[fe] captura
      moves: [['B',5,4],['W',7,6],['B',6,5]],
      note:  '¡Correcto! Has capturado la piedra blanca aunque las blancas intentaran huir.',
    },
    wrong: [
      { moves: [['B',6,5]], note: 'Incorrecto — la blanca puede escapar por E4 antes de que la captures.' },
    ],
  },
}))

// ════════════════════════════════════════════════════════════════════════════

const sgfContent = problems.join('\n\n')
const outDir  = join(__dirname, '..', 'public', 'seeds')
const outPath = join(outDir, 'tsumego-basicos.sgf')
await mkdir(outDir, { recursive: true })
await writeFile(outPath, sgfContent, 'utf8')

console.log(`\n✓  ${outPath}`)
console.log(`   ${problems.length} problemas generados y verificados.`)
