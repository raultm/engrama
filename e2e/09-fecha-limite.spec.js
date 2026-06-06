/**
 * FECHA LÍMITE — Configuración y efecto en el scheduling
 *
 * El usuario puede fijar una fecha límite para su estudio.
 * Esto comprime los intervalos de revisión para maximizar el aprendizaje
 * antes de esa fecha. Con un plazo cercano, las tarjetas olvidadas vuelven
 * en menos de 4 horas (proporcional al tiempo disponible).
 */
import { test, expect } from '@playwright/test'
import { resetApp, startStudySession } from './helpers.js'

const FIXTURE    = 'e2e/fixtures/una-tarjeta.md'
const DIA_INICIO = new Date('2026-03-01T10:00:00')
const H = 3_600_000
const D = 24 * H

async function instalarConFechaLimite(page, fechaIso) {
  await page.locator('#file-upload').setInputFiles(FIXTURE)
  await page.waitForSelector('#dm-confirm', { timeout: 8_000 })
  // Fijar la fecha límite en el input del modal
  await page.locator('#dm-date').fill(fechaIso)
  await page.locator('#dm-confirm').click()
  await page.waitForSelector('.home-view', { timeout: 15_000 })
}

async function calificarOlvidada(page) {
  await startStudySession(page)
  await page.getByRole('button', { name: /mostrar respuesta/i }).click()
  await page.getByRole('button', { name: /olvidada/i }).click()
  await page.waitForSelector('#btn-home', { timeout: 5_000 })
  await page.locator('#btn-home').click()
  await page.waitForSelector('.home-view', { timeout: 5_000 })
}

async function avanzar(page, ms) {
  await page.clock.fastForward(ms)
  await page.reload()
  await page.waitForSelector('.home-view', { timeout: 10_000 })
}

test.describe('Fecha límite', () => {

  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: DIA_INICIO })
    await resetApp(page)
  })

  test('fijar fecha límite muestra el aviso en la pantalla de inicio', async ({ page }) => {
    await instalarConFechaLimite(page, '2026-03-08')
    await expect(page.locator('.cta-hint--deadline')).toBeVisible()
  })

  test('el aviso de fecha límite muestra los días restantes', async ({ page }) => {
    await instalarConFechaLimite(page, '2026-03-08')
    const hint = await page.locator('.cta-hint--deadline').textContent()
    expect(hint).toMatch(/7.*día|fecha.*límite/i)
  })

  test('con deadline próximo, Olvidada vuelve antes de 4 horas', async ({ page }) => {
    // Deadline hoy mismo (2026-03-01T23:59:59) → ~14h disponibles
    // delay = min(4, max(0.5, 14/20)) = 0.7h
    // Sin deadline serían 4h fijas → verificamos que vuelve mucho antes
    await instalarConFechaLimite(page, '2026-03-01')
    await calificarOlvidada(page)

    await avanzar(page, H)   // 1 hora — suficiente para 0.7h de intervalo
    expect(await page.locator('.counter--due .counter__number').textContent()).toBe('1')
  })

  test('sin fecha límite, Olvidada vuelve exactamente a las 4 horas', async ({ page }) => {
    // Instalar sin fijar fecha (skip)
    await page.locator('#file-upload').setInputFiles(FIXTURE)
    await page.waitForSelector('#dm-skip', { timeout: 8_000 })
    await page.locator('#dm-skip').click()
    await page.waitForSelector('.home-view', { timeout: 15_000 })

    await calificarOlvidada(page)
    await avanzar(page, 3 * H)
    expect(await page.locator('.counter--due .counter__number').textContent()).toBe('0')

    await avanzar(page, H + 1)
    expect(await page.locator('.counter--due .counter__number').textContent()).toBe('1')
  })

  test('la fecha límite se puede cambiar desde estadísticas', async ({ page }) => {
    await instalarConFechaLimite(page, '2026-03-08')

    await page.locator('#btn-stats').click()
    await page.waitForSelector('.stats-main', { timeout: 3_000 })

    await page.locator('#deadline-input').fill('2026-03-15')
    await page.locator('#deadline-input').dispatchEvent('change')

    // Volver al inicio y verificar que el aviso cambió
    await page.getByRole('button', { name: /volver/i }).click()
    await page.waitForSelector('.home-view', { timeout: 5_000 })

    const hint = await page.locator('.cta-hint--deadline').textContent()
    expect(hint).toMatch(/14.*día|fecha.*límite/i)
  })

})
