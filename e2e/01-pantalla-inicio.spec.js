/**
 * PANTALLA DE INICIO — Selección de Engrama
 *
 * Un usuario nuevo ve esta pantalla al abrir la app por primera vez.
 * Debe poder entender qué opciones tiene y acceder a ellas.
 */
import { test, expect } from '@playwright/test'
import { resetApp } from './helpers.js'

test.describe('Pantalla de inicio — Selección de Engrama', () => {

  test.beforeEach(async ({ page }) => {
    await resetApp(page)
  })

  test('muestra las tres secciones: IMPORTAR, MAZOS y DEMOS', async ({ page }) => {
    await expect(page.locator('.seed-section-title', { hasText: 'IMPORTAR' })).toBeVisible()
    await expect(page.locator('.seed-section-title', { hasText: 'MAZOS' })).toBeVisible()
    await expect(page.locator('.seed-section-title', { hasText: 'DEMOS' })).toBeVisible()
  })

  test('muestra la opción de subir archivo con los formatos aceptados', async ({ page }) => {
    await expect(page.getByText('Subir archivo')).toBeVisible()
    await expect(page.getByText(/\.apkg/)).toBeVisible()
  })

  test('muestra la opción de unirse a una clase con código', async ({ page }) => {
    await expect(page.getByRole('button', { name: /unirse a una clase/i })).toBeVisible()
  })

  test('muestra los demos con descripción explicativa', async ({ page }) => {
    await expect(page.getByText(/prueba diferentes tipos de tarjeta/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /tsumego básicos/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /capas de la atmósfera/i })).toBeVisible()
  })

  test('el mazo de 150 tsumegos aparece primero en la sección MAZOS', async ({ page }) => {
    const mazosSection = page.locator('.seed-list')
    const firstSeed = mazosSection.locator('[data-id]').first()
    await expect(firstSeed).toContainText(/150/i)
  })

  test('instalar el demo de Tsumego básicos lleva a la pantalla principal', async ({ page }) => {
    await page.getByRole('button', { name: /tsumego básicos/i }).click()
    await page.waitForSelector('#dm-skip', { timeout: 8_000 })
    await page.locator('#dm-skip').click()
    await expect(page.locator('.home-view')).toBeVisible({ timeout: 15_000 })
  })

  test('después de instalar un engrama aparece el botón Volver', async ({ page }) => {
    await page.getByRole('button', { name: /tsumego básicos/i }).click()
    await page.waitForSelector('#dm-skip', { timeout: 8_000 })
    await page.locator('#dm-skip').click()
    await page.waitForSelector('.home-view', { timeout: 15_000 })
    // Abrir el selector de engrama para llegar a la pantalla de selección
    await page.locator('#engrama-select').selectOption('__add__')
    await page.waitForSelector('.seed-selection-view', { timeout: 5_000 })
    await expect(page.locator('#btn-back')).toBeVisible()
  })

})
