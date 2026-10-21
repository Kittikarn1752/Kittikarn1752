---
name: space-svg
description: Craft guide for the profile's animated SVGs (hero black hole, porthole orbits, skill cards, stats HUD, contribution galaxy, game, buttons) inside GitHub's <img> sandbox. Covers the animation toolbox, black-hole art direction, text as paths, seamless loops, reduced motion and budgets. Use when designing, generating or debugging any SVG asset.
---

# Space SVG craft

## The sandbox (SVG shown via `<img>` on github.com)
- **Runs:** CSS `@keyframes`, SMIL (`<animate>`, `<animateTransform>`, `<animateMotion>`), gradients, masks, clipPaths, static filters, CSS custom properties, and media queries (reduced motion).
- **Blocked or ignored:** scripts, event handlers, hover and click, external fonts/images/CSS, and links inside the image.

## Art direction: "Event Horizon"
- **Cinematic restraint.**
  - Deep blacks, with one hot light source: the accretion disk.
  - Cool ion-blue for the UI accents.
  - Most of the frame stays calm; the disk is the star.
- **Physically-inspired details** (they read as quality; numbers are in `tokens.json → physics`):
  - the shadow radius is about 2.6 Rs
  - the disk's inner edge sits near the ISCO (3 Rs)
  - the lensed far side of the disk wraps over the shadow (thicker arc) and under it (thinner)
  - a thin, near-white photon ring hugs the shadow
  - the side moving toward the viewer is brighter
  - inner rings orbit faster
- **Composition:**
  - golden-ratio placement and generous negative space
  - an 8 px grid
  - wide tracking on uppercase display type
- **Original work only.** Inspired by Interstellar, never traced from it.

## Animation toolbox (prefer the top of the list)
1. CSS `@keyframes` on transform, opacity and stroke-dashoffset. These are cheap and respect reduced motion.
2. SMIL, only where CSS can't do the job: `<animateMotion>` along paths, and gradient transforms. Put SMIL nodes inside `.smil` groups, and add a `.static` fallback when they carry meaning.
3. Never animate filter parameters, the `d` of large paths, or blur radii. Use static filters only: one per group, over small regions.

Gotchas:
- **A CSS transform replaces the transform attribute.** Wrap instead: `<g transform="translate(…)"><g class="spin">…</g></g>`.
- **Rotating around the element's own center** needs `transform-box: fill-box; transform-origin: center` (Safari depends on this).
- **Rotating around a local point:** keep the default `transform-box` and use `transform-origin: 0 0` inside a translated parent.
- **Seamless loops:**
  - Periods must divide the 24 s master loop: 3/4/6/8/12/24.
  - Dashoffset loops must move by a multiple of the pattern length. Use `pathLength="100"` to make that easy.
- **Desync with negative delays** (`animation-delay: -3.7s`), so the first frame already looks alive.
- **Static state.** With animations off, the design must be complete:
  - one-shot intros (odometers, draw-ins) use base style = final state, plus `animation-fill-mode: backwards`
  - looping scenes must also look finished at t = 0

## Reduced motion (always include)
```css
.static{display:none}
@media (prefers-reduced-motion: reduce){*{animation:none!important}.smil{display:none}.static{display:inline}}
```

## Text
- **Display text** (wordmark, titles, digits): convert it to paths with opentype.js, using the static TTFs in `design/fonts/`. Keep `OFL.txt` alongside them.
- **Longer UI text:** embed a subset WOFF2 with `@font-face{src:url(data:font/woff2;base64,…)}`. Subset to the glyphs you actually use (`pyftsubset` from fonttools), and declare a system fallback.
- Never reference Google Fonts URLs.

## Size and determinism
- Budgets are in `design/tokens.json → budget`.
  - Round coordinates to ≤ 2 decimals.
  - Reuse shapes with `<symbol>`/`<use>`. Check that CSS animation runs inside `<use>` instances; if it doesn't, duplicate the shape instead.
- Use a seeded RNG (mulberry32), seeded with the component name, so the same input always gives the same SVG.
- SVGO settings:
  - keep `viewBox`, `<title>`/`<desc>`, IDs referenced from CSS, `<style>`, and any shape that animates
  - disable path merging
  - check the config against the installed SVGO version

## Accessibility and theme
- Accessibility:
  - `role="img"` plus `<title>`, and `<desc>` for complex art
  - contrast colors from the tokens
  - never use color alone to carry meaning
- Theme:
  - panels with their own dark background work on both GitHub themes in a single file
  - transparent assets need `-dark` and `-light` variants, delivered through `<picture>`

## Workflow
1. Write the generator in `src/components/<name>.mjs` (pure function).
2. `npm run build`
3. `npm run check`
4. `npm run preview`
5. Run the skill `visual-qa`.

Never hand-edit `assets/`.

## Recipes
Code for each one is in [recipes.md](recipes.md):
- R1 base file
- R2 Keplerian disk
- R3 shadow, photon ring, lensing halo
- R4 Doppler-beaming mask
- R5 comet border
- R6 sheen sweep
- R7 typing roles
- R8 odometer digits
- R9 orbits with occlusion
- R10 spiral infall
- R11 contribution-galaxy devour
- R12 starfield and HUD radar
