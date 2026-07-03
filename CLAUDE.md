# frecency — repo card

> A map, not a manual. Keep it ~1 screen; point to detail, don't inline it.

## What it is

Public OSS npm package (`frecency`, MIT) that re-ranks search/autocomplete results by "frecency" — frequency + recency of the user's past selections (Slack quick-switcher approach). Ships a default-export `Frecency` class with `save({ searchQuery, selectedId })` and `sort({ searchQuery, results })`, persisting per-key data in browser localStorage or any injected `storageProvider`.

## serves

role: client-side search/autocomplete result ranking by the user's selection history
referenced-by: [compose]

## Code map

- `Frecency` class (save/sort, score calculation) -> src/index.js
- sub-query matching + storage-provider loading/fallback -> src/utils.js
- Flow types (`FrecencyOptions`, `StorageProvider`, data shapes) -> src/types.js
- dual-bundle build (`__SERVER__` flag) -> rollup.config.js
- tests -> spec/
- CI entry -> Jenkinsfile

## Conventions

- npm (package-lock.json); source is Flow-typed ES (not TypeScript)
- Jest tests in spec/; `npm test` runs the Rollup build first
- Rollup builds dist/main.js (CJS/node — requires injected storage provider, throws without one) and dist/browser.js (ESM — falls back to localStorage) via package.json `browser` field
- CI: Jenkins `npmModulePipeline` (scm-service-library); no GitHub Actions
- Publish: semantic-release (conventional commits + commitlint) to public npm; manual `npm publish` is blocked by a prepublishOnly guard

## Run / test

- `npm install`
- `npm test` — build + Jest
- `npm run lint` — ESLint + Flow
- `npm run build` — Rollup only

## Load the matching domain card

- Cross-cutting library — load the consuming capability's card, not a domain-* for this repo.
