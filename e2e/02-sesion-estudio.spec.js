/**
 * SESIÓN DE ESTUDIO — Flujo básico
 *
 * Un usuario con tarjetas pendientes puede iniciar una sesión,
 * ver las tarjetas, revelar la respuesta y calificarlas.
 * Al terminar, el contador de pendientes baja.
 */
import { test, expect } from '@playwright/test'
import { resetApp, installAtmosferaDemo, startStudySession } from './helpers.js'

test.describe('Sesión de estudio', () => {

  test.beforeEach(async ({ page }) => {
    await resetApp(page)
    await installAtmosferaDemo(page)
  })

  test('la pantalla de inicio muestra tarjetas pendientes', async ({ page }) => {
    const counter = page.locator('.counter--due .counter__number')
    const due = await counter.textContent()
    expect(Number(due)).toBeGreaterThan(0)
  })

  test('el botón de estudio arranca la sesión', async ({ page }) => {
    await startStudySession(page)
    await expect(page.locator('.study-view')).toBeVisible()
  })

  test('la tarjeta muestra el frente y el botón Mostrar Respuesta', async ({ page }) => {
    await startStudySession(page)
    await expect(page.locator('.flashcard')).toBeVisible()
    await expect(page.getByRole('button', { name: /mostrar respuesta/i })).toBeVisible()
  })

  test('al revelar la respuesta aparecen los 4 botones de calificación', async ({ page }) => {
    await startStudySession(page)
    await page.getByRole('button', { name: /mostrar respuesta/i }).click()
    await expect(page.locator('.rating-buttons')).toBeVisible()
    await expect(page.getByRole('button', { name: /perfecta/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /buena/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /difícil/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /olvidada/i })).toBeVisible()
  })

  test('calificar una tarjeta avanza a la siguiente', async ({ page }) => {
    await startStudySession(page)
    await page.getByRole('button', { name: /mostrar respuesta/i }).click()
    const before = await page.locator('.study-progress').textContent()
    await page.getByRole('button', { name: /buena/i }).click()
    // Esperar a que avance (puede ir a siguiente tarjeta o volver al inicio)
    await page.waitForTimeout(500)
    const after = await page.locator('.study-progress').textContent().catch(() => null)
    // O el progreso cambia, o hemos terminado la sesión
    const sessionEnded = await page.locator('.home-view').isVisible().catch(() => false)
    expect(sessionEnded || after !== before).toBeTruthy()
  })

  test('el botón Volver abandona la sesión y regresa al inicio', async ({ page }) => {
    await startStudySession(page)
    await page.locator('#btn-exit').click()
    await page.waitForSelector('#cm-confirm', { timeout: 3_000 })
    await page.locator('#cm-confirm').click()
    await expect(page.locator('.home-view')).toBeVisible({ timeout: 5_000 })
  })

})
