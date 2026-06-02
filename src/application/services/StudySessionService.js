import { StudySession } from '../../domain/entities/StudySession.js'
import { schedulerRegistry } from '../../domain/schedulers/SchedulerRegistry.js'
import { eloSystem } from '../../domain/elo/EloSystem.js'
import { generateId } from '../../infrastructure/utils/generateId.js'

const DEADLINE_KEY        = 'master_deadline'
const DEFAULT_DEADLINE_MS = 7 * 24 * 3_600_000   // 1 semana

export class StudySessionService {
  constructor({ db, collectionRepository, flashCardRepository, userProfileRepository, studySessionRepository }) {
    this._db          = db
    this._collectionRepo = collectionRepository
    this._cardRepo = flashCardRepository
    this._profileRepo = userProfileRepository
    this._sessionRepo = studySessionRepository
  }

  getMasterDeadline() {
    const val = this._db.getSetting(DEADLINE_KEY)
    return val ? new Date(val) : null
  }

  setMasterDeadline(date) {
    this._db.setSetting(DEADLINE_KEY, date instanceof Date ? date.toISOString() : date)
  }

  setDefaultDeadlineIfMissing() {
    if (!this._db.getSetting(DEADLINE_KEY)) {
      const deadline = new Date(Date.now() + DEFAULT_DEADLINE_MS)
      this.setMasterDeadline(deadline)
    }
  }

  startGlobalSession() {
    const tree = this._collectionRepo.buildTree()
    const allCards = tree.flatMap(col => col.getAllFlashCardsRecursive())
    const scheduler = schedulerRegistry.getDefault()
    const cards = scheduler.selectCards(allCards)

    if (cards.length === 0) return null

    const profile = this._profileRepo.getOrCreate()
    const session = new StudySession({
      id: generateId(),
      collectionId: 'global',
      schedulerType: 'sm2',
      cards,
      eloStart: profile.eloRating,
    })

    this._sessionRepo.save(session, null)
    return session
  }

  getAllCardsStats() {
    const allCards = this._cardRepo.findAll()
    const now = new Date()
    const unlocked = allCards.filter(c => c.isUnlocked)
    const locked = allCards.filter(c => !c.isUnlocked)

    const lockedByElo = locked.reduce((acc, c) => {
      acc[c.eloDifficulty] = (acc[c.eloDifficulty] ?? 0) + 1
      return acc
    }, {})
    const lockedMilestones = Object.entries(lockedByElo)
      .map(([elo, count]) => ({ elo: Number(elo), count }))
      .sort((a, b) => a.elo - b.elo)

    // Próxima revisión programada entre las tarjetas que aún no son exigibles
    const upcoming = unlocked.filter(c => !c.isDue(now) && c.schedulerData?.nextReview)
    const nextReviewAt = upcoming.length > 0
      ? upcoming.reduce((min, c) => {
          const t = new Date(c.schedulerData.nextReview)
          return (!min || t < min) ? t : min
        }, null)
      : null

    return {
      total: allCards.length,
      due: unlocked.filter(c => c.isDue(now)).length,
      notDue: unlocked.filter(c => !c.isDue(now) && !c.isNew()).length,
      newCards: unlocked.filter(c => c.isNew()).length,
      unlockedCount: unlocked.length,
      lockedCount: locked.length,
      nextUnlockElo: lockedMilestones[0]?.elo ?? null,
      lockedMilestones,
      nextReviewAt,
      masterDeadline: this.getMasterDeadline(),
    }
  }

  processAnswer(session, rating) {
    const card = session.currentCard
    if (!card) throw new Error('No current card')

    const scheduler = schedulerRegistry.get(session.schedulerType)
    const profile = this._profileRepo.getOrCreate()

    const deadline    = this.getMasterDeadline()
    const deadlineMs  = deadline ? deadline.getTime() : null
    const { schedulerData } = scheduler.processAnswer(card, rating, new Date(), deadlineMs)
    const { userDelta, cardDelta, newUserElo, newCardElo } =
      eloSystem.calculateChange(profile.eloRating, card.eloDifficulty, rating)

    const updatedCard = card.withSchedulerData(schedulerData).withElo(newCardElo)
    this._cardRepo.save(updatedCard)

    let updatedProfile = profile.withElo(newUserElo)
    if (newUserElo > profile.eloRating) {
      this._cardRepo.unlockCardsUpToElo(newUserElo)
    }

    const updatedSession = session.recordResult(card.id, rating, updatedCard, userDelta)

    if (updatedSession.isFinished) {
      updatedProfile = updatedProfile.withSessionCompleted(updatedSession.cards.length)
    }

    this._profileRepo.save(updatedProfile)
    this._sessionRepo.save(updatedSession, updatedProfile.eloRating)

    return { session: updatedSession, userDelta, cardDelta }
  }

  markAbandoned(sessionId) {
    this._sessionRepo.markAbandoned(sessionId)
  }
}
