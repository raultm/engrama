/**
 * MULTI-ENGRAMA — Instalación y cambio entre Engramas
 *
 * La app permite tener varios Engramas instalados de forma independiente.
 * Cada uno tiene sus propias tarjetas, estadísticas y progreso.
 * El usuario puede cambiar entre ellos desde el selector del header.
 */
import { test, expect } from '@playwright/test'
import { resetApp, installTsumegoDemo, installAtmosferaDemo } from './helpers.js'

test.describe('Multi-Engrama', () => {

  test('instalar dos demos muestra ambos en el selector', async ({ page }) => {
    await resetApp(page)
    await installTsumegoDemo(page)

    // Volver a la selección e instalar el segundo
    await page.locator('#engrama-select').selectOption('__add__')
    await page.waitForSelector('.seed-selection-view', { timeout: 5_000 })
    await installAtmosferaDemo(page)

    // El selector debe tener al menos 2 opciones de engrama (+ la de añadir)
    const options = await page.locator('#engrama-select option').count()
    expect(options).toBeGreaterThanOrEqual(3)
  })

  test('cada Engrama muestra sus propias tarjetas pendientes', async ({ page }) => {
    await resetApp(page)
    await installTsumegoDemo(page)
    const dueTsumego = Number(await page.locator('.counter--due .counter__number').textContent())

    // Cambiar al segundo Engrama
    await page.locator('#engrama-select').selectOption('__add__')
    await page.waitForSelector('.seed-selection-view', { timeout: 5_000 })
    await installAtmosferaDemo(page)
    const dueAtmosfera = Number(await page.locator('.counter--due .counter__number').textContent())

    // Ambos tienen tarjetas y números distintos (7 tsumego, 9 atmosfera)
    expect(dueTsumego).toBeGreaterThan(0)
    expect(dueAtmosfera).toBeGreaterThan(0)
    expect(dueTsumego).not.toBe(dueAtmosfera)
  })

  test('cambiar de Engrama desde el selector recarga con los datos correctos', async ({ page }) => {
    await resetApp(page)
    await installTsumegoDemo(page)

    await page.locator('#engrama-select').selectOption('__add__')
    await page.waitForSelector('.seed-selection-view', { timeout: 5_000 })
    await installAtmosferaDemo(page)

    // Ahora deberíamos estar en Atmósfera — volver a Tsumego
    const options = await page.locator('#engrama-select option').all()
    const tsumego = options.find(async o => /tsumego/i.test(await o.textContent()))

    // Seleccionar el primer engrama instalado (tsumego)
    const firstId = await page.locator('#engrama-select option').first().getAttribute('value')
    await page.locator('#engrama-select').selectOption(firstId)

    // Espera la recarga tras cambiar de engrama
    await page.waitForLoadState('domcontentloaded', { timeout: 10_000 })
    await page.waitForSelector('.home-view', { timeout: 10_000 })

    // El selector debe mostrar el engrama activo correcto
    const selectedValue = await page.locator('#engrama-select').inputValue()
    expect(selectedValue).toBe(firstId)
  })

  test('el botón Volver en la selección regresa al Engrama activo', async ({ page }) => {
    await resetApp(page)
    await installTsumegoDemo(page)

    // Abrir selector de engrama
    await page.locator('#engrama-select').selectOption('__add__')
    await page.waitForSelector('#btn-back', { timeout: 5_000 })
    await page.locator('#btn-back').click()
    await expect(page.locator('.home-view')).toBeVisible({ timeout: 5_000 })
  })

})
