/**
 * PWA Y AJUSTES — Actualización, tema y estadísticas
 *
 * Comprueba que las funciones de gestión de la app funcionan:
 * el botón de actualización, el cambio de tema, la pantalla de estadísticas
 * y que la versión de la app es visible.
 */
import { test, expect } from '@playwright/test'
import { resetApp, installTsumegoDemo } from './helpers.js'

test.describe('PWA y ajustes', () => {

  test.beforeEach(async ({ page }) => {
    await resetApp(page)
    await installTsumegoDemo(page)
  })

  test('el botón de buscar actualización está visible en el header', async ({ page }) => {
    await expect(page.locator('#btn-update')).toBeVisible()
  })

  test('al pulsar el botón de actualización se deshabilita y luego vuelve', async ({ page }) => {
    await page.locator('#btn-update').click()
    // Se deshabilita inmediatamente
    await expect(page.locator('#btn-update')).toBeDisabled()
    // Después de unos segundos vuelve a estar disponible (no hay SW en dev)
    await expect(page.locator('#btn-update')).toBeEnabled({ timeout: 15_000 })
  })

  test('el botón de tema cambia entre claro y oscuro', async ({ page }) => {
    const html = page.locator('html')
    const themeBefore = await html.getAttribute('data-theme')
    await page.locator('#btn-theme').click()
    const themeAfter = await html.getAttribute('data-theme')
    expect(themeAfter).not.toBe(themeBefore)
  })

  test('el botón de estadísticas abre la pantalla de estadísticas', async ({ page }) => {
    await page.locator('#btn-stats').click()
    await expect(page.locator('.view-header')).toBeVisible()
    await expect(page.locator('.stats-main')).toBeVisible()
  })

  test('la pantalla de estadísticas muestra la versión de la app', async ({ page }) => {
    await page.locator('#btn-stats').click()
    await expect(page.locator('.app-version')).toBeVisible()
    const version = await page.locator('.app-version').textContent()
    expect(version).toMatch(/v\d+\.\d+/)
  })

  test('se puede volver al inicio desde estadísticas', async ({ page }) => {
    await page.locator('#btn-stats').click()
    await page.getByRole('button', { name: /volver/i }).click()
    await expect(page.locator('.home-view')).toBeVisible()
  })

})
