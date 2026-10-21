---
name: visual-qa
description: Quality gate for README, SVG and site work. Builds, validates, previews in the built-in browser at desktop and mobile in dark and light, verifies animation and the static state, scores the rubric, and fixes issues before the user sees them. Use before presenting results and before /ship.
---

# Visual QA

## Loop (max 3 rounds)
1. Run `npm run build`, then `npm run check`. Fix every error before going further.
2. Run `npm run preview` and open the printed URL in the built-in browser.
   - Use preview_start with the url, or navigate.
   - In the CLI without that browser, use Claude in Chrome if it's connected. Otherwise skip the screenshots and say so.
3. Take screenshots. Use scale ≤ 0.6 and at most 6 images in total:
   - desktop 1280, dark
   - desktop, light (resize_window colorScheme)
   - mobile preset, dark

   Zoom-crop only where a judgment needs detail (the hero, one card).
4. **Motion proof (no video):** open each changed SVG directly in a tab, then run:
   ```js
   ({ css: document.getAnimations().length, smil: document.querySelectorAll('animate,animateMotion,animateTransform,set').length })
   ```
5. **Static proof:** in the same tab, run:
   ```js
   document.getAnimations().forEach(a => a.cancel()); document.documentElement.pauseAnimations?.(); document.documentElement.setCurrentTime?.(0)
   ```
   Then take one screenshot. The design must look complete. This is what reduced-motion users see.
6. Score the rubric. If any category is < 8, fix it and repeat. Then report.

## Rubric (0–10)
| Category | A 10 looks like |
|---|---|
| First impression | Stops the scroll. Cinematic, nothing cheap. |
| Clarity | Name and what I do are readable within 5 s. |
| Cohesion | One palette, one type system, one motion language. |
| Motion craft | Smooth, seamless loops, calm rhythm, no jitter. |
| Visual craft | Grid-aligned, balanced spacing, crisp type. |
| Performance | Within budget; the page scrolls smoothly. |
| Accessibility | Alt text, AA contrast, complete static state. |
| Honesty | Every fact comes from profile.yaml or the API. |
| Mobile | Legible and well-wrapped at 375 px. |
| Dark / light | Both themes look intentional. |

**Pass:** every category ≥ 8 and the mean ≥ 9.

## Report to the user (Thai, ≤ 12 lines)
- Scores, on one line.
- What changed.
- Open issues.
- 2–4 screenshots.
- Anything not verified, said plainly (for example "not checked in Safari").
