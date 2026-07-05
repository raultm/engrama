import { describe, it, expect, afterEach, vi } from 'vitest'
import { loadAppConfig, getAppConfig } from '../config.js'

describe('config', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('usa los valores por defecto si no hay app-config.json', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const config = await loadAppConfig()
    expect(config.appTitle).toBe('Engrama')
    expect(config.showDownloadDb).toBe(true)
    expect(config.showEloMargin).toBe(true)
    expect(config.statsCards).toEqual({ elo: true, due: true, newCards: true, total: true })
  })

  it('usa los valores por defecto si fetch lanza un error (sin conexión)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const config = await loadAppConfig()
    expect(config.appTitle).toBe('Engrama')
  })

  it('fusiona el JSON descargado con los valores por defecto', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ appTitle: 'Mi Mazo', showDownloadDb: false, statsCards: { elo: false } }),
    }))
    const config = await loadAppConfig()
    expect(config.appTitle).toBe('Mi Mazo')
    expect(config.showDownloadDb).toBe(false)
    expect(config.showEloMargin).toBe(true)
    // statsCards se fusiona campo a campo, no se sobrescribe entero
    expect(config.statsCards).toEqual({ elo: false, due: true, newCards: true, total: true })
  })

  it('getAppConfig devuelve la última configuración cargada', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ appTitle: 'Otro título' }),
    }))
    await loadAppConfig()
    expect(getAppConfig().appTitle).toBe('Otro título')
  })
})
