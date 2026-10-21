---
name: readme-rules
description: What GitHub renders in a profile README and the layout patterns that work there — sanitizer limits, dark/light <picture>, clickable image cards, right-aligned "sidebar" visual, <details>, anchors, prefilled-issue links, caching, and the preview method. Use before creating or editing README.md or its template.
---

# GitHub README rules (profile repo `<user>/<user>`)

## Hard constraints
- Rendered HTML is sanitized. These are removed:
  - `<script>`, `<style>`, `<iframe>`, `<form>`
  - inline `style`, `class`, event handlers
  - IDs survive but get a `user-content-` prefix; `#anchor` links still work.
- These survive:
  - `align`, `width`, `height` on `p`/`div`/`img`/`td`
  - `<a href>`, `<a name>`, `<img alt>`
  - `<picture>`/`<source media srcset>`, `<details>`/`<summary>`
  - tables, `<br>`, `<sub>`/`<sup>`, `<kbd>`
- Images are `<img>`. SVG animation runs, but there is no interaction inside the image, and no external fonts or images. See skill `space-svg`.
- Theme images go through `<picture>` with `media="(prefers-color-scheme: dark|light)"` plus an `<img>` fallback. Inside the SVG, `prefers-color-scheme` follows the OS, not the GitHub theme.
- The profile README shows only from a **public** repo named exactly like the username, with `README.md` at the root of the default branch.
- Relative paths resolve inside the repo. Raw files are CDN-cached for a few minutes, so wait before judging a fresh push.

## Layout patterns
```html
<!-- C1 hero: the whole image is a link -->
<p align="center"><a href="https://USER.github.io"><img src="assets/hero/hero.svg" width="100%" alt="Kittikarn — animated black hole. Enter the Event Horizon"></a></p>

<!-- C2 "sidebar & visuals": visual floats right, text flows left -->
<img align="right" width="38%" src="assets/intro/orbit.svg" alt="Five skill planets orbiting a K star">

### Hi, I'm Kittikarn

…bio from profile.yaml…

<br clear="right">

<!-- C12 theme-aware section header -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/ui/h-skills-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/ui/h-skills-light.svg">
  <img src="assets/ui/h-skills-dark.svg" width="100%" alt="Skills">
</picture>

<!-- C3 clickable cards: fixed px width so they wrap on mobile (3 + 2 on desktop) -->
<p align="center">
  <a href="https://USER.github.io/#web"><img src="assets/cards/web.svg" width="270" alt="Web Dev — …stack…"></a>
  <a href="https://USER.github.io/#game"><img src="assets/cards/game.svg" width="270" alt="Game Dev — …"></a>
</p>

<!-- C8 game button: opens a prefilled issue -->
<a href="https://github.com/USER/USER/issues/new?title=feed%7Cstar&body=Press%20%22Submit%20new%20issue%22%20to%20throw%20a%20star%20into%20the%20black%20hole."><img src="assets/ui/btn-feed.svg" height="44" alt="Feed the black hole"></a>

<!-- C10 collapsible -->
<details><summary><b>Ship's log</b></summary>

<!-- LOG:START -->
<!-- LOG:END -->

</details>
```
- Markdown inside an HTML block needs a blank line after the opening tag.
- Confirm in the preview that `<br clear="right">` survives sanitization. If it doesn't, fall back to a table.
- Interactivity comes from four things: image links, `<details>`, anchors, and prefilled-issue links handled by Actions.
- `labels=` in an issue URL applies only for users with triage rights, so the workflow adds labels itself.

## Do / don't
- Every `<img>` gets a meaningful `alt`. Decorative images get `alt=""`.
- No hotlinked stats or typing services. Everything is generated into this repo.
- No `#gh-dark-mode-only` fragments (legacy). Use `<picture>`.
- Keep the total image weight within `design/tokens.json → budget.readmeTotalKB`.

## Preview
1. Run `npm run preview` (built in P1). It renders README.md through GitHub's Markdown API (`gh api -X POST /markdown -f mode=gfm -f context=<user>/<user> -F text=@README.md`), rewrites asset URLs to local paths, and serves the result with github-markdown-css.
2. For risky changes, push to a branch first (with approval) and open `https://github.com/<user>/<user>/blob/<branch>/README.md`.
