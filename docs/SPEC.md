# SPEC: Kittikarn "Event Horizon" profile

This is the canonical "what to build". It is a living document: change it only through an approved plan.
- Visual values: `design/tokens.json`.
- Personal data: `profile.yaml`.
- Headings are stable, so grep `^## §` or `^### C` and read only the range you need.

## §0 North star
A visitor opens github.com/<user> and within five seconds feels: *this person builds beautiful things*. The profile is:
- cinematic: an Interstellar-grade black hole;
- cohesive: one system, five accents;
- alive: real data and real interaction;
- fast, accessible and 100% truthful.

Principles:
1. A signature beats decoration: one unforgettable idea per section.
2. Calm motion: slow orbits and rare highlights.
3. Every pixel earns its place.
4. Real data or nothing.
5. It works everywhere: dark and light, desktop and mobile, with or without reduced motion.

## §1 Platform truths (summary; details in skills `readme-rules` and `space-svg`)
- README: no JS, no CSS, no `style`/`class`. Only HTML attributes (align, width, height…), `<picture>` for themes, `<details>`, and links on images.
- SVG shown as `<img>`:
  - CSS and SMIL animations run, and the reduced-motion media query works.
  - Hover and click inside the image don't work.
  - External fonts and images don't load.
- Real interactivity comes from four things: links, `<details>`, the Issues + Actions loop, and the companion site.

## §2 Information architecture (README order)
| # | Section | Components |
|---|---|---|
| 1 | Hero | C1 (the whole image links to the site) |
| 2 | Intro + porthole ("Sidebar & Visuals") | C2 |
| 3 | Skills | C12 header · C3 ×5 (3 + 2) · C4 |
| 4 | Observatory (live) | C12 · C5 · C6 · C7 |
| 5 | Interact | C12 · C8 · C11 site CTA |
| 6 | Missions | C9 (only with data) |
| 7 | Ship's log | C10 (`<details>`) |
| 8 | Contact + footer | C11 buttons · C12 footer |

## §3 Components
Each component lists its file and size, data, motion, link and done-when.

### C1 Hero
File: `assets/hero/hero.svg`, 880×368 (≈ 2.39:1), own dark background, radius 24.

Content:
- An original, Gargantua-inspired black hole, placed in the right third.
- The wordmark "KITTIKARN" in Unbounded, converted to paths, with wide tracking.
- A role rotator that types the five skill titles.
- A micro-HUD easter egg: `SGR A* · RA 17h45m40s · DEC −29°00′28″`.

Layers, back to front:
1. void + vignette
2. faint nebula
3. starfield with 3 depths (≤ 8% twinkle)
4. static lensed star streaks near the hole
5. back half of the disk
6. lensed far-side halo (thicker above than below)
7. photon ring
8. shadow (pure black)
9. front half of the disk
10. infalling particles
11. type and HUD

Motion:
- Keplerian disk layers at 6, 12 and 24 s.
- Doppler beaming is a static mask that brightens the approaching side.
- 6–10 particles spiral inward (SMIL, inside `.smil`).
- Wordmark sheen every 8 s.
- Roles change every 3 s (15 s cycle). Under reduced motion, show a static line listing all five.

Link: companion site. Alt text: "Kittikarn — animated black hole. Enter the Event Horizon."

Done when:
- name and black hole read in under 1 s
- loops are seamless
- size ≤ 700 KB
- still legible at 375 px wide
- the static state is complete

### C2 Intro + porthole
Files: README text plus `assets/intro/orbit.svg`, 360×360.

- Text (rendered by GitHub, so theme-aware): a greeting with the display name, then tagline, bio, role_line, location and open_to. Show only the fields that are filled.
- Visual: a circular "porthole" window with its own dark background. A "K" core star sits in the middle, and five skill planets travel on tilted elliptical orbits:
  - skill colors, periods 8–30 s
  - they pass behind and in front of the core (occlusion)
  - tiny labels as paths
- Layout: `<img align="right" width="38%">`, then the text, then `<br clear="right">`. Check it in the preview.

Done when: it reads well on desktop and at 375 px, with no orphaned column of text.

### C3 Skill cards ×5
Files: `assets/cards/{web,game,app,ai,ios}.svg`, 400×240, displayed at 270 px wide.

