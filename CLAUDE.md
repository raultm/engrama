# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install && npm run setup   # first-time setup (copies sql.js WASM binaries to public/)
npm run dev                    # dev server at http://localhost:5173
npm run build                  # production build → dist/
npm test                       # run all unit tests (Vitest, Node env)
npm run test:watch             # tests in watch mode
npx vitest run src/tests/domain/FlashCard.test.js  # single test file
node scripts/generate-test-apkg.mjs  # regenerate public/seeds/test-atmosfera.apkg
```

The dev server requires `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers (configured in vite.config.js) for SharedArrayBuffer support needed by sql.js WASM.

## Architecture

### Storage — two layers

**SQLite in the browser** (sql.js WASM) persisted to `localStorage` as a byte array under the key `engrama_db_{engramaId}`. Each Engrama is a fully isolated database. `DatabaseAdapter` wraps sql.js with `run()`, `queryAll()`, `queryOne()` and calls `persist()` after every write.

**IndexedDB** (`src/infrastructure/db/ImageStore.js`) stores image data URLs for image-occlusion cards. Images are kept out of SQLite to avoid hitting localStorage size limits. Keys are `anki-img-{filename}`.

Schema migrations are additive `ALTER TABLE … ADD COLUMN … DEFAULT` statements inside `_migrate()`, wrapped in `try/catch` to be idempotent.

### Card type system — Strategy pattern

`src/ui/card-strategies/CardStrategy.js` defines the interface:
- `renderQuestion(card)` → HTML string
- `renderAnswer(card)` → HTML string (replaces question content on reveal — there is no separate back section in the DOM)
- `getLabels()` → `{ question, answer }`

`CardRenderer.js` maintains a registry `{ basic, cloze, image_occlusion }` and exposes `fillCardContent` / `fillAnswerContent`. The `StudyView` calls these; `reveal()` calls `fillAnswerContent` which replaces `questionEl.innerHTML`.

To add a new card type: create a strategy class, add it to the registry in `CardRenderer.js`, add a `card_type` value to the DB migration, and handle the new type in `AnkiImporter._convertNote`.

Card-specific data beyond `frontText`/`backText` lives in `extraData` (JSON blob in `extra_data` column). Schema:
- `cloze`: `{ clozeIndex: N }`
- `image_occlusion`: `{ imageId, masks: [{id, type, x, y, w, h, points?, label}], activeMaskId, header, backExtra }`

### Image occlusion rendering

Uses an inline SVG overlay (`viewBox="0 0 1 1" preserveAspectRatio="none"`) positioned absolute over the image. Coordinates are normalized (0–1) relative to image dimensions. Supports `rect`, `ellipse`, and `polygon` (with `points` array). No JavaScript positioning — the SVG coordinate system handles it natively. **Do not use `getBoundingClientRect()` for mask positioning** — the `cardIn` animation uses `scale(0.98)` which makes it return scaled values.

### Anki import (.apkg)

`AnkiImporter.js` handles Anki 2.x and 24.x:
- `.apkg` is a ZIP; extract `collection.anki2` (old) or `collection.anki21b` (new, zstd-compressed)
- The `media` index file is also zstd-compressed in Anki 24.x, in protobuf format (not JSON)
- Media files themselves are individually zstd-compressed in Anki 24.x
- New schema: `col.models` and `col.decks` are empty strings → fall back to `notetypes` + `decks` tables
- `_readSchema` always merges both sources so old and new formats work without branching

**Critical parser detail**: the cloze regex `/(c\d+)::image-occlusion:([^}]+)/` captures `m[2]` starting *after* `image-occlusion:`, so `parts[0]` is the shape type (`rect`/`ellipse`/`polygon`) and `parts.slice(1)` are the key=value properties. The `points` key must be stored as a string (not `parseFloat`) since it contains space-separated `x,y` pairs.

ELO and lock state can be set via Anki tags: `elo:1600`, `locked`, `locked:true`. Default: ELO 1500, unlocked.

### Data flow for study sessions

`StudySessionService.startGlobalSession()` calls `collectionRepository.buildTree()` which loads all cards recursively. Cards are selected by `SM2Scheduler.selectCards()`. The session is a value object (`StudySession`) — `processAnswer()` returns a new session instance. ELO changes affect both the card (`eloDifficulty`) and the user profile (`eloRating`). Cards unlock progressively as user ELO rises.

### Multi-engrama

`engramaRegistry.js` (localStorage) tracks installed Engramas. `initContainer(engramaId)` creates a fresh DI container for that Engrama's database. The active Engrama ID is stored separately; switching reloads the page.
