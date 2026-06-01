/**
 * Genera un archivo .apkg de prueba con tres tipos de tarjeta:
 *   - Basic (pregunta/respuesta)
 *   - Cloze (rellena el hueco)
 *   - Image Occlusion Enhanced (5 capas de la atmósfera)
 *
 * Uso: node scripts/generate-test-apkg.mjs
 * Salida: public/seeds/test-atmosfera.apkg
 */

import initSqlJs from 'sql.js'
import JSZip from 'jszip'
import { createHash } from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const now = Math.floor(Date.now() / 1000)
const base = Date.now()

// ── Image: Capas de la atmósfera (SVG 460×350) ────────────────────────────
// Cada capa: banda de color con el nombre centrado (cubierto por las máscaras)
// + columna derecha con altitudes

const W = 460   // ancho total de la imagen
const LW = 360  // ancho de la zona de bandas (izquierda)
const RW = 100  // ancho columna altitudes (derecha)
const H = 350   // alto total
const BH = 70   // alto de cada banda

const LAYERS = [
  { name: 'Troposfera',   y: 280, fill: '#2b6cb0', textFill: '#ffffff', alt: '0 – 12 km'   },
  { name: 'Estratosfera', y: 210, fill: '#3182ce', textFill: '#ffffff', alt: '12 – 50 km'  },
  { name: 'Mesosfera',    y: 140, fill: '#63b3ed', textFill: '#1a365d', alt: '50 – 80 km'  },
  { name: 'Termosfera',   y:  70, fill: '#90cdf4', textFill: '#1a365d', alt: '80 – 700 km' },
  { name: 'Exosfera',     y:   0, fill: '#bee3f8', textFill: '#2c5282', alt: '> 700 km'    },
]

function buildAtmosphereSvg() {
  const bands = LAYERS.map(l => `
  <rect x="0" y="${l.y}" width="${LW}" height="${BH}" fill="${l.fill}"/>
  <text x="${LW / 2}" y="${l.y + BH / 2 + 7}" text-anchor="middle"
        fill="${l.textFill}" font-family="sans-serif" font-size="20" font-weight="bold"
        letter-spacing="0.5">${l.name}</text>
  <rect x="${LW}" y="${l.y}" width="${RW}" height="${BH}" fill="#f7fafc" stroke="#e2e8f0"/>
  <text x="${LW + RW / 2}" y="${l.y + BH / 2 + 5}" text-anchor="middle"
        fill="#718096" font-family="sans-serif" font-size="12">${l.alt}</text>`).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect x="0" y="0" width="${W}" height="${H}" fill="#edf2f7"/>
  ${bands}
  <rect x="0" y="0" width="${LW}" height="${H}" fill="none" stroke="#2c5282" stroke-width="2"/>
  <text x="${LW / 2}" y="16" text-anchor="middle" fill="#2d3748"
        font-family="sans-serif" font-size="12" font-weight="bold">CAPAS DE LA ATMÓSFERA</text>
</svg>`
}

// ── Occlusion SVG: máscaras sobre los nombres de cada capa ────────────────
// viewBox debe coincidir con las dimensiones de la imagen (W × H)
// Orden: igual que LAYERS (Troposfera = rect[0], Exosfera = rect[4])
// El parser de AnkiImporter usa shapes[ord] para saber qué máscara testa cada carta.

function buildOcclusionSvg() {
  const MASK_PAD = 8
  const rects = LAYERS.map((l, i) => {
    const mx = MASK_PAD
    const my = l.y + MASK_PAD
    const mw = LW - 2 * MASK_PAD
    const mh = BH - 2 * MASK_PAD
    return `  <rect id="${i}" x="${mx}" y="${my}" width="${mw}" height="${mh}"
           fill="#2D3748" stroke="#4A5568" stroke-width="1">
    <title>${l.name}</title>
  </rect>`
  }).join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">\n${rects}\n</svg>`
}

// ── Anki IDs & GUIDs ──────────────────────────────────────────────────────

function csum(str) {
  return parseInt(createHash('sha1').update(str).digest('hex').slice(0, 8), 16)
}

function guid() {
  return Math.random().toString(36).slice(2, 12)
}

// ── Model definitions ─────────────────────────────────────────────────────

const MID_BASIC  = '1000000001'
const MID_CLOZE  = '1000000002'
const MID_IO     = '1000000003'
const DID        = '1000000100'

