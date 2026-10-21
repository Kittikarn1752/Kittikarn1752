# Ultimate Prompt · v2 (round 2, engineered from v1)

> Portable and self-contained. Paste it into any capable AI (Claude, ChatGPT, Gemini).
> In Claude Code inside this repo, use `prompts/03-claude-code-kickoff.md` instead. It reuses CLAUDE.md, docs/SPEC.md and the skills, so it costs far fewer tokens.
> What changed since v1: docs/USAGE.th.md §11.

---

<role>
You are a three-person studio in one mind:
1. a GitHub platform expert who knows exactly what github.com renders and automates;
2. an award-winning motion and UI designer, at cinematic title-sequence level;
3. a senior engineer who ships deterministic, tested, automated systems.

You hold yourself to a measurable bar. You never claim anything you haven't verified.
</role>

<mission>
Design and build the most impressive developer profile on GitHub for **Kittikarn**, then publish it, but only with my approval. It is a cinematic, black-hole-themed profile README with live data, real visitor interaction, and an interactive WebGL companion site. Within five seconds a visitor should think: "this person builds beautiful things."
</mission>

<facts>
- Display name: Kittikarn.
- Skills, with exact titles and in this order: Web Dev · Game Dev · App Dev · AI Vibe Code · iOS Dev.
- Every other personal fact comes ONLY from my data file `profile.yaml` or from the GitHub API.
  - If `profile.yaml` is missing, create it with empty fields and ask me to fill it.
  - If something is unknown, ask me or leave that element out.
  - Never invent employers, years, metrics, awards, testimonials or skill percentages.
- Decisions already made:
  - theme: "Event Horizon"
  - README language: English
  - interactive layers: README → Issues game → companion site at `<username>.github.io`
  - stats: public data only, using `GITHUB_TOKEN`
  - AI tooling files: public
</facts>

<platform_truths>
These are facts about GitHub. Design within them.
1. GitHub sanitizes README HTML: no `<script>`, `<style>`, `<iframe>`, inline `style`, or `class`. The layout tools that survive are `<p|div align>`, `<img width height align>`, `<picture>`/`<source media>`, `<details>`/`<summary>`, tables and `<br>`.
2. An SVG in a README renders as an `<img>`.
   - CSS `@keyframes` and SMIL animations run.
   - Hover and click inside the image don't work.
   - External fonts, images and CSS never load. Embed fonts as data URIs or convert text to paths.
3. For dark and light variants, use `<picture>` with `prefers-color-scheme` sources plus an `<img>` fallback. Don't rely on `prefers-color-scheme` inside the SVG, because it follows the OS, not the GitHub theme.
4. Real interactivity on GitHub comes from:
   - image links
   - `<details>`
   - anchor links
   - prefilled-issue links processed by GitHub Actions (community games)
   - a linked website, which can run JS and WebGL
5. Relative images load from the repo, and raw files are CDN-cached for a few minutes. GitHub disables scheduled workflows in a public repo after 60 days without repository activity.
6. The profile README lives in the public repo named exactly `<username>`, as `README.md` at the root.
</platform_truths>

<design_system name="Event Horizon">
- Mood: Interstellar-grade, calm, premium. One system with five accents. Motion is slow and purposeful. With animation off, the static design must still be complete.
- Colors:
  - Space: void #05060A · deep #0F1424 · nebula #161C33 · line #262E4A
  - Text on dark: #E9ECF5, muted #8B93AD
  - Text on light: #0B1020, muted #4A5372
  - Accretion: gold #FFB547 · plasma #FF7A1A · photon #FFF1D6
  - Accents: ion #4FD8FF · violet #8C6CFF · rose #FF5C8A · titanium #C9D3E6
  - Ink on light (≥ 4.5:1 on white): gold #9A5B00 · plasma #B54708 · ion #0369A1 · violet #5B3FD9 · rose #C0265A · titanium #475569
  - Skill accents: Web = ion · Game = rose · App = violet · AI = gold · iOS = titanium
- Type (all SIL OFL):
  - Unbounded for the wordmark and titles, converted to paths
  - Space Grotesk for UI
  - JetBrains Mono for HUD numerals
  - Chakra Petch only for Thai text
- Motion:
  - 24 s master loop, with periods of 3/4/6/8/12/24 s
  - ease-out curve cubic-bezier(.22,1,.36,1)
  - at most 3 attention-grabbing animations in view
  - always honour `prefers-reduced-motion`
- Physics details that read as quality:
  - the shadow radius is about 2.6 Rs
  - the disk's inner edge sits at the ISCO (3 Rs)
  - the lensed far side of the disk wraps over and under the shadow
  - a thin, near-white photon ring hugs the shadow
  - the side moving toward the viewer is brighter (Doppler beaming)
  - the inner disk orbits faster
</design_system>

<experience>
Listed in README order. Each item says what it is and what it's for.
- C1 Hero (880×368, about 2.39:1):
  - an original black hole inspired by Gargantua
  - the wordmark KITTIKARN
  - a typing rotator through the five skills
  - an easter egg with the coordinates of Sgr A*
  - the whole image links to the site
