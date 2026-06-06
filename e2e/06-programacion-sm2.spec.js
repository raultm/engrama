/**
 * PROGRAMACIÓN SM2 — Intervalos de repetición espaciada
 *
 * Verifica que el algoritmo SM2 programa las tarjetas en los días
 * correctos cuando se califican como Perfecta. Se usa un mazo de
 * una sola tarjeta y se controla el tiempo con el reloj de Playwright.
 *
 * Intervalos esperados (sin fecha límite, con Perfectas consecutivas):
 *   1ª Perfecta → +1 día   (easiness 2.5 → 2.6)
 *   2ª Perfecta → +6 días  (easiness 2.6 → 2.7)
 *   3ª Perfecta → +16 días (Math.round(6 × 2.7) = 16)
 */
import { test, expect } from '@playwright/test'
import { resetApp, startStudySession } from './helpers.js'

const FIXTURE    = 'e2e/fixtures/una-tarjeta.md'
const DIA_INICIO = new Date('2026-01-15T10:00:00')
const H = 3_600_000          // 1 hora en ms
const D = 24 * H             // 1 día en ms

/** Importa el fixture de una tarjeta desde archivo */
async function instalarUnaTarjeta(page) {
  await page.locator('#file-upload').setInputFiles(FIXTURE)
  await page.waitForSelector('#dm-skip', { timeout: 8_000 })
  await page.locator('#dm-skip').click()
  await page.waitForSelector('.home-view', { timeout: 15_000 })
}

/** Inicia sesión, revela respuesta, califica Perfecta y vuelve al inicio */
async function calificarPerfecta(page) {
  await startStudySession(page)
  await page.getByRole('button', { name: /mostrar respuesta/i }).click()
  await page.getByRole('button', { name: /perfecta/i }).click()
  await page.waitForSelector('#btn-home', { timeout: 5_000 })
  await page.locator('#btn-home').click()
  await page.waitForSelector('.home-view', { timeout: 5_000 })
}

/** Avanza el reloj y recarga para que la app lea la nueva fecha */
async function avanzar(page, ticks) {
  await page.clock.fastForward(ticks)
  await page.reload()
  await page.waitForSelector('.home-view', { timeout: 10_000 })
}

/** Lee el contador de tarjetas pendientes */
async function tarjetasPendientes(page) {
  return Number(await page.locator('.counter--due .counter__number').textContent())
}

test.describe('Programación SM2 — intervalos con Perfecta', () => {

  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: DIA_INICIO })
    await resetApp(page)
    await instalarUnaTarjeta(page)
  })

  test('después de Perfecta la tarjeta desaparece (pendientes = 0)', async ({ page }) => {
    await calificarPerfecta(page)
    expect(await tarjetasPendientes(page)).toBe(0)
  })

  test('1ª Perfecta — la tarjeta NO vuelve el mismo día', async ({ page }) => {
    await calificarPerfecta(page)
    await avanzar(page, 12 * H)   // aún es el mismo día (10:00 → 22:00)
    expect(await tarjetasPendientes(page)).toBe(0)
  })

  test('1ª Perfecta — la tarjeta vuelve al día siguiente', async ({ page }) => {
    await calificarPerfecta(page)
    await avanzar(page, 25 * H)   // 1 día + 1h para cruzar la medianoche
    expect(await tarjetasPendientes(page)).toBe(1)
  })

  test('2ª Perfecta — la tarjeta NO vuelve antes de 6 días', async ({ page }) => {
    await calificarPerfecta(page)
    await avanzar(page, 25 * H)
    await calificarPerfecta(page)
    await avanzar(page, 5 * D)
    expect(await tarjetasPendientes(page)).toBe(0)
  })

  test('2ª Perfecta — la tarjeta vuelve a los 6 días', async ({ page }) => {
    await calificarPerfecta(page)
    await avanzar(page, 25 * H)
    await calificarPerfecta(page)
    await avanzar(page, 6 * D + H)
    expect(await tarjetasPendientes(page)).toBe(1)
  })

  test('3ª Perfecta — la tarjeta vuelve a los 16 días', async ({ page }) => {
    await calificarPerfecta(page)
    await avanzar(page, 25 * H)
    await calificarPerfecta(page)
    await avanzar(page, 6 * D + H)
    await calificarPerfecta(page)
    await avanzar(page, 16 * D + H)
    expect(await tarjetasPendientes(page)).toBe(1)
  })

  test('3ª Perfecta — la tarjeta NO vuelve antes de 16 días', async ({ page }) => {
    await calificarPerfecta(page)
    await avanzar(page, 25 * H)
    await calificarPerfecta(page)
    await avanzar(page, 6 * D + H)
    await calificarPerfecta(page)
    await avanzar(page, 15 * D)
    expect(await tarjetasPendientes(page)).toBe(0)
  })

})
