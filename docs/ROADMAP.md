# ROADMAP: Kittikarn "Event Horizon"

Legend: ⬜ todo · 🟨 in progress · ✅ done.
At the end of each phase, the AI updates the status table, checks off items, and adds ≤ 5 decision lines.

**Current:** P3 ⬜ (P2 ✅ shipped 2026-10-21 · P1 ✅ 2026-10-21 · P0 ✅ 2026-10-21)
**Next action:** approve the small fetch fix (local `gh` fallback counts private contributions, see the decision log) and refresh the fixture from CI data; then start a fresh session with effort high and `/kickoff` P3. Open items: Safari/Firefox and real reduced-motion not checked; HUD labels are ~5 px at 375 px (hero, C4, C5–C7).

| Phase | Goal | Effort | Status |
|---|---|---|---|
| P0 | Setup, identity, inspiration | high | ✅ |
| P1 | Visual core + first publish | xhigh (max for the hero if pass 1 scores < 9) | ✅ |
| P2 | Live data + contribution galaxy | high (galaxy: xhigh) | ✅ |
| P3 | Feed the Black Hole game | high | ⬜ |
| P4 | Companion WebGL site | xhigh (max for the shader) | ⬜ |
| P5 | Profile sidebar + final polish | high (final review: max) | ⬜ |

## P0 · Setup, identity, inspiration
- **SPEC:** §0–§2
- **Skills:** github-ops
- **Needs from user:** `gh` logged in with scopes repo, workflow, user; `profile.yaml → identity.github_username` (plus as much of Section A as possible)

Tasks:
- [x] Verify the environment: node ≥ 20, git, and the scopes in `gh auth status`. If anything is missing, give the user the exact command; they run it. → node 24.22, git 2.56, gh 2.102.1 as `Kittikarn1752` with repo, workflow, user.
- [x] Run `git init -b main` and set a repo-local identity with the GitHub noreply email (see github-ops).
- [x] Check whether `<user>/<user>` already exists. If it does, propose how to keep or replace its README, and ask. → it doesn't; P1 `/ship` creates it.
- [x] Visual review, via a subagent, of ≤ 8 profiles from the galleries in design/references.md. Write findings in its "P0 findings" (≤ 15 lines).
- [x] Propose the P1 dependencies (yaml, svgo, opentype.js, simple-icons, an offline markdown renderer). Install only after approval.
- [x] List missing profile.yaml fields. If tagline is empty, draft 3 options marked DRAFT.
  - Missing (2026-10-21): `full_name`, `location`, `role_line`, `tagline`, `bio`, `open_to`; all five `skills[].summary` and `stack`; `projects`; every `links` entry.
  - Tagline DRAFTs, not approved: (a) "Building things with gravity." · (b) "Crossing the event horizon, one commit at a time." · (c) "Five orbits, one center of gravity: web, games, apps, AI, iOS."

Done when: environment ✅, identity ✅, findings recorded, dependencies approved, first local commit made.

## P1 · Visual core + first publish
- **SPEC:** §1–§3 (C1, C2, C3, C11, C12; also C4 if the stacks are filled)
- **Skills:** space-svg, readme-rules, visual-qa

Tasks:
- [x] Concept sprint: 3 static hero directions + 1 card direction (cheap thumbnails). The user picks one. → A "Gargantua".
- [x] Pipeline:
  - `src/build.mjs` (profile.yaml + tokens → assets + README)
  - fonts in `design/fonts/` (with OFL.txt)
  - `npm run build`, `npm run preview`, `npm run check`
- [x] Build C1 hero, C2 porthole, C3 ×5 cards, C12 headers and footer, C11 buttons, and the README template. → plus C4; 17 SVG, 304 KB total.
- [x] Run visual-qa until the mean is ≥ 9. Show the user screenshots and get approval. → pass 1: mean 9.0, min 8 (motion, mobile); approved by the user.
- [x] The user runs `/ship`. That creates `<user>/<user>`, pushes, and verifies the live profile. → `Kittikarn1752/Kittikarn1752`, public, 2026-10-21.

Done when: the live profile shows the hero, intro, cards and contact; QA has passed; ROADMAP is updated.

## P2 · Live data + contribution galaxy
- **SPEC:** §3 C5–C7, C9, C10, §4
- **Skills:** space-svg, visual-qa, github-ops

Tasks:
- [x] `src/data/fetch.mjs` → `data/github.json`, plus a fixture for offline builds. → fixture = snapshot of the first real fetch.
- [x] Build C5 telemetry, C6 languages, C7 galaxy, C9 missions and the C10 log markers. → concept A "Flight deck" picked; C9 hidden (no qualifying repo yet).
- [x] `.github/workflows/stats.yml`: daily cron off the hour, plus `workflow_dispatch`. Commit only on change, and include the synced stamp. → `17 3 * * *`, checkout@v7, setup-node@v7.
- [x] Dry-run locally. Then `/ship`, trigger the workflow once via dispatch (with approval), and verify the run and the live render. → run 39622015926 green in 12 s, bot commit 930c1c0, live alt shows the CI data; local: fetch, failed-fetch keep, determinism and streak checks pass; QA mean 9.0, mobile 7 (labels ~5 px at 375 px).

Done when: stats refresh automatically and render correctly on the live profile.

## P3 · Feed the Black Hole
- **SPEC:** §5
- **Skills:** space-svg, github-ops

