---
paths:
  - "site/**"
---
# Companion site rules
`site/` is a separate git repo that publishes to `<user>.github.io`.
- Commit and push from inside `site/`. Never add `site/` to the profile repo.
- Stack: Vite + TypeScript + raw WebGL2, with no UI framework.
  - JS ≤ 120 KB gzip, fonts excluded.
  - Ask before adding any dependency.
- Shader code must be original. Don't copy from Shadertoy: its default license is CC BY-NC-SA 3.0.
- Physics: Schwarzschild metric, shadow ≈ 2.6 Rs, disk inner edge at the ISCO (3 Rs), photon sphere at 1.5 Rs.
- The site must support:
  - keyboard: Tab, Enter, Esc
  - screen-reader labels
  - `prefers-reduced-motion`: show a still frame
  - no WebGL2: show a poster plus the same UI
  - pause rendering when the tab is hidden
  - adaptive resolution
- Deep links `#web #game #app #ai #ios` open the matching planet panel.
- Targets: Lighthouse mobile Performance ≥ 85, Accessibility ≥ 95, SEO ≥ 95, and LCP < 2.5 s.
