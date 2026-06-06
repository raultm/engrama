/**
 * IMPORTAR .APKG — Importación de ficheros Anki
 *
 * El formato .apkg (ZIP con SQLite dentro) es el formato nativo de Anki.
 * Este spec verifica que el flujo de importación vía fichero funciona
 * end-to-end: subir el fichero → modal de deadline → pantalla de inicio
 * con tarjetas cargadas.
 */
import { test, expect } from '@playwright/test'
import { resetApp } from './helpers.js'

const APKG_PATH = 'public/seeds/test-atmosfera.apkg'

test.describe('Importar .apkg', () => {

  test.beforeEach(async ({ page }) => {
    await resetApp(page)
  })

  test('subir un .apkg muestra el modal de deadline', async ({ page }) => {
    await page.locator('#file-upload').setInputFiles(APKG_PATH)
    // El modal de deadline aparece antes del reload
    await expect(page.locator('#dm-skip')).toBeVisible({ timeout: 15_000 })
  })

  test('importar .apkg y saltar deadline lleva al inicio con tarjetas', async ({ page }) => {
    await page.locator('#file-upload').setInputFiles(APKG_PATH)
    await page.waitForSelector('#dm-skip', { timeout: 15_000 })
    await page.locator('#dm-skip').click()
    await page.waitForSelector('.home-view', { timeout: 15_000 })

    // Debe haber tarjetas pendientes (test-atmosfera tiene al menos 1)
    const due = Number(await page.locator('.counter--due .counter__number').textContent())
    expect(due).toBeGreaterThan(0)
  })

  test('importar .apkg registra el engrama en el selector', async ({ page }) => {
    await page.locator('#file-upload').setInputFiles(APKG_PATH)
    await page.waitForSelector('#dm-skip', { timeout: 15_000 })
    await page.locator('#dm-skip').click()
    await page.waitForSelector('.home-view', { timeout: 15_000 })

    // El selector debe tener al menos 2 opciones: el engrama + "Añadir"
    const options = await page.locator('#engrama-select option').count()
    expect(options).toBeGreaterThanOrEqual(2)
  })

  test('importar .apkg permite estudiar las tarjetas', async ({ page }) => {
    await page.locator('#file-upload').setInputFiles(APKG_PATH)
    await page.waitForSelector('#dm-skip', { timeout: 15_000 })
    await page.locator('#dm-skip').click()
    await page.waitForSelector('.home-view', { timeout: 15_000 })

    // Iniciar sesión de estudio
    await page.getByRole('button', { name: /estudiar|repasar|explorar|ponerse al día/i }).click()
    await page.waitForSelector('.study-view', { timeout: 10_000 })

    // Aparece la primera tarjeta
    await expect(page.locator('#btn-reveal')).toBeVisible()
  })

})
