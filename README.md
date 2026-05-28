# Engrama

Aplicación web de flashcards con repetición espaciada, sistema ELO y desbloqueo progresivo de contenido. Funciona completamente en el navegador — sin backend, sin servidor.

## Setup

```bash
npm install
npm run setup   # copia los binarios de sql.js a public/
npm run dev
```

Abre `http://localhost:5173`. La primera vez aparece la pantalla de selección de Engrama.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run setup` | Copia los binarios de sql.js desde `node_modules` a `public/`. Necesario tras `npm install`. |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción en `dist/` |
| `npm test` | Tests unitarios |
| `npm run test:watch` | Tests en modo watch |

## Funcionalidades

### Engramas
- Cada Engrama es un contexto de aprendizaje con su propia base de datos aislada
- Selector de Engrama en el header para cambiar entre ellos
- Añadir nuevos Engramas en cualquier momento desde el selector
- Cada Engrama tiene su propio ELO, rango y progreso

### Estudio
- Repetición espaciada con algoritmo **SM2**
- Sesiones de **10 tarjetas** con orden aleatorio
- 4 botones de calificación: Olvidada / Difícil / Buena / Perfecta
- Sin límite de sesiones por día

### Progresión
- Sistema **ELO** por Engrama: el ELO sube o baja según dificultad de las tarjetas respondidas
- Sistema de **rangos**: Curioso → Aprendiz → Estudiante → Practicante → Conocedor → Experto → Maestro → Gran Maestro
- **Desbloqueo progresivo**: las tarjetas difíciles se desbloquean al subir de ELO

### Mazos incluidos
- El juego del Go — 50 tarjetas
- Astrofísica — 45 tarjetas
- Sesgos cognitivos — 50 tarjetas
- Spring Boot — 50 tarjetas
- Adolescencia y crianza — 94 tarjetas

### Importación de mazos
Desde **Estadísticas → Importar archivo de datos** puedes subir un archivo `.json` o `.md`:

- **Mismo Engrama** (mismo ID de colección): sincronización inteligente — añade las tarjetas nuevas, elimina las borradas del archivo y **preserva el ELO y el progreso** de las tarjetas existentes.
- **Engrama diferente**: reemplaza todos los datos del Engrama activo por el contenido del archivo.

Esto permite actualizar el contenido de un mazo sin perder tu historial de estudio.

### Datos
- Base de datos **SQLite en el navegador** (sql.js), persistida en localStorage
- Descargar la base de datos como `.db`
- Eliminar un Engrama individual desde Estadísticas

### UI
- Tema **oscuro y claro**
- Diseño responsive (móvil y escritorio)
- Sin frameworks de UI

## Crear tu propio mazo

Crea un archivo `.md` en `src/data/seeds/` y reinicia el servidor — aparece automáticamente en la pantalla de selección.

**Formato:**
```markdown
---
name: Nombre del mazo
description: Descripción breve
schedulerType: sm2
---

## Pregunta de la tarjeta

Respuesta de la tarjeta.

<!-- tags:tag1,tag2 elo:1500 locked:true -->
```

- `elo` — dificultad de la tarjeta (default 1500). Las tarjetas con `elo > 1500` empiezan bloqueadas.
- `locked:true` — fuerza el bloqueo inicial independientemente del ELO.
- `tags` — etiquetas separadas por coma.

También se admite formato **JSON** con la misma estructura que los mazos existentes.

## Despliegue en GitHub Pages

1. En GitHub: *Settings → Pages → Source → GitHub Actions*
2. Push a `main` — el workflow construye y despliega automáticamente

## Stack

- JavaScript (sin TypeScript)
- Vite + Vitest
- sql.js (SQLite en WASM)
- CSS con custom properties (sin frameworks)
