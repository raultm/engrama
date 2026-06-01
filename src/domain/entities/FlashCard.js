export class FlashCard {
  constructor({
    id,
    collectionId,
    frontText,
    backText,
    cardType = 'basic',
    extraData = {},
    eloDifficulty = 1500,
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString(),
    schedulerData = {},
    tags = [],
    prerequisites = [],
    isUnlocked = true,
  }) {
    this.id = id
    this.collectionId = collectionId
    this.frontText = frontText
    this.backText = backText
    this.cardType = cardType || 'basic'
    this.extraData = typeof extraData === 'string' ? JSON.parse(extraData) : extraData
    this.eloDifficulty = eloDifficulty
    this.createdAt = createdAt
    this.updatedAt = updatedAt
    this.schedulerData = typeof schedulerData === 'string'
      ? JSON.parse(schedulerData)
      : schedulerData
    this.tags = typeof tags === 'string' ? JSON.parse(tags) : tags
    this.prerequisites = typeof prerequisites === 'string'
      ? JSON.parse(prerequisites)
      : prerequisites
    this.isUnlocked = isUnlocked === 1 ? true : Boolean(isUnlocked)
  }

  update(fields) {
    return new FlashCard({
      ...this,
      ...fields,
      updatedAt: new Date().toISOString(),
    })
  }

  withSchedulerData(data) {
    return this.update({ schedulerData: data })
  }

  withElo(elo) {
    return this.update({ eloDifficulty: elo })
  }

  isDue(now = new Date()) {
    const nextReview = this.schedulerData?.nextReview
    if (!nextReview) return true
    return new Date(nextReview) <= now
  }

  isNew() {
    return !this.schedulerData?.repetitions || this.schedulerData.repetitions === 0
  }
}
