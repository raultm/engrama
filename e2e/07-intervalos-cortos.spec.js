/**
 * INTERVALOS CORTOS — Olvidada y Difícil
 *
 * Cuando el usuario no recuerda una tarjeta o la encuentra difícil,
 * la app la programa para revisarla en pocas horas (no días).
 * Sin fecha límite configurada: Olvidada = 4h, Difícil = 8h.
 */
import { test, expect } from '@playwright/test'
import { resetApp, startStudySession } from './helpers.js'

const FIXTURE    = 'e2e/fixtures/una-tarjeta.md'
const DIA_INICIO = new Date('2026-02-01T10:00:00')
const H = 3_600_000

async function instalarUnaTarjeta(page) {
  await page.locator('#file-upload').setInputFiles(FIXTURE)
  await page.waitForSelector('#dm-skip', { timeout: 8_000 })
  await page.locator('#dm-skip').click()
  await page.waitForSelector('.home-view', { timeout: 15_000 })
}

async function calificarCon(page, nombreBoton) {
  await startStudySession(page)
  await page.getByRole('button', { name: /mostrar respuesta/i }).click()
  await page.getByRole('button', { name: nombreBoton }).click()
  await page.waitForSelector('#btn-home', { timeout: 5_000 })
  await page.locator('#btn-home').click()
  await page.waitForSelector('.home-view', { timeout: 5_000 })
}

async function avanzar(page, ms) {
  await page.clock.fastForward(ms)
  await page.reload()
  await page.waitForSelector('.home-view', { timeout: 10_000 })
}

async function pendientes(page) {
  return Number(await page.locator('.counter--due .counter__number').textContent())
}

test.describe('Intervalos cortos — Olvidada y Difícil', () => {

  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: DIA_INICIO })
    await resetApp(page)
    await instalarUnaTarjeta(page)
  })

  // ── Olvidada (4 horas) ──────────────────────────────────────────────────────

  test('Olvidada — la tarjeta NO vuelve antes de 4 horas', async ({ page }) => {
    await calificarCon(page, /olvidada/i)
    await avanzar(page, 3 * H)
    expect(await pendientes(page)).toBe(0)
  })

  test('Olvidada — la tarjeta vuelve a las 4 horas', async ({ page }) => {
    await calificarCon(page, /olvidada/i)
    await avanzar(page, 4 * H + 1)
    expect(await pendientes(page)).toBe(1)
  })

  // ── Difícil (8 horas) ───────────────────────────────────────────────────────

  test('Difícil — la tarjeta NO vuelve antes de 8 horas', async ({ page }) => {
    await calificarCon(page, /difícil/i)
    await avanzar(page, 7 * H)
    expect(await pendientes(page)).toBe(0)
  })

  test('Difícil — la tarjeta vuelve a las 8 horas', async ({ page }) => {
    await calificarCon(page, /difícil/i)
    await avanzar(page, 8 * H + 1)
    expect(await pendientes(page)).toBe(1)
  })

  // ── Buena (intervalo de 1 día como Perfecta en primera revisión) ────────────

  test('Buena — en primera revisión, la tarjeta vuelve al día siguiente', async ({ page }) => {
    await calificarCon(page, /buena/i)
    await avanzar(page, 25 * H)
    expect(await pendientes(page)).toBe(1)
  })

})