function makeModels() {
  const fld = (name, ord) => ({
    name, ord, sticky: false, rtl: false, font: 'Arial', size: 20, media: [],
  })

  return {
    [MID_BASIC]: {
      id: MID_BASIC, name: 'Basic', type: 0,
      mod: now, usn: -1, sortf: 0, did: null,
      flds: [fld('Front', 0), fld('Back', 1)],
      tmpls: [{ name: 'Card 1', ord: 0, qfmt: '{{Front}}',
                afmt: '{{FrontSide}}<hr id=answer>{{Back}}',
                did: null, bqfmt: '', bafmt: '' }],
      css: '.card{font-family:arial;font-size:20px}',
      latexPre: '', latexPost: '', latexsvg: false,
      req: [[0, 'any', [0]]],
    },

    [MID_CLOZE]: {
      id: MID_CLOZE, name: 'Cloze', type: 1,
      mod: now, usn: -1, sortf: 0, did: null,
      flds: [fld('Text', 0), fld('Extra', 1)],
      tmpls: [{ name: 'Cloze', ord: 0, qfmt: '{{cloze:Text}}',
                afmt: '{{cloze:Text}}<br>{{Extra}}',
                did: null, bqfmt: '', bafmt: '' }],
      css: '.card{font-family:arial;font-size:20px}.cloze{font-weight:bold;color:blue}',
      latexPre: '', latexPost: '', latexsvg: false,
      req: [[0, 'any', [0]]],
    },

    [MID_IO]: {
      id: MID_IO, name: 'Image Occlusion Enhanced', type: 0,
      mod: now, usn: -1, sortf: 0, did: null,
      flds: [
        fld('id', 0), fld('Header', 1), fld('Image', 2),
        fld('Footer', 3), fld('Remarks', 4), fld('Sources', 5),
        fld('SVG', 6), fld('Tags', 7),
      ],
      tmpls: LAYERS.map((_, i) => ({
        name: `Card ${i + 1}`, ord: i,
        qfmt: '{{Image}}', afmt: '{{FrontSide}}<hr>{{Header}}',
        did: null, bqfmt: '', bafmt: '',
      })),
      css: '.card{font-family:arial;font-size:20px}',
      latexPre: '', latexPost: '', latexsvg: false,
      req: LAYERS.map((_, i) => [i, 'any', [2]]),
    },
  }
}

function makeDecks() {
  const base = { mod: now, usn: -1, lrnToday: [0,0], revToday: [0,0],
                  newToday: [0,0], timeToday: [0,0], collapsed: false, dyn: 0, conf: 1 }
  return {
    '1': { ...base, id: 1, name: 'Default', desc: '' },
    [DID]: {
      ...base,
      id: parseInt(DID),
      name: 'Engrama - Capas de la Atmósfera',
      desc: 'Mazo de prueba: tarjetas básicas, cloze y oclusión de imagen.',
    },
  }
}

// ── SQLite schema ─────────────────────────────────────────────────────────

function createSchema(db) {
  db.run(`CREATE TABLE col (
    id INTEGER PRIMARY KEY, crt INTEGER NOT NULL, mod INTEGER NOT NULL,
    scm INTEGER NOT NULL, ver INTEGER NOT NULL, dty INTEGER NOT NULL,
    usn INTEGER NOT NULL, ls INTEGER NOT NULL, conf TEXT NOT NULL,
    models TEXT NOT NULL, decks TEXT NOT NULL, dconf TEXT NOT NULL,
    tags TEXT NOT NULL)`)

  db.run(`CREATE TABLE notes (
    id INTEGER PRIMARY KEY, guid TEXT NOT NULL, mid INTEGER NOT NULL,
    mod INTEGER NOT NULL, usn INTEGER NOT NULL, tags TEXT NOT NULL,
    flds TEXT NOT NULL, sfld INTEGER NOT NULL, csum INTEGER NOT NULL,
    flags INTEGER NOT NULL, data TEXT NOT NULL)`)

  db.run(`CREATE TABLE cards (
    id INTEGER PRIMARY KEY, nid INTEGER NOT NULL, did INTEGER NOT NULL,
    ord INTEGER NOT NULL, mod INTEGER NOT NULL, usn INTEGER NOT NULL,
    type INTEGER NOT NULL, queue INTEGER NOT NULL, due INTEGER NOT NULL,
    ivl INTEGER NOT NULL, factor INTEGER NOT NULL, reps INTEGER NOT NULL,
    lapses INTEGER NOT NULL, left INTEGER NOT NULL, odue INTEGER NOT NULL,
    odid INTEGER NOT NULL, flags INTEGER NOT NULL, data TEXT NOT NULL)`)

  db.run(`CREATE TABLE revlog (
    id INTEGER PRIMARY KEY, cid INTEGER NOT NULL, usn INTEGER NOT NULL,
    ease INTEGER NOT NULL, ivl INTEGER NOT NULL, lastIvl INTEGER NOT NULL,
    factor INTEGER NOT NULL, time INTEGER NOT NULL, type INTEGER NOT NULL)`)

  db.run(`CREATE TABLE graves (
    usn INTEGER NOT NULL, oid INTEGER NOT NULL, type INTEGER NOT NULL)`)

  db.run(`CREATE INDEX ix_notes_usn ON notes(usn)`)
  db.run(`CREATE INDEX ix_cards_nid ON cards(nid)`)
  db.run(`CREATE INDEX ix_cards_usn ON cards(usn)`)
  db.run(`CREATE INDEX ix_cards_sched ON cards(did, queue, due)`)
  db.run(`CREATE INDEX ix_revlog_usn ON revlog(usn)`)
  db.run(`CREATE INDEX ix_revlog_cid ON revlog(cid)`)
}

