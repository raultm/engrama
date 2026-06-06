/**
 * Helpers compartidos para los tests de Engrama.
 *
 * Cada test arranca con la app limpia (sin engramas instalados) para
 * garantizar que los resultados son reproducibles.
 */

/** Limpia todos los datos del navegador y recarga la app desde cero */
export async function resetApp(page) {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    indexedDB.deleteDatabase('engrama')
  })
  await page.reload()
  await page.waitForSelector('.seed-selection-view', { timeout: 10_000 })
}

/** Instala el demo de Tsumego básicos y espera a que cargue la pantalla de inicio */
export async function installTsumegoDemo(page) {
  await page.getByRole('button', { name: /Tsumego básicos/i }).click()
  await page.waitForSelector('#dm-skip', { timeout: 8_000 })
  await page.locator('#dm-skip').click()
  await page.waitForSelector('.home-view', { timeout: 15_000 })
}

/** Instala el demo de Atmósfera y espera a que cargue la pantalla de inicio */
export async function installAtmosferaDemo(page) {
  await page.getByRole('button', { name: /Capas de la Atmósfera/i }).click()
  await page.waitForSelector('#dm-skip', { timeout: 8_000 })
  await page.locator('#dm-skip').click()
  await page.waitForSelector('.home-view', { timeout: 15_000 })
}

/** Inicia una sesión de estudio desde la pantalla de inicio */
export async function startStudySession(page) {
  await page.getByRole('button', { name: /estudiar|repasar|explorar|ponerse al día/i }).click()
  await page.waitForSelector('.study-view', { timeout: 10_000 })
}