Shared frame:
- own dark glass background with a 1 px line
- a comet running around the border in the skill color: a head plus 2 fading tails, desynced per card
- a sheen every 8 s
- HUD index `0X / 05`

Content:
- an animated emblem
- the title
- a summary of ≤ 40 characters
- up to 4 stack chips, plus "+N" when there are more

If a data field is empty, drop that element. Never use placeholders.

Emblems:
- web: wireframe globe with an orbiting `</>`
- game: pixel starship weaving through an asteroid belt
- app: satellite assembled from app tiles
- ai: neural quasar with a pulsing core and synapse sparks along its jets
- ios: titanium device silhouette with a comet swoosh (no Apple logo)

Link: `skills[].link`, otherwise `https://<user>.github.io/#<id>`.

Done when:
- the five cards read as one family, yet each emblem is distinct at a glance
- 3 + 2 on desktop, 1 per row on mobile

### C4 Tech constellation
File: `assets/stack/stack.svg`, 880 × about 200, own dark panel.

- Show every technology listed in `skills[].stack`, grouped into five constellations in the skill colors.
- Icons come from simple-icons as monochrome glyphs tinted with the skill color. Unknown technologies become text chips.
- The lines draw in once; the stars twinkle.
- If every stack is empty, hide the whole section.

### C5 Observatory telemetry
File: `assets/stats/telemetry.svg`, 880×200, using `data/github.json`.

- Metrics: stars earned, contributions (last year), commits (last year), PRs, issues, public repos, followers, current streak and longest streak.
- Look: HUD corner brackets, a radar sweep, odometer digits that roll in once, and a `SYNCED <UTC>` stamp.
- Label it OBSERVATORY. Don't call it "Mission Telemetry", because galaxy-profile uses that name.

### C6 Language orbits
File: `assets/stats/languages.svg`, 880×220.

- Top 6 languages by bytes, counting only owned, non-fork repos.
- Planets are sized ∝ √share and orbit a star, with a legend in %.
- Colors come from `rankRamp`, not linguist colors.

### C7 Contribution galaxy (signature)
File: `assets/galaxy/galaxy.svg`, 880×220.

- The last 53 weeks, one star per day. Size and brightness follow the contribution level; days with no contributions are faint dust.
- A small black hole crosses from left to right in 0–12 s. As it passes, each column swirls into it, then re-forms about 4 s behind it. From 12 to 24 s the whole galaxy rests. Loop is 24 s and seamless.
- Caption: "<N> contributions in the last year · longest streak <L> days".

Done when: at t = 0 it reads as *your* contribution graph, and the file is ≤ 300 KB.

### C8 Feed the Black Hole
See §5. Files: `assets/game/blackhole.svg` (880×260) and `assets/ui/btn-feed.svg`.

### C9 Missions
Source:
- `profile.yaml projects`, if any;
- otherwise the top 3 public non-fork repos that have a description, ranked by stars;
- if none qualify, leave the section out.

Shown as dark SVG cards, 2–3 per row, linking to the repo or url, with live stars and language.

### C10 Ship's log
`<details>` blocks:
- "Recent transmissions": the last 5 public events, filled in automatically between `<!-- LOG:START -->` and `<!-- LOG:END -->`.
- Optional "More about me", only if profile.yaml provides it.

### C11 Buttons and site CTA
- `assets/ui/btn-<channel>.svg`: a 44 px pill with its own dark background, one for each link that is filled. Email uses `mailto:`.
- A large "ENTER THE EVENT HORIZON →" call to action pointing at the site.

### C12 Section headers and footer
- `assets/ui/h-<section>-{dark,light}.svg`: 880×64, transparent background, delivered through `<picture>`.
- `assets/ui/footer.svg`: a starfield wave with "Built in orbit · <year>".

