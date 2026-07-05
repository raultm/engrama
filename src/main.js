import { initContainer } from './infrastructure/container.js'
import { initRouter, defineRoute } from './ui/router.js'
import { HomeView } from './ui/views/HomeView.js'
import { StudyView } from './ui/views/StudyView.js'
import { StatsView } from './ui/views/StatsView.js'
import { SeedSelectionView } from './ui/views/SeedSelectionView.js'
import { buildSeedRegistry } from './data/seedRegistry.js'
import { initTheme } from './ui/theme.js'
import { getActiveId } from './ui/engramaRegistry.js'
import { loadAppConfig } from './config.js'

initTheme()

async function boot() {
  const app = document.getElementById('app')

  try {
    const config = await loadAppConfig()
    document.title = config.appTitle

    const activeId = getActiveId()

    if (!activeId) {
      const registry = await buildSeedRegistry()
      SeedSelectionView(app, registry)
      return
    }

    const container = await initContainer(activeId)

    if (!container.db.isSeeded()) {
      const registry = await buildSeedRegistry()
      SeedSelectionView(app, registry)
      return
    }

    startRouter(app)
  } catch (err) {
    console.error('Boot error:', err)
    app.innerHTML = `
      <div class="error-screen">
        <h1>Error al iniciar</h1>
        <p>${err.message}</p>
        <button onclick="localStorage.clear(); location.reload()" class="btn btn--primary">
          Reiniciar todo
        </button>
      </div>
    `
  }
}

function startRouter(app) {
  defineRoute('/', (el) => HomeView(el))
  defineRoute('/study', (el) => StudyView(el))
  defineRoute('/stats', (el) => StatsView(el))
  defineRoute('*', (el) => HomeView(el))
  initRouter(app)
}

boot()
