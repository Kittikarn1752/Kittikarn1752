---
paths:
  - "README.md"
  - "src/readme/**"
---
# README rules
- `README.md` is generated from `src/readme/template.md`. Edit the template, then run `npm run build`.
- GitHub strips `<style>`, `<script>`, `<iframe>`, `style=` and `class=`.
- Layout tools: `align`, `width`, `height`, `<p align>`, `<picture>`, `<details>`, `<br>`, tables.
- Every `<img>` has `alt`; decorative images use `alt=""`. Interactivity means links wrapped around images.
- Theme-specific images: `<picture>` with `prefers-color-scheme` sources and an `<img>` fallback.
- After an HTML block opener, leave a blank line before any Markdown.
- No placeholders, TODOs or empty sections. If a profile.yaml field is empty, leave the element out.
- No third-party runtime image services: every image comes from this repo.
- For details and patterns, use the skill `readme-rules`.
