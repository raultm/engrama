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

  getAvailableTags() {
    const allCards = this._cardRepo.findAll()
    const tagSet = new Set()
    allCards.forEach(c => (c.tags ?? []).forEach(t => tagSet.add(t)))
    return [...tagSet].sort()
  }

  getSelectedTags() {
    const raw = this._db.getSetting('selected_tags')
    if (!raw) return []
    try { return JSON.parse(raw) } catch { return [] }
  }

  setSelectedTags(tags) {
    if (!tags || tags.length === 0) {
      this._db.setSetting('selected_tags', null)
    } else {
      this._db.setSetting('selected_tags', JSON.stringify(tags))
    }
  }

  getTagMode() {
    return this._db.getSetting('tag_mode') ?? 'or'
  }

  setTagMode(mode) {
    this._db.setSetting('tag_mode', mode === 'and' ? 'and' : 'or')
  }

  _applyTagFilter(cards) {
    const tags = this.getSelectedTags()
    if (tags.length === 0) return cards
    return this.getTagMode() === 'and'
      ? cards.filter(c => tags.every(t => (c.tags ?? []).includes(t)))
      : cards.filter(c => (c.tags ?? []).some(t => tags.includes(t)))
  }

  startGlobalSession() {
    const currentProfile = this._profileRepo.getOrCreate()
    const maxElo  = currentProfile.eloRating + 200   // ventana de acceso: ELO actual + 200

    const tree = this._collectionRepo.buildTree()
    let allCards = tree.flatMap(col => col.getAllFlashCardsRecursive())
      .filter(c => c.eloDifficulty <= maxElo)  // solo tarjetas accesibles

    allCards = this._applyTagFilter(allCards)

    const scheduler = schedulerRegistry.getDefault()
    const cards = scheduler.selectCards(allCards)

    if (cards.length === 0) return null

    const profile = currentProfile
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
    const profile  = this._profileRepo.getOrCreate()
    const maxElo   = profile.eloRating + 200
    const now      = new Date()

    // Tarjetas accesibles: ELO ≤ ELO_usuario + 200
    const accessible   = allCards.filter(c => c.eloDifficulty <= maxElo)
    const inaccessible = allCards.filter(c => c.eloDifficulty >  maxElo)

    // Aplicar filtro de tags si hay alguno activo
    const filtered = this._applyTagFilter(accessible)

    // Próximos hitos: ELOs de tarjetas aún no accesibles
    const inaccessByElo = inaccessible.reduce((acc, c) => {
      acc[c.eloDifficulty] = (acc[c.eloDifficulty] ?? 0) + 1
      return acc
    }, {})
    const lockedMilestones = Object.entries(inaccessByElo)
      .map(([elo, count]) => ({ elo: Number(elo), count }))
      .sort((a, b) => a.elo - b.elo)

    // Próxima revisión entre las tarjetas filtradas no exigibles
    const upcoming = filtered.filter(c => !c.isDue(now) && c.schedulerData?.nextReview)
    const nextReviewAt = upcoming.length > 0
      ? upcoming.reduce((min, c) => {
          const t = new Date(c.schedulerData.nextReview)
          return (!min || t < min) ? t : min
        }, null)
      : null

    return {
      total: allCards.length,
      due: filtered.filter(c => c.isDue(now)).length,
      notDue: filtered.filter(c => !c.isDue(now) && !c.isNew()).length,
      newCards: filtered.filter(c => c.isNew()).length,
      unlockedCount: accessible.length,      // compat con StatsView (global)
      lockedCount: inaccessible.length,
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
      this._updateStreak()
    }

    this._profileRepo.save(updatedProfile)
    this._sessionRepo.save(updatedSession, updatedProfile.eloRating)

    return { session: updatedSession, userDelta, cardDelta }
  }

  getStreak() {
    return parseInt(this._db.getSetting('streak_count') ?? '0')
  }

  _updateStreak() {
    const today     = new Date().toISOString().slice(0, 10)
    const lastDate  = this._db.getSetting('streak_last_date')
    const current   = parseInt(this._db.getSetting('streak_count') ?? '0')

    if (lastDate === today) return  // ya estudiaste hoy

    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
    const newStreak = lastDate === yesterday ? current + 1 : 1

    this._db.setSetting('streak_last_date', today)
    this._db.setSetting('streak_count', String(newStreak))
  }

  markAbandoned(sessionId) {
    this._sessionRepo.markAbandoned(sessionId)
  }
}
