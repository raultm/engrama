import { SM2Scheduler } from './SM2Scheduler.js'

class SchedulerRegistry {
  constructor() {
    this._schedulers = new Map()
    this.register(new SM2Scheduler())
  }

  register(scheduler) {
    this._schedulers.set(scheduler.type, scheduler)
  }

  get(type) {
    const scheduler = this._schedulers.get(type)
    if (!scheduler) throw new Error(`Scheduler not found: ${type}`)
    return scheduler
  }

  getDefault() {
    return this.get('sm2')
  }

  getAvailableTypes() {
    return [...this._schedulers.keys()]
  }
}

export const schedulerRegistry = new SchedulerRegistry()
