import { parseSgf } from '../../domain/sgf/SgfParser.js'
import { FlashCard } from '../../domain/entities/FlashCard.js'
import { generateId } from '../../infrastructure/utils/generateId.js'

export class SgfImporter {
  constructor({ db, collectionRepository, flashCardRepository, userProfileRepository }) {
    this._db           = db
    this._collectionRepo = collectionRepository
    this._cardRepo     = flashCardRepository
    this._profileRepo  = userProfileRepository
  }

  /**
   * Importa uno o varios SGF (separados por líneas en blanco o como archivo único).
   * Crea una colección con el nombre del archivo y una carta por problema.
   *
   * @param {string} sgfText  - Contenido del archivo .sgf
   * @param {string} filename - Nombre del archivo (usado como nombre del mazo)
   */
  importSgf(sgfText, filename) {
    const deckName = filename.replace(/\.sgf$/i, '').replace(/[-_]/g, ' ') || 'Tsumego'
    const colId    = generateId()
    const now      = new Date().toISOString()

    this._db.clearAllData()
    this._profileRepo.getOrCreate()

    this._db.run(
      `INSERT OR REPLACE INTO collections (id, parent_id, name, description, scheduler_type, created_at, updated_at)
       VALUES (?, NULL, ?, '', 'sm2', ?, ?)`,
      [colId, deckName, now, now]
    )

    // Separar problemas: un archivo puede tener varios SGFs concatenados
    const problems = _splitSgfs(sgfText)
    let count = 0

    for (const sgf of problems) {
      try {
        const parsed = parseSgf(sgf)
        if (!parsed.blackStones.length && !parsed.whiteStones.length) continue

        const title = parsed.comment || `Problema ${count + 1}`

        const card = new FlashCard({
          id:           generateId(),
          collectionId: colId,
          frontText:    title,
          backText:     parsed.correctMoves.map(m => m).join(', '),
          cardType:     'tsumego',
          extraData: {
            sgf:           sgf,            // árbol completo para navegar variaciones
            boardSize:     parsed.boardSize,
            blackStones:   parsed.blackStones,
            whiteStones:   parsed.whiteStones,
            playerToMove:  parsed.playerToMove,
            correctMoves:  parsed.correctMoves,
            comment:       parsed.comment,
          },
          eloDifficulty: 1500,
          createdAt:     now,
          updatedAt:     now,
          schedulerData: {},
          tags:          ['tsumego', 'go'],
          prerequisites: [],
          isUnlocked:    true,
        })

        this._cardRepo.save(card)
        count++
      } catch (err) {
        console.warn('[SgfImporter] problema saltado:', err.message)
      }
    }

    this._db.markSeeded()
    return { deckName, cardCount: count }
  }
}

function _splitSgfs(text) {
  // Un archivo puede contener múltiples árboles SGF separados
  const trees = []
  let depth = 0
  let start = -1

  for (let i = 0; i < text.length; i++) {
    if (text[i] === '(') {
      if (depth === 0) start = i
      depth++
    } else if (text[i] === ')') {
      depth--
      if (depth === 0 && start >= 0) {
        trees.push(text.slice(start, i + 1))
        start = -1
      }
    }
  }

  return trees.length > 0 ? trees : [text]
}
