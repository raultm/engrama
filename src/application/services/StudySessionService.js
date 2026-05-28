import { StudySession } from '../../domain/entities/StudySession.js'
import { schedulerRegistry } from '../../domain/schedulers/SchedulerRegistry.js'
import { eloSystem } from '../../domain/elo/EloSystem.js'
import { generateId } from '../../infrastructure/utils/generateId.js'

export class StudySessionService {
  constructor({ collectionRepository, flashCardRepository, userProfileRepository }) {
    this._collectionRepo = collectionRepository
    this._cardRepo = flashCardRepository
    this._profileRepo = userProfileRepository
  }

  startGlobalSession() {
    const tree = this._collectionRepo.buildTree()
    const allCards = tree.flatMap(col => col.getAllFlashCardsRecursive())
    const scheduler = schedulerRegistry.getDefault()
    const cards = scheduler.selectCards(allCards)

    if (cards.length === 0) return null

    return new StudySession({
      id: generateId(),
      collectionId: 'global',
      schedulerType: 'sm2',
      cards,
    })
  }

  getAllCardsStats() {
    const allCards = this._cardRepo.findAll()
    const now = new Date()
    const unlocked = allCards.filter(c => c.isUnlocked)
    const locked = allCards.filter(c => !c.isUnlocked)

    // Group locked cards by ELO milestone
    const lockedByElo = locked.reduce((acc, c) => {
      acc[c.eloDifficulty] = (acc[c.eloDifficulty] ?? 0) + 1
      return acc
    }, {})
    const lockedMilestones = Object.entries(lockedByElo)
      .map(([elo, count]) => ({ elo: Number(elo), count }))
      .sort((a, b) => a.elo - b.elo)

    return {
      total: allCards.length,
      due: unlocked.filter(c => c.isDue(now)).length,
      notDue: unlocked.filter(c => !c.isDue(now) && !c.isNew()).length,
      newCards: unlocked.filter(c => c.isNew()).length,
      unlockedCount: unlocked.length,
      lockedCount: locked.length,
      nextUnlockElo: lockedMilestones[0]?.elo ?? null,
      lockedMilestones,
    }
  }

  processAnswer(session, rating) {
    const card = session.currentCard
    if (!card) throw new Error('No current card')

    const scheduler = schedulerRegistry.get(session.schedulerType)
    const profile = this._profileRepo.getOrCreate()

    // Scheduler update
    const { schedulerData } = scheduler.processAnswer(card, rating)

    // ELO update
    const { userDelta, cardDelta, newUserElo, newCardElo } =
      eloSystem.calculateChange(profile.eloRating, card.eloDifficulty, rating)

    const updatedCard = card
      .withSchedulerData(schedulerData)
      .withElo(newCardElo)

    // Persist card and profile
    this._cardRepo.save(updatedCard)
    const updatedProfile = profile.withElo(newUserElo)
    this._profileRepo.save(updatedProfile)

    // Unlock cards that the user's new ELO now covers
    if (newUserElo > profile.eloRating) {
      this._cardRepo.unlockCardsUpToElo(newUserElo)
    }

    const updatedSession = session.recordResult(card.id, rating, updatedCard, userDelta)
    return { session: updatedSession, userDelta, cardDelta }
  }

  _findCollectionInTree(tree, id) {
    for (const col of tree) {
      if (col.id === id) return col
      const found = this._findCollectionInTree(col.children, id)
      if (found) return found
    }
    return null
  }
}