function insertCol(db, models, decks) {
  const conf = JSON.stringify({
    activeDecks: [parseInt(DID)], curDeck: parseInt(DID),
    newSpread: 0, collapseTime: 1200, timeLim: 0, estTimes: true,
    dueCounts: true, curModel: MID_BASIC, nextPos: 1,
    sortType: 'noteFld', sortBackwards: false, addToCur: true,
  })
  const dconf = JSON.stringify({
    1: {
      id: 1, mod: 0, name: 'Default', usn: 0, maxTaken: 60,
      autoplay: true, timer: 0, replayq: true,
      new: { bury: false, delays: [1, 10], initialFactor: 2500, ints: [1, 4, 7], order: 1, perDay: 20 },
      lapse: { delays: [10], leechAction: 1, leechFails: 8, minInt: 1, mult: 0 },
      rev: { bury: false, ease4: 1.3, fuzz: 0.05, ivlFct: 1, maxIvl: 36500, minSpace: 1, perDay: 200 },
    },
  })
  db.run(`INSERT INTO col VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
    1, now, now, now, 11, 0, -1, 0,
    conf, JSON.stringify(models), JSON.stringify(decks), dconf, '{}',
  ])
}

function note(db, id, mid, tagsStr, flds) {
  const first = flds.split('\x1f')[0]
  db.run(`INSERT INTO notes VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [
    id, guid(), parseInt(mid), now, -1,
    tagsStr ? ` ${tagsStr} ` : '',
    flds, 0, csum(first), 0, '',
  ])
}

function card(db, id, nid, ord) {
  db.run(`INSERT INTO cards VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
    id, nid, parseInt(DID), ord, now, -1, 0, 0, ord, 0, 0, 0, 0, 0, 0, 0, 0, '',
  ])
}

// ── Generate ──────────────────────────────────────────────────────────────

async function generate() {
  const SQL = await initSqlJs()
  const db = new SQL.Database()
  createSchema(db)
  insertCol(db, makeModels(), makeDecks())

  // 1 — Basic card
  const nBasic = base + 1
  note(db, nBasic, MID_BASIC, 'atmosfera ciencias',
    '¿Cuál es la capa atmosférica más cercana a la superficie terrestre?\x1f' +
    'La <b>Troposfera</b> (0–12 km). Es donde ocurre el clima y los fenómenos meteorológicos.')
  card(db, base + 10, nBasic, 0)

  // 2 — Cloze cards (3 gaps → 3 cards)
  const nCloze = base + 2
  note(db, nCloze, MID_CLOZE, 'atmosfera ciencias',
    'La {{c1::Troposfera}} es la capa más cercana a la Tierra (0–12 km).\n' +
    'La {{c2::Estratosfera}} contiene la capa de ozono (12–50 km).\n' +
    'La {{c3::Mesosfera}} es donde se desintegran los meteoritos (50–80 km).\x1f' +
    'Capas de la atmósfera terrestre.')
  card(db, base + 20, nCloze, 0)
  card(db, base + 21, nCloze, 1)
  card(db, base + 22, nCloze, 2)

  // 3 — Image Occlusion (5 masks → 5 cards)
  const nIO = base + 3
  const F = '\x1f'
  note(db, nIO, MID_IO, 'atmosfera ciencias oclusión',
    // id \x1f Header \x1f Image \x1f Footer \x1f Remarks \x1f Sources \x1f SVG \x1f Tags
    `io-atm-001${F}Identifica la capa de la atmósfera${F}<img src="atmosphere.svg">${F}${F}${F}${F}${buildOcclusionSvg()}${F}`)
  LAYERS.forEach((_, i) => card(db, base + 30 + i, nIO, i))

  return db
}

// ── Build ZIP (.apkg) ─────────────────────────────────────────────────────

async function buildApkg(db) {
  const zip = new JSZip()
  zip.file('collection.anki21', db.export())
  zip.file('0', Buffer.from(buildAtmosphereSvg(), 'utf8'))
  zip.file('media', JSON.stringify({ '0': 'atmosphere.svg' }))
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE',
                              compressionOptions: { level: 6 } })
}

// ── Main ──────────────────────────────────────────────────────────────────

const db = await generate()
const buf = await buildApkg(db)

const outDir = join(__dirname, '..', 'public', 'seeds')
await mkdir(outDir, { recursive: true })
const outPath = join(outDir, 'test-atmosfera.apkg')
await writeFile(outPath, buf)

const total = 1 + 3 + LAYERS.length
console.log(`✓  ${outPath}`)
console.log(`   1 tarjeta básica`)
console.log(`   3 tarjetas cloze (c1–c3)`)
console.log(`   ${LAYERS.length} tarjetas de oclusión de imagen (${LAYERS.map(l=>l.name).join(', ')})`)
console.log(`   Total: ${total} tarjetas`)