## §4 Live data
`data/github.json` is written by `src/data/fetch.mjs`, daily in CI:
```json
{ "generatedAt": "ISO", "user": { "login": "", "name": "", "followers": 0, "publicRepos": 0 },
  "totals": { "stars": 0, "contributionsYear": 0, "commitsYear": 0, "prs": 0, "issues": 0 },
  "streak": { "current": 0, "longest": 0 },
  "languages": [{ "name": "", "bytes": 0, "share": 0 }],
  "calendar": [{ "date": "YYYY-MM-DD", "count": 0, "level": 0 }],
  "topRepos": [{ "name": "", "description": "", "stars": 0, "language": "", "url": "" }],
  "events": [{ "type": "", "repo": "", "title": "", "url": "", "createdAt": "" }] }
```
- Source: GraphQL with `GITHUB_TOKEN`, public data only. Streaks are computed from the calendar in UTC.
- Keep a fixture (`data/github.fixture.json`) so offline builds work.
- If a fetch fails: keep the last good data, still render, and exit non-zero so the CI failure is visible.

## §5 Game: Feed the Black Hole
Flow:
1. The README button links to `https://github.com/<user>/<user>/issues/new?title=feed%7Cstar&body=<short instructions>`.
2. The visitor presses "Submit new issue".
3. `feed.yml` runs on `issues.opened` when the title starts with `feed|`.
4. It validates the issue and updates `data/blackhole.json`.
5. It regenerates `assets/game/blackhole.svg` and the README block between `<!-- FEED:START -->` and `<!-- FEED:END -->`.
6. It commits, then comments on the issue, labels it `blackhole` and closes it.

Rules:
- one feed per user per hour, and at most 30 per hour overall;
- ignore bots;
- close titles that don't match, with a friendly note;
- keep the last 50 entries, and show the last 8 travelers as avatars.

Visual:
- radius = r0 + k·log10(1 + mass), and the glow grows with mass;
- "<mass> stars devoured";
- "last fed by @<login>".

Workflow settings: `permissions: contents: write, issues: write`; concurrency group `blackhole` (queue, never cancel); `GITHUB_TOKEN` only.

Done when:
- a real issue completes the round trip in under 2 min
- the spam rules are covered by dry-run tests on `src/game/feed.mjs`

## §6 Companion site
Repo `<user>/<user>.github.io`, local folder `site/`.

Scene: a full-screen WebGL2 fragment shader with
- Schwarzschild light bending
- a thin disk starting at the ISCO (3 Rs), with turbulent texture and a temperature color ramp
- Doppler beaming
- a photon ring
- a lensed starfield
- bloom
- filmic tonemapping

Interaction:
- Camera: drag or touch to orbit (inclination 5°–85°), wheel or pinch to zoom within bounds, and auto-orbit when idle.
- Skill planets: five planets orbit the hole. Hover or focus highlights a planet.
- Panels: click or Enter opens a glass panel (title, summary, stack, projects, links); Esc closes it.
- Deep links: `#web #game #app #ai #ios`.

Content:
- Header: the name and "Back to GitHub".
- Footer: contact links.
- Data comes from the same `profile.yaml`, copied at build time.

Fallbacks and accessibility:
- no WebGL2: show a poster image with the same UI
- reduced motion: show a still frame
- full keyboard support and screen-reader labels
- pause rendering when the tab is hidden
- adaptive resolution

Performance:
- JS ≤ 120 KB gzip
- Lighthouse mobile: Performance ≥ 85, Accessibility ≥ 95, SEO ≥ 95
- LCP < 2.5 s
- OG image 1200×630, plus a favicon

Deploy: GitHub Actions → Pages (source: GitHub Actions). All shader code must be original.

## §7 Profile sidebar (GitHub account)
Set through the API, only after approval:
- name
- bio (≤ 160 chars)
- blog = the site URL
- location
- twitter_username
- hireable, if `open_to` includes a job type
- social accounts (≤ 4)
- status (emoji + short message)

Manual steps for the user: avatar upload (with an optional monogram), pinning 6 repos, and repo social-preview images.

## §8 Quality bar
- Use the rubric and loop in skill `visual-qa`. To pass, every category must be ≥ 8 and the mean ≥ 9.
- Budgets come from `design/tokens.json → budget`.
- Text contrast meets AA. Every image has alt text.

## §9 Don'ts
- self-rated skill bars or percentages
- badge walls (more than 12 badges)
- visitor counters
- sound in the README
- GIF banners (they band)
- hotlinked third-party image APIs
- fake achievements or testimonials
- copied GPL or Shadertoy code
- brand logos used as decoration (tech icons in C4 are fine)