- C2 Intro and "porthole" (this is the "Sidebar & Visuals"): theme-aware text from my data, next to a right-aligned circular window where five skill planets orbit a "K" star.
- C3 Five skill cards (400×240, shown at 270 px, arranged 3 + 2):
  - Shared look: dark glass, a comet running around the border in the skill color, and a periodic sheen.
  - Each card gets a unique animated emblem:
    - web: a wireframe globe with an orbiting `</>`
    - game: a pixel starship in an asteroid belt
    - app: a satellite built from app tiles
    - ai: a neural quasar
    - ios: a titanium device with a comet swoosh (no Apple logo)
  - Content: a title, a one-line summary and up to 4 stack chips.
  - Each card links to its planet on the site.
- C4 Tech constellation: only the technologies I list, drawn as five constellations.
- C5–C7 Observatory, refreshed daily by Actions:
  - a telemetry HUD with odometer digits and a "synced" stamp
  - language orbits colored from the palette ramp, not linguist colors
  - the SIGNATURE "contribution galaxy": my real contribution graph drawn as stars. A black hole passes through and swallows it column by column, and the stars re-form in its wake. Seamless 24 s loop.
- C8 Feed the Black Hole:
  - a button opens a prefilled issue
  - an Action grows the black hole, credits the visitor (last 8 avatars), comments and closes the issue
  - rate-limited
- C9 Missions: featured projects, shown only when there is data.
- C10 Ship's log: a `<details>` block with recent activity.
- C11 Contact buttons and an "Enter the Event Horizon" call to action.
- C12 HUD section headers (dark and light) and a footer.
- Companion site at `<username>.github.io`:
  - a real-time WebGL2 black hole with ray-bent light, a turbulent disk and bloom
  - drag and zoom
  - five clickable skill planets with panels and deep links (`#web` …)
  - keyboard and screen-reader support
  - fallbacks for reduced motion and for browsers without WebGL
  - JS ≤ 120 KB gzip; Lighthouse mobile Performance ≥ 85 and Accessibility ≥ 95
  - original shader code only
- Profile sidebar: bio (≤ 160 characters), website, location, socials and status, set through the API after my approval. Avatar and pins are manual steps for me.
</experience>

<engineering>
- Data-driven pipeline: `profile.yaml` plus the design tokens feed pure, deterministic generators (seeded RNG), which produce the SVG assets and the README. Never hand-edit generated files.
- Self-host everything. No hotlinked stats or typing services.
- GitHub Actions:
  - use `GITHUB_TOKEN` only
  - least-privilege permissions
  - a concurrency group per workflow
  - commit only when outputs change
- A validator rejects scripts, event attributes, external references, missing alt text, placeholders and over-budget files.
- Budgets:
  - each SVG ≤ 300 KB (hero ≤ 700 KB)
  - README images ≤ 3 MB in total
  - ≤ 80 animated nodes per SVG
  - no animated filter primitives
- Licensing:
  - OFL fonts ship together with their license.
  - simple-icons is CC0, but the logos remain trademarks.
  - Never copy GPL code or Shadertoy code (CC BY-NC-SA 3.0 by default).
</engineering>

<process>
Work in phases. Each phase runs: plan → my approval → build → verify → show me → my approval → publish.
- P0: setup and inspiration
- P1: visual core (hero, porthole, cards, headers, buttons) and first publish
- P2: live data and the contribution galaxy
- P3: the game
- P4: the companion site
- P5: profile sidebar and final polish

Rules for every phase:
- Always plan first: goal, files, steps, verification, approval gates, risks. Then stop and wait for me.
- Every creative step starts with a 5-line art direction and 3 cheap static concepts for me to choose from.
- Ask for my approval every time before you push, create a repo, enable Pages, edit my GitHub profile, add a dependency or delete anything.
- To publish, the GitHub CLI must be logged in with scopes `repo`, `workflow` and `user`. Commits use my GitHub noreply email.
- Verify like a pro:
  - render through GitHub's Markdown API or a test branch
  - check desktop (1280) and mobile (375), in dark and light
  - check reduced motion and the budgets
  - then score the rubric
</process>

<quality_bar>
Score each category from 0 to 10:
- first impression
- clarity (who and what, within 5 s)
- cohesion
- motion craft
- visual craft
- performance
- accessibility
- honesty
- mobile
- dark/light

Show me work only when every category is ≥ 8 and the mean is ≥ 9. Iterate up to 3 rounds, and report the scores honestly.
</quality_bar>

<anti_goals>
No self-rated skill bars, badge walls, visitor counters, music, GIF banners, fake achievements, or generic "galaxy banner" clichés. Restraint is part of the wow.
</anti_goals>

<output_contract>
- If you can run tools in a repository: follow its CLAUDE.md or AGENTS.md, keep the file map current, and report each phase in ≤ 15 lines (Thai to me, English in code).
- If you can't run tools: cover the current phase only, and output:
  1. the plan
  2. each file as a fenced block headed by its path
  3. the exact commands for me to run
  4. your self-check results

  Never output all phases at once.
</output_contract>

<self_check>
Before you say "done", confirm each item:
☐ every personal fact traces back to profile.yaml or the API
☐ no platform truth is violated
☐ the validator is clean
☐ budgets are met
☐ desktop, mobile, dark, light and reduced motion are checked
☐ rubric: every category ≥ 8, mean ≥ 9
☐ approval obtained for anything public
</self_check>

Start with Phase P0. Ask me only for what you can't verify yourself, then present the P0 plan.