Tasks:
- [ ] `src/game/feed.mjs` (pure logic + dry-run tests), the `blackhole.svg` generator, and the README block.
- [ ] `.github/workflows/feed.yml` and the `blackhole` label.
- [ ] `/ship`. The user opens one real issue: verify the round trip takes under 2 min. A second issue from the same user must hit the cooldown.

Done when: the live game works and rejects spam according to the rules.

## P4 · Companion WebGL site
- **SPEC:** §6
- **Rules:** site.md
- **Skills:** visual-qa, github-ops

Tasks:
- [ ] Scaffold `site/` as its own git repo. Prototype the shader and show the user a capture. Then add the planet UI, panels, deep links and fallbacks.
- [ ] Pass Lighthouse and a11y checks. Add the OG image and the Pages deploy workflow.
- [ ] `/ship site`: create `<user>/<user>.github.io`, enable Pages (source: Actions), push, verify.
- [ ] Point the README hero, cards and CTA at the live site, then rebuild and `/ship`.

Done when: the site is live, it meets its targets, and the README card deep links work.

## P5 · Profile sidebar + final polish
- **SPEC:** §7, §8
- **Skills:** github-ops, visual-qa

Tasks:
- [ ] Propose sidebar values as a diff against the current ones. After approval, the user runs `/ship sidebar`.
- [ ] Avatar: keep the current one, or create a monogram (PNG ≥ 500×500) for the user to upload. Give the user exact steps for pins and social previews.
- [ ] Optional A/B: compare a pre-rendered WebGL hero loop (animated WebP; needs ffmpeg) with the SVG hero. The user decides.
- [ ] Final QA at max effort. Fix what it finds, then `/ship`.

Done when: profile, site and sidebar are complete, and every rubric category scores ≥ 9.

## Decision log (newest first, one line each)
- 2026-10-21 · P2 found: the local fetch (gh as the owner) counts private contributions (35/30 vs public 29/26 from `GITHUB_TOKEN`). The push bd6c4c9 showed those counts for ~5 min until the CI sync; only counts, no private names. CI data is the source of truth; the fixture still holds the local snapshot until the fix.
- 2026-10-21 · P2: zero-valued metrics are hidden in C5 (user's choice); C9 never lists `<user>/<user>` and stays hidden until a repo has a description or `projects` is filled.
- 2026-10-21 · P2: Observatory direction A "Flight deck" (HUD brackets, radar, month-labelled galaxy) picked over "Deep field" and "Orbital arc".
- 2026-10-21 · P2: fetch has no dependencies: GraphQL + REST events via `GITHUB_TOKEN`, local fallback through `gh api` (read-only); current streak counts from yesterday when today is still 0 (UTC).
- 2026-10-21 · P2: CI runs a full `npm run build` (deterministic, so only data-driven files change); a failed fetch keeps the last data, still commits nothing new, and fails the job.
- 2026-10-21 · P2: bio rewritten from the user's own facts, DRAFT (b) approved and written to `profile.yaml`.
- 2026-10-21 · Post-P1: ChatGPT and Antigravity glyphs (not in simple-icons) traced from user-supplied images into `src/lib/brand-icons.mjs`, tinted gold in C4 like the other icons (user chose gold over white). SwiftUI stays a text chip.
- 2026-10-21 · P1: no links to `<user>.github.io` until P4 (`SITE_LIVE = false` in `src/lib/profile.mjs`): hero unlinked, cards link only via `skills[].link`, no site CTA or website button. Flip it in P4.
- 2026-10-21 · P1: opentype.js 2.0 `toPathData` turns tiny values (1e-7) into NaN, which silently truncated text; `src/lib/text.mjs` serializes paths itself and the build fails on any NaN.
- 2026-10-21 · P1: `.gitattributes` `* text=auto eol=lf` added (closes the CRLF item). Fonts pinned in `design/fonts/SOURCES.md`; `github-markdown-css` 5.9.0 added for the preview.
- 2026-10-21 · P1: hero direction A "Gargantua" picked; the role rotator keeps SPEC's 15 s cycle (5 × 3 s), the one loop that doesn't divide 24 s. Porthole at `width="34%"` (38% left a gap under the short intro).
- 2026-10-21 · P1 approved values written to `profile.yaml`: tagline (a), five skill summaries, game stack split into Unity + Blender. Link URLs are stripped of `fbclid`/`utm_*` at build time.
- 2026-10-21 · Open for P1: Git for Windows sets `core.autocrlf=true` system-wide; propose a `.gitattributes` with `eol=lf` so generated SVG/README stay byte-identical on Windows and Actions.
- 2026-10-21 · P1 dependencies approved and pinned exact as devDependencies: yaml 2.9.1, svgo 4.1.0, opentype.js 2.0.0, simple-icons 16.35.0, marked 18.1.1 (offline markdown renderer for preview).
- 2026-10-21 · P0: repo initialised on `main` with a repo-local identity `Kittikarn` <168161807+Kittikarn1752@users.noreply.github.com>; no global identity is set on this PC. `Kittikarn1752/Kittikarn1752` doesn't exist yet.
- 2026-10-21 · Defaults accepted: Event Horizon theme, English README, 3 interactive layers (README → game → site at `<user>.github.io`), both meanings of "sidebar", public-only stats, AI files public. Project defaults: Opus 5.5, effort high, plan mode.
