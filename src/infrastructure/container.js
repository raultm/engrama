import { DatabaseAdapter } from './db/DatabaseAdapter.js'
import { CollectionRepository } from './repositories/CollectionRepository.js'
import { FlashCardRepository } from './repositories/FlashCardRepository.js'
import { UserProfileRepository } from './repositories/UserProfileRepository.js'
import { StudySessionRepository } from './repositories/StudySessionRepository.js'
import { CollectionService } from '../application/services/CollectionService.js'
import { FlashCardService } from '../application/services/FlashCardService.js'
import { StudySessionService } from '../application/services/StudySessionService.js'
import { SeedService } from '../application/services/SeedService.js'

let container = null

export async function initContainer(engramaId = 'default') {
  const db = new DatabaseAdapter(engramaId)
  await db.init()

  const collectionRepository = new CollectionRepository(db)
  const flashCardRepository = new FlashCardRepository(db)
  const userProfileRepository = new UserProfileRepository(db)
  const studySessionRepository = new StudySessionRepository(db)

  const collectionService = new CollectionService({ collectionRepository })
  const flashCardService = new FlashCardService({ flashCardRepository })
  const studySessionService = new StudySessionService({
    collectionRepository,
    flashCardRepository,
    userProfileRepository,
    studySessionRepository,
  })
  const seedService = new SeedService({
    db,
    collectionRepository,
    flashCardRepository,
    userProfileRepository,
  })

  container = {
    db,
    collectionRepository,
    flashCardRepository,
    userProfileRepository,
    studySessionRepository,
    collectionService,
    flashCardService,
    studySessionService,
    seedService,
  }

  return container
}

export function getContainer() {
  if (!container) throw new Error('Container not initialized')
  return container
}
