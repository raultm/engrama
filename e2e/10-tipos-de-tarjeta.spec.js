/**
 * TIPOS DE TARJETA — Cloze y Oclusión de imagen
 *
 * La app soporta tres tipos de tarjeta además de basic y tsumego.
 * Este spec verifica que el demo de Atmósfera (que contiene los tres tipos)
 * renderiza correctamente cada uno durante una sesión de estudio.
 *
 * Estrategia: iterar por todas las tarjetas de la sesión y verificar
 * que al menos una tenga los elementos característicos de cada tipo.
 */
import { test, expect } from '@playwright/test'
import { resetApp, installAtmosferaDemo, startStudySession } from './helpers.js'

/** Avanza por todas las tarjetas de la sesión calificando Buena */
async function completarSesion(page) {
  while (true) {
    const enEstudio = await page.locator('.study-view').isVisible().catch(() => false)
    if (!enEstudio) break

    const hayRespuesta = await page.locator('.rating-buttons').isVisible().catch(() => false)
    if (!hayRespuesta) {
      const btnMostrar = page.getByRole('button', { name: /mostrar respuesta/i })
      const visible = await btnMostrar.isVisible({ timeout: 2_000 }).catch(() => false)
      if (!visible) break
      await btnMostrar.click()
      await page.locator('.rating-buttons').waitFor({ state: 'visible', timeout: 5_000 })
    }
    await page.getByRole('button', { name: /buena/i }).click()
    await page.waitForTimeout(500)

    // Si la sesión terminó, aparece #btn-home
    const fin = await page.locator('#btn-home').isVisible({ timeout: 800 }).catch(() => false)
    if (fin) {
      await page.locator('#btn-home').click()
      await page.waitForSelector('.home-view', { timeout: 5_000 })
      break
    }
  }
}

