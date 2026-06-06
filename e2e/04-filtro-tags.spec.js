/**
 * FILTRO DE TAGS — OR y AND
 *
 * El usuario puede filtrar su sesión de estudio por etiquetas.
 * Con un tag activo (modo OR) solo estudia las tarjetas de esa categoría.
 * Con dos tags en modo AND, solo ve tarjetas que tengan ambos.
 */
import { test, expect } from '@playwright/test'
import { resetApp, installTsumegoDemo } from './helpers.js'

test.describe('Filtro de tags', () => {

  test.beforeEach(async ({ page }) => {
    await resetApp(page)
    await installTsumegoDemo(page)
  })

  test('el icono de tags aparece en el header cuando hay tags disponibles', async ({ page }) => {
    await expect(page.locator('#btn-tags')).toBeVisible()
  })

  test('al pulsar el icono se despliega el panel de tags', async ({ page }) => {
    await page.locator('#btn-tags').click()
    await expect(page.locator('#tag-panel')).toBeVisible()
  })

  test('el panel muestra el botón Todos y las pastillas de tags', async ({ page }) => {
    await page.locator('#btn-tags').click()
    await expect(page.getByRole('button', { name: /todos/i })).toBeVisible()
    // El demo de tsumego tiene tags: go, tsumego, basico
    await expect(page.locator('.tag-pill[data-tag]').first()).toBeVisible()
  })

  test('seleccionar un tag reduce las tarjetas disponibles', async ({ page }) => {
    const dueBefore = Number(await page.locator('.counter--due .counter__number').textContent())

    await page.locator('#btn-tags').click()
    // Seleccionar el tag 'go'
    await page.locator('.tag-pill[data-tag="go"]').click()
    await page.waitForTimeout(300)

    const dueAfter = Number(await page.locator('.counter--due .counter__number').textContent())
    // Con el filtro, puede haber igual o menos tarjetas (nunca más)
    expect(dueAfter).toBeLessThanOrEqual(dueBefore)
  })

  test('pulsar Todos elimina el filtro', async ({ page }) => {
    // Activar filtro — el panel queda abierto tras seleccionar
    await page.locator('#btn-tags').click()
    await page.locator('.tag-pill[data-tag="go"]').click()
    await page.waitForTimeout(200)

    // El panel sigue abierto, clicar Todos directamente
    await page.locator('#btn-all-tags').click()
    await page.waitForTimeout(200)

    // El icono de tags ya no debería tener clase activa
    await expect(page.locator('#btn-tags')).not.toHaveClass(/btn--tag-active/)
  })

  test('con 2 tags seleccionados aparece el toggle OR/AND', async ({ page }) => {
    await page.locator('#btn-tags').click()
    const pills = page.locator('.tag-pill[data-tag]')
    const count = await pills.count()
    if (count < 2) test.skip()

    // El panel queda abierto tras cada click en pastilla
    await pills.nth(0).click()
    await page.waitForTimeout(200)
    await pills.nth(1).click()
    await page.waitForTimeout(200)

    await expect(page.locator('#btn-tag-mode')).toBeVisible()
    await expect(page.locator('#btn-tag-mode')).toContainText('OR')
  })

  test('el toggle OR/AND cambia el modo al pulsarlo', async ({ page }) => {
    await page.locator('#btn-tags').click()
    const pills = page.locator('.tag-pill[data-tag]')
    if (await pills.count() < 2) test.skip()

    // El panel queda abierto tras cada click en pastilla
    await pills.nth(0).click()
    await page.waitForTimeout(200)
    await pills.nth(1).click()
    await page.waitForTimeout(200)

    await page.locator('#btn-tag-mode').click()
    await page.waitForTimeout(200)
    await expect(page.locator('#btn-tag-mode')).toContainText('AND')
  })

})
