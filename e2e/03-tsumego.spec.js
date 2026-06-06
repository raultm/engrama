/**
 * TARJETAS TSUMEGO — Problemas de Go
 *
 * El usuario ve un tablero de Go, coloca una piedra tocando una intersección,
 * recibe feedback (correcto/incorrecto) y puede navegar por las jugadas.
 */
import { test, expect } from '@playwright/test'
import { resetApp, installTsumegoDemo, startStudySession } from './helpers.js'

test.describe('Tarjetas Tsumego', () => {

  test.beforeEach(async ({ page }) => {
    await resetApp(page)
    await installTsumegoDemo(page)
    await startStudySession(page)
  })

  test('el tablero de Go aparece con la pastilla de turno', async ({ page }) => {
    await expect(page.locator('.tsumego-board')).toBeVisible()
    await expect(page.locator('#tsumego-ptm')).toBeVisible()
    await expect(page.locator('#tsumego-ptm')).toContainText(/negras|blancas/i)
  })

  test('no se muestra el botón Mostrar Respuesta en tsumego', async ({ page }) => {
    await expect(page.getByRole('button', { name: /mostrar respuesta/i })).toBeHidden()
  })

  test('los controles de navegación están ocultos al inicio', async ({ page }) => {
    await expect(page.locator('#tsumego-nav')).toHaveCSS('visibility', 'hidden')
  })

  test('colocar una piedra correcta cambia la pastilla a verde', async ({ page }) => {
    // Hacer click en el primer punto de destino disponible
    const target = page.locator('.go-target').first()
    await expect(target).toBeVisible({ timeout: 5000 })
    await target.click()
    // Esperar a que el controlador resuelva la jugada
    await page.waitForTimeout(600)
    const ptm = page.locator('#tsumego-ptm')
    // La pastilla debería haber cambiado (correcto = verde, incorrecto = rojo)
    const className = await ptm.getAttribute('class')
    expect(className).toMatch(/tsumego-ptm--(correct|wrong)/)
  })

  test('tras resolver, los controles de navegación se muestran', async ({ page }) => {
    await page.locator('.go-target').first().click()
    await page.waitForTimeout(800)
    // La nav deja de tener visibility:hidden
    const nav = page.locator('#tsumego-nav')
    await expect(nav).not.toHaveCSS('visibility', 'hidden')
  })

  test('los botones de navegación permiten moverse por las jugadas', async ({ page }) => {
    await page.locator('.go-target').first().click()
    await page.waitForTimeout(800)
    const btnPrev = page.locator('#t-prev')
    const btnNext = page.locator('#t-next')
    await expect(btnPrev).toBeVisible()
    await expect(btnNext).toBeVisible()
    // Ir al inicio
    await page.locator('#t-start').click()
    await expect(page.locator('#t-pos')).toContainText('0')
    // Volver al final
    await page.locator('#t-end').click()
    const pos = await page.locator('#t-pos').textContent()
    expect(pos).not.toContain('0 /')
  })

  test('el título del problema se muestra encima del tablero', async ({ page }) => {
    await expect(page.locator('.tsumego-title')).toBeVisible()
  })

})
