# Kittikarn · "Event Horizon" GitHub profile

The goal: build the best-looking developer profile on GitHub for **Kittikarn**. It is a space/black-hole themed, animated profile README with live stats, an Issues-powered mini-game, and an interactive WebGL companion site.
- What to build: `docs/SPEC.md`
- Phases and live status: `docs/ROADMAP.md`
- The user starts each session with `/kickoff` and publishes with `/ship`. Only the user types these.

## Rules (non-negotiable)
1. **Plan before acting: every task, in every permission mode.** Present a plan using the template below, then stop. Edit files or run state-changing commands only after an explicit yes ("ok", "go", "ได้", "เอาเลย"). If the scope changes, plan again.
2. **Never fabricate.** Personal facts come only from `profile.yaml` or the GitHub API.
   - An empty field means that element is left out. Never ship placeholder text.
   - Copy you draft yourself (taglines, bios) stays marked DRAFT until the user approves it.
3. **Every outward-facing action needs approval, every time.** That covers:
   - push
   - creating a repo
   - enabling Pages
   - `gh api` writes and profile changes
   - secrets
   - deleting files
   - adding dependencies

   Publishing goes through `/ship`.
4. **Output must be GitHub-safe.**
   - README: no JS, no CSS, no `class`/`style`.
   - SVG inside `<img>`: no external fonts or images, no hover.
   - Path-scoped rules load automatically. For deeper guidance, use the skills `readme-rules` and `space-svg`.
5. **Prove it before saying done.** Run `npm run check` and the skill `visual-qa`, and report any failure plainly.
6. Speak **Thai** to the user, briefly. Code, comments and docs stay in English.

## Token discipline
- Navigate with the map below instead of exploring the tree.
- For SPEC and ROADMAP, grep the headings (`^## §`, `^### C`, `^## P`) and read only the range you need.
- Don't re-read a file you just wrote. Don't cat SVG or large JSON, and never paste generated SVG into chat. Grep narrowly.
- Take screenshots only for QA: scale ≤ 0.6, at most 6 per QA pass.
- One ROADMAP phase per session. Close the phase by updating ROADMAP (status, ≤ 5 decision lines, next action) so the next session starts cold and cheap.
- Batch independent tool calls. Use a subagent for broad research.

## File map
★ human-owned · ⚙ generated, never hand-edit · ⧗ created in a later phase (Pn)

| Path | What |
|---|---|
| `profile.yaml` ★ | All personal data plus decisions. Single source of truth. |
| `design/tokens.json` | Colors, type, motion, layout, physics, budgets. Import it; never hardcode hex. |
| `design/references.md` | Verified inspiration, plus what to borrow or avoid. |
| `docs/SPEC.md` | What to build: §0–§9, components C1–C12, game, site, sidebar. |
| `docs/ROADMAP.md` | Phases P0–P5, DoD, effort, status, decision log. |
| `docs/ARCHITECTURE.md` | Repo topology, ownership, data flow, build contract, CI. |
| `docs/USAGE.th.md` | Thai guide for the human. Don't load it unless asked. |
| `prompts/` | `01`/`02` are frozen portable prompts; `03-claude-code-kickoff.md` is the session loop. |
| `tools/check.mjs` | Validator for README and SVG. It also runs as a PostToolUse hook. |
| `.claude/settings.json` | Model, effort, plan mode, permissions, hook. |
| `.claude/rules/` | Path-scoped rules: `svg`, `readme`, `workflows`, `site`. |
| `.claude/skills/` | `kickoff`, `space-svg`, `readme-rules`, `visual-qa`, `github-ops`, `ship`. |
| `README.md` ⚙⧗P1 | The profile, generated from `src/readme/template.md`. |
| `src/` ⧗P1 | `build.mjs`, `lib/`, `components/<id>.mjs`, `readme/`, `data/` (P2), `game/` (P3). |
| `assets/` ⚙⧗P1 | `hero/` `intro/` `cards/` `stack/` `stats/` `galaxy/` `game/` `ui/` |
| `design/fonts/` ⧗P1 | Static TTFs and OFL.txt. |
| `data/` ⚙⧗P2 | `github.json` (stats) and its fixture; `blackhole.json` (game). |
| `.github/workflows/` ⧗P2 | `stats.yml` (daily), `feed.yml` (game, P3). |
| `site/` ⧗P4 | A separate git repo, published to `<user>.github.io`. Ignored by this repo. |

## Plan template (≤ 40 lines)
Fill in these headings, in this order:
1. **Phase / goal**
2. **Effort**: recommended (from ROADMAP) vs current
3. **Needs from user**
4. **Files**: create or edit, using the map
5. **Steps**: numbered, each one verifiable
6. **Verification**
7. **Approval gates**
8. **Risks**
9. **Out of scope**

## Commands
- `npm run check`: validates README and every SVG. Add `--publish` for release checks.
- P1 adds `build` and `preview`. Record new commands here.

## Conventions
- Node ≥ 20 with ESM. Keep dependencies minimal, and get approval for each one.
- Output must be deterministic: use a seeded RNG and at most 2 decimals, so diffs stay clean.
- Asset names follow `assets/<group>/<name>[-dark|-light].svg`.
- Commit messages: `feat(cards): …`, `fix(hero): …`, `chore(stats): … [skip ci]`.
