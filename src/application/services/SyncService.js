import { getOrCreateDeviceToken } from '../../infrastructure/sync/deviceToken.js'
import { API_BASE_URL } from '../../infrastructure/sync/config.js'

const BASE_URL = API_BASE_URL

const KEYS = {
  code:   'engrama_sync_code',
  status: 'engrama_sync_status',
  info:   'engrama_sync_info',
}

export class SyncService {
  constructor({ studySessionRepository }) {
    this._sessionRepo = studySessionRepository
  }

  getLocalState() {
    const raw = localStorage.getItem(KEYS.info)
    return {
      code:   localStorage.getItem(KEYS.code),
      status: localStorage.getItem(KEYS.status),   // 'pending' | 'approved' | 'rejected' | null
      ...(raw ? JSON.parse(raw) : {}),              // engramaId, engramaName
    }
  }

  async fetchByCode(code) {
    const res = await fetch(`${BASE_URL}/engramas/${code}`)
    if (res.status === 404) throw new Error('Código inválido')
    if (!res.ok) throw new Error('Error de conexión')
    return res.json()
  }

  async join(code, displayName, email) {
    const deviceToken = getOrCreateDeviceToken()
    const body = { deviceToken, displayName }
    if (email) body.email = email

    const res = await fetch(`${BASE_URL}/engramas/${code}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error('Error al unirse a la clase')
    const data = await res.json()

    localStorage.setItem(KEYS.code, code)
    localStorage.setItem(KEYS.status, data.status)
    localStorage.setItem(KEYS.info, JSON.stringify({
      engramaId:   data.engramaId,
      engramaName: data.engramaName,
    }))

    return data  // { engramaId, engramaName, status }
  }

  async refreshStatus() {
    const { code } = this.getLocalState()
    const deviceToken = localStorage.getItem('engrama_device_token')
    if (!code || !deviceToken) return null

    try {
      const res = await fetch(`${BASE_URL}/engramas/${code}/status/${deviceToken}`)
      if (!res.ok) return null
      const { status } = await res.json()
      localStorage.setItem(KEYS.status, status)
      return status
    } catch {
      return null
    }
  }

  async trySyncSessions() {
    const { status, engramaId } = this.getLocalState()
    if (status !== 'approved' || !engramaId) return { skipped: true, reason: status ?? 'not_joined' }

    const deviceToken = localStorage.getItem('engrama_device_token')
    const rows = this._sessionRepo.findUnsynced()
    if (!rows.length) return { synced: 0 }

    const sessions = rows.map(r => this._toApiFormat(r, engramaId))

    try {
      const res = await fetch(`${BASE_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceToken, sessions }),
      })

      if (res.status === 403) {
        const { reason } = await res.json()
        if (reason === 'rejected') localStorage.setItem(KEYS.status, 'rejected')
        return { skipped: true, reason }
      }

      if (!res.ok) return { skipped: true, reason: 'server_error' }

      const { accepted } = await res.json()
      this._sessionRepo.markSynced(rows.map(r => r.id))
      return { synced: accepted }
    } catch {
      return { skipped: true, reason: 'network_error' }
    }
  }

  _toApiFormat(row, engramaId) {
    const summary = JSON.parse(row.summary || '{}')
    const startedAt = Math.floor(new Date(row.started_at).getTime() / 1000)
    const endedAt   = row.completed_at
      ? Math.floor(new Date(row.completed_at).getTime() / 1000)
      : startedAt

    return {
      id:              row.id,
      engramaId,
      startedAt,
      endedAt,
      durationSeconds: endedAt - startedAt,
      eloBefore:       summary.eloStart ?? 1500,
      eloAfter:        summary.eloEnd   ?? summary.eloStart ?? 1500,
      cardsStudied:    summary.totalCards ?? 0,
      buttonCounts: {
        again: summary.forgotten ?? 0,
        hard:  summary.hard      ?? 0,
        good:  summary.good      ?? 0,
        easy:  summary.perfect   ?? 0,
      },
    }
  }
}