test.describe('Tipos de tarjeta — Cloze y Oclusión de imagen', () => {

  test.beforeEach(async ({ page }) => {
    await resetApp(page)
    await installAtmosferaDemo(page)
  })

  test('el demo de Atmósfera contiene tarjetas cloze con huecos', async ({ page }) => {
    await startStudySession(page)

    let encontrado = false
    for (let i = 0; i < 9; i++) {
      const esCloze = await page.locator('.cloze-blank').isVisible({ timeout: 500 }).catch(() => false)
      if (esCloze) { encontrado = true; break }

      const hayRespuesta = await page.locator('.rating-buttons').isVisible().catch(() => false)
      if (!hayRespuesta) {
        await page.getByRole('button', { name: /mostrar respuesta/i }).click()
        await page.locator('.rating-buttons').waitFor({ state: 'visible', timeout: 5_000 })
      }
      await page.getByRole('button', { name: /buena/i }).click()
      await page.waitForTimeout(400)
      const fin = await page.locator('#btn-home').isVisible({ timeout: 500 }).catch(() => false)
      if (fin) break
    }

    expect(encontrado, 'Se esperaba al menos una tarjeta cloze con .cloze-blank').toBe(true)
  })

  test('al revelar una cloze, el hueco se reemplaza por la respuesta', async ({ page }) => {
    await startStudySession(page)

    for (let i = 0; i < 9; i++) {
      const esCloze = await page.locator('.cloze-blank').isVisible({ timeout: 500 }).catch(() => false)
      if (esCloze) {
        await page.getByRole('button', { name: /mostrar respuesta/i }).click()
        await expect(page.locator('.cloze-answer')).toBeVisible({ timeout: 3_000 })
        await expect(page.locator('.cloze-blank')).toBeHidden()
        return
      }
      const hayRespuesta = await page.locator('.rating-buttons').isVisible().catch(() => false)
      if (!hayRespuesta) {
        await page.getByRole('button', { name: /mostrar respuesta/i }).click()
        await page.locator('.rating-buttons').waitFor({ state: 'visible', timeout: 5_000 })
      }
      await page.getByRole('button', { name: /buena/i }).click()
      await page.waitForTimeout(400)
      const fin = await page.locator('#btn-home').isVisible({ timeout: 500 }).catch(() => false)
      if (fin) break
    }
  })

  test('el demo de Atmósfera contiene tarjetas de oclusión de imagen', async ({ page }) => {
    await startStudySession(page)

    let encontrado = false
    for (let i = 0; i < 9; i++) {
      const esOcclusion = await page.locator('.occlusion-container').isVisible({ timeout: 500 }).catch(() => false)
      if (esOcclusion) { encontrado = true; break }

      const hayRespuesta = await page.locator('.rating-buttons').isVisible().catch(() => false)
      if (!hayRespuesta) {
        await page.getByRole('button', { name: /mostrar respuesta/i }).click()
        await page.locator('.rating-buttons').waitFor({ state: 'visible', timeout: 5_000 })
      }
      await page.getByRole('button', { name: /buena/i }).click()
      await page.waitForTimeout(400)
      const fin = await page.locator('#btn-home').isVisible({ timeout: 500 }).catch(() => false)
      if (fin) break
    }

    expect(encontrado, 'Se esperaba al menos una tarjeta con .occlusion-container').toBe(true)
  })

  test('la tarjeta de oclusión muestra el SVG overlay con máscaras', async ({ page }) => {
    await startStudySession(page)

    for (let i = 0; i < 9; i++) {
      const esOcclusion = await page.locator('.occlusion-container').isVisible({ timeout: 500 }).catch(() => false)
      if (esOcclusion) {
        await expect(page.locator('.occlusion-svg-overlay')).toBeVisible()
        await expect(page.locator('.occlusion-image')).toBeVisible()
        return
      }
      const hayRespuesta = await page.locator('.rating-buttons').isVisible().catch(() => false)
      if (!hayRespuesta) {
        await page.getByRole('button', { name: /mostrar respuesta/i }).click()
        await page.locator('.rating-buttons').waitFor({ state: 'visible', timeout: 5_000 })
      }
      await page.getByRole('button', { name: /buena/i }).click()
      await page.waitForTimeout(400)
      const fin = await page.locator('#btn-home').isVisible({ timeout: 500 }).catch(() => false)
      if (fin) break
    }
  })

  test('al revelar una oclusión, la máscara activa desaparece', async ({ page }) => {
    await startStudySession(page)

    for (let i = 0; i < 9; i++) {
      const esOcclusion = await page.locator('.occlusion-container').isVisible({ timeout: 500 }).catch(() => false)
      if (esOcclusion) {
        // Antes de revelar, el SVG tiene formas rellenas (fill != none)
        const antesCount = await page.locator('.occlusion-svg-overlay rect, .occlusion-svg-overlay ellipse, .occlusion-svg-overlay polygon').count()
        await page.getByRole('button', { name: /mostrar respuesta/i }).click()
        // Esperar que el reveal asíncrono (ImageStore.get) termine
        await page.locator('.rating-buttons').waitFor({ state: 'visible', timeout: 5_000 })
        // Después de revelar, la máscara activa tiene fill="none" (revelada)
        const noneCount = await page.locator('.occlusion-svg-overlay [fill="none"]').count()
        expect(noneCount).toBeGreaterThan(0)
        expect(antesCount).toBeGreaterThan(0)
        return
      }
      const hayRespuesta = await page.locator('.rating-buttons').isVisible().catch(() => false)
      if (!hayRespuesta) {
        await page.getByRole('button', { name: /mostrar respuesta/i }).click()
        await page.locator('.rating-buttons').waitFor({ state: 'visible', timeout: 5_000 })
      }
      await page.getByRole('button', { name: /buena/i }).click()
      await page.waitForTimeout(400)
      const fin = await page.locator('#btn-home').isVisible({ timeout: 500 }).catch(() => false)
      if (fin) break
    }
  })

})
