# ARCHITECTURE: the AI's map

Read this when you need contracts beyond the file map in CLAUDE.md.

## Repo topology
| Local path | Remote | Purpose |
|---|---|---|
| `/` (this folder) | `github.com/<user>/<user>` (public) | Profile README, generators, automation, AI workspace |
| `site/` (nested; ignored by the parent repo) | `github.com/<user>/<user>.github.io` | Companion WebGL site with its own build and Pages workflow |

## Ownership: who writes what
| Path | Owner | Rule |
|---|---|---|
| `profile.yaml` | Human | The AI writes only values the user gave it. Changing Section B needs approval. |
| `design/tokens.json` | AI, via an approved plan | The only place visual values live. |
| `src/**` | AI | Pure, deterministic generators. |
| `assets/**`, `README.md`, `data/**` | Generators / CI | Never hand-edit; rebuild instead. |
| `.github/workflows/**` | AI, via an approved plan | Least privilege. |
| `docs/SPEC.md` | AI, via an approved plan | The canonical "what". |
| `docs/ROADMAP.md` | AI | Status and decisions, ≤ 10 changed lines per phase. |
| `prompts/01-*`, `prompts/02-*` | Frozen snapshots | Don't edit. |
| `.claude/**`, `CLAUDE.md` | AI, via an approved plan | Keep them small: they cost tokens every session. |

## Data flow
```
profile.yaml ───────┐
design/tokens.json ─┼─► src/build.mjs ─► src/components/*.mjs ─► assets/**/*.svg
data/github.json ───┘          └─► src/readme/template.md ─► README.md

GitHub GraphQL ─► src/data/fetch.mjs ─► data/github.json        (CI: stats.yml, daily)
Issue "feed|…" ─► feed.yml ─► src/game/feed.mjs ─► data/blackhole.json ─► build ─► commit
profile.yaml ─► site build (copied) ─► site/dist ─► GitHub Pages
```

## Build contract (P1 implements it)
| Command | What it does |
|---|---|
| `npm run build` | Full build from local data. No network unless `--fetch`. |
| `npm run build -- --only stats,galaxy` | Partial build, used by CI. |
| `npm run preview` | GitHub-rendered preview at http://localhost:4173. It renders through the Markdown API via `gh api` and falls back to an offline renderer. |
| `npm run check` | Validator. Add `--publish` for release checks (required data, secrets scan). |

Component modules follow this contract:
```js
export default function render({ profile, tokens, data, variant }) {
  return { files: [{ path: 'assets/cards/web.svg', svg: '<svg …>' }] };
}
```
- Components are pure: no I/O, and the same input gives the same output.
- `build.mjs` writes the files, runs SVGO with the safe configuration, and prints the size of each file against its budget.

## Conventions
- IDs inside an SVG are prefixed per component (`h-`, `c-`, `g-`, `o-`, `s-`, `u-`).
- Seeded RNG: mulberry32, seeded with the component name.
- SVG numbers use at most 2 decimals. Dates are ISO strings in UTC.
- README markers: `<!-- LOG:START/END -->`, `<!-- FEED:START/END -->`.
- Commit style: `feat(cards): …`, `fix(hero): …`, `chore(stats): … [skip ci]`.

## CI workflows (P2–P4)
| File | Trigger | Permissions | Writes |
|---|---|---|---|
| `stats.yml` | daily cron, off the hour + dispatch | `contents: write` | `data/github.json`, `assets/stats`, `assets/galaxy`, README markers |
| `feed.yml` | `issues.opened`, title `feed\|…` | `contents: write`, `issues: write` | `data/blackhole.json`, `assets/game`, README FEED block |
| `site/.github/workflows/pages.yml` | push to main + dispatch | `contents: read`, `pages: write`, `id-token: write` | Pages deployment |

## Secrets policy
- No secrets: `GITHUB_TOKEN` only.
- Never print tokens. The AI is denied `gh auth token`.

## Adding a component
1. Spec it in SPEC §3 (needs approval).
2. Create `src/components/<name>.mjs` following the contract.
3. Register it in `build.mjs`.
4. Add it to the README template.
5. Run `npm run check`, then visual-qa.
6. Update the file map in CLAUDE.md if you added a folder.
