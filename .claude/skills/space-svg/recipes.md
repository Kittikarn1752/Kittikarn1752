# Space SVG recipes

These are starting points.
- In the real generators, every value comes from `design/tokens.json`.
- Coordinates assume the hero (880×368) with the black hole at (600,184), unless a recipe says otherwise.
- Verify every recipe in Chrome, Firefox and Safari during visual QA.

## R1 · Base file
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 368" role="img" aria-labelledby="h-t h-d">
  <title id="h-t">Kittikarn — Event Horizon</title>
  <desc id="h-d">Animated black hole with a rotating accretion disk. Skills: Web Dev, Game Dev, App Dev, AI Vibe Code, iOS Dev.</desc>
  <style>
    .spin{transform-box:fill-box;transform-origin:center;animation:spin var(--p,24s) linear infinite}
    .rev{animation-direction:reverse}
    @keyframes spin{to{transform:rotate(1turn)}}
    .static{display:none}
    @media (prefers-reduced-motion:reduce){*{animation:none!important}.smil{display:none}.static{display:inline}}
  </style>
  <defs><!-- gradients, clipPaths, symbols --></defs>
  <!-- layers back → front -->
</svg>
```

## R2 · Keplerian accretion disk
The disk is drawn top-down, then squashed into perspective. Only the inner groups animate.
```svg
<defs>
  <g id="h-disk">
    <g class="spin" style="--p:6s"><circle r="78" fill="none" stroke="#FFF1D6" stroke-width="10" stroke-dasharray="22 9 4 14" opacity=".9"/></g>
    <g class="spin" style="--p:12s"><circle r="112" fill="none" stroke="#FFB547" stroke-width="22" stroke-dasharray="40 12 10 24" opacity=".8"/></g>
    <g class="spin" style="--p:24s"><circle r="160" fill="none" stroke="#FF7A1A" stroke-width="30" stroke-dasharray="60 30 14 40" opacity=".55"/></g>
  </g>
  <clipPath id="h-back"><rect width="880" height="184"/></clipPath>
  <clipPath id="h-front"><rect y="184" width="880" height="184"/></clipPath>
</defs>
<g clip-path="url(#h-back)"><use href="#h-disk" transform="translate(600 184) scale(1 .24)"/></g>
<!-- R3 (halo, photon ring, shadow) goes here -->
<g clip-path="url(#h-front)"><use href="#h-disk" transform="translate(600 184) scale(1 .24)"/></g>
```
- Inner rings are faster, which matches Keplerian orbits. Irregular dash patterns read as plasma streaks. Colors run from hot inside to cool outside.
- The squash flattens the strokes too, which is right for a thin disk seen nearly edge-on.
- If CSS animation doesn't run inside `<use>` in some browser, duplicate the group instead.

## R3 · Shadow, photon ring, lensing halo
```svg
<radialGradient id="h-halo" gradientUnits="userSpaceOnUse" cx="600" cy="178" r="104">
  <stop offset=".55" stop-color="#FFB547" stop-opacity="0"/>
  <stop offset=".62" stop-color="#FFF1D6" stop-opacity=".95"/>
  <stop offset=".74" stop-color="#FFB547" stop-opacity=".5"/>
  <stop offset="1" stop-color="#FF7A1A" stop-opacity="0"/>
</radialGradient>
<!-- lensed far side; shifted up so the top arc is thicker -->
<ellipse cx="600" cy="178" rx="104" ry="98" fill="url(#h-halo)"/>
<!-- photon ring -->
<circle cx="600" cy="184" r="58" fill="none" stroke="#FFF1D6" stroke-width="1.5"/>
<!-- shadow ≈ 2.6 Rs -->
<circle cx="600" cy="184" r="56" fill="#000"/>
```
- Scale check: a shadow radius of 56 means Rs ≈ 21.5, so the ISCO (3 Rs) is at about 65. The inner disk ring (r 78) starts just outside it.

## R4 · Doppler beaming (static mask)
```svg
<linearGradient id="h-beamG" x1="0" x2="1">
  <stop offset="0" stop-color="#fff" stop-opacity=".5"/>
  <stop offset="1" stop-color="#fff"/>
</linearGradient>
<mask id="h-beam"><rect width="880" height="368" fill="url(#h-beamG)"/></mask>
<!-- apply to each disk half and the halo: <g clip-path="url(#h-back)" mask="url(#h-beam)"> -->
```
- With the default clockwise `.spin`, the right side moves toward the viewer, so the right side is brighter. With `.rev`, mirror the gradient.

## R5 · Comet border (head + 2 fading tails)
```svg
<g fill="none" stroke="#4FD8FF" stroke-linecap="round">
  <path class="comet" pathLength="100" stroke-width="3" stroke-dasharray="1.5 98.5" d="M20 1H380A19 19 0 0 1 399 20V220A19 19 0 0 1 380 239H20A19 19 0 0 1 1 220V20A19 19 0 0 1 20 1Z"/>
  <path class="comet" pathLength="100" stroke-width="2" stroke-dasharray="6 94" opacity=".45" style="--o:4.5" d="(same)"/>
  <path class="comet" pathLength="100" stroke-width="1.5" stroke-dasharray="14 86" opacity=".18" style="--o:12.5" d="(same)"/>
</g>
<style>
  .comet{stroke-dashoffset:var(--o,0);animation:comet 6s linear infinite;animation-delay:var(--delay,0s)}
  @keyframes comet{to{stroke-dashoffset:calc(var(--o,0) - 100)}}
</style>
```
- Set each tail's `--o` to its length minus the head length (4.5 and 12.5 here). Then all three dashes end at the same point.
- Give every card its own `--delay` on the root `<svg style>` (0, −1.3, −2.6, −3.9, −5.2 s), so the comets never move in sync.

## R6 · Sheen sweep
```svg
<clipPath id="c-clip"><path d="(card frame path)"/></clipPath>
<linearGradient id="c-sheenG" x1="0" x2="1">
  <stop offset="0" stop-color="#fff" stop-opacity="0"/>
  <stop offset=".5" stop-color="#fff" stop-opacity=".1"/>
  <stop offset="1" stop-color="#fff" stop-opacity="0"/>
</linearGradient>
<g clip-path="url(#c-clip)"><g transform="skewX(-18)">
  <rect class="sheen" x="-240" y="-10" width="140" height="260" fill="url(#c-sheenG)"/>
</g></g>
<style>
  .sheen{animation:sheen 8s cubic-bezier(.65,0,.35,1) infinite}
  @keyframes sheen{0%,72%{transform:translateX(0)}100%{transform:translateX(800px)}}
</style>
```
- The skew sits on a wrapper group, because a CSS transform would replace the rect's own transform attribute.

## R7 · Typing role rotator (15 s = 5 roles × 3 s)
```svg
<clipPath id="h-r1"><rect class="type" style="animation-delay:1.4s" x="0" y="-28" width="300" height="36"/></clipPath>
<g class="role" style="animation-delay:1.4s"><g clip-path="url(#h-r1)"><!-- "Game Dev" glyph paths --></g></g>
<!-- reduced motion: a static line of all five roles, as paths -->
<g class="static"><!-- "Web · Game · App · AI · iOS" --></g>
<style>
  .role{opacity:0;animation:role 15s linear infinite}
  @keyframes role{0%,19.9%{opacity:1}20%,100%{opacity:0}}
  .type{transform-box:fill-box;transform-origin:left center;animation:type 15s linear infinite}
  @keyframes type{0%{transform:scaleX(0);animation-timing-function:steps(14,end)}8%,19.9%{transform:scaleX(1)}20%,100%{transform:scaleX(0)}}
</style>
```
- Delay role i by `i × 3 s − 1.6 s`. That way role 0 (delay −1.6 s) is already fully typed at t = 0.
- Put the same delay inline on the `.role` group and on its `.type` rect. The rect lives inside `<clipPath>`, so it doesn't inherit anything from the group.
- Set the `steps(n)` count from each role's character count. To add a caret, use a thin rect that translates with the same steps plus a `steps(1)` blink.

## R8 · Odometer digits (play once)
```svg
<clipPath id="s-dg"><rect width="22" height="30"/></clipPath>
<g transform="translate(120 80)" clip-path="url(#s-dg)">
  <g class="roll" style="--to:-210px"><!-- glyph paths 0–9 stacked at y = 0, 30, …, 270; this example ends on 7 --></g>
</g>
<style>
  .roll{transform:translateY(var(--to));animation:roll 1.8s cubic-bezier(.22,1,.36,1) .3s backwards}
  @keyframes roll{from{transform:translateY(0)}}
</style>
```
- The base style is the final digit, so with animations off the number is already correct.
- The keyframes define only `from`, so the animation ends on the base style.

## R9 · Orbits with occlusion (porthole)
```svg
<path id="o-p1" d="M150 0A150 52 0 1 1 -150 0A150 52 0 1 1 150 0" fill="none"/>
<clipPath id="o-far"><rect x="-200" y="-200" width="400" height="200"/></clipPath>
<clipPath id="o-near"><rect x="-200" y="0" width="400" height="200"/></clipPath>
<g transform="translate(180 180)">
  <use href="#o-p1" stroke="#262E4A"/>
  <g class="smil" clip-path="url(#o-far)"><circle r="9" fill="#4FD8FF"><animateMotion dur="18s" begin="-4s" repeatCount="indefinite"><mpath href="#o-p1"/></animateMotion></circle></g>
  <circle r="26" fill="url(#o-core)"/><!-- "K" core star -->
  <g class="smil" clip-path="url(#o-near)"><circle r="9" fill="#4FD8FF"><animateMotion dur="18s" begin="-4s" repeatCount="indefinite"><mpath href="#o-p1"/></animateMotion></circle></g>
  <circle class="static" cx="150" cy="0" r="9" fill="#4FD8FF"/>
</g>
```
- Draw the same planet twice. The far half goes before the core and the near half after it, which gives correct occlusion.
- To tilt a whole orbit, rotate its static parent group.

## R10 · Spiral infall particles
```js
// Generator side, seeded. An inward spiral, flattened to the disk plane, that accelerates toward the hole.
function spiral({ cx, cy, r0, rEnd, turns, tilt, theta0, steps = 48 }) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const r = rEnd + (r0 - rEnd) * (1 - t ** 1.6);
    const a = theta0 + turns * 2 * Math.PI * t;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a) * tilt).toFixed(1)}`);
  }
  return `M${pts.join('L')}`;
}
```
```svg
<g class="smil"><circle r="1.4" fill="#FFF1D6">
  <animateMotion dur="7s" begin="-2.3s" repeatCount="indefinite" path="M…"/>
  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.1;.85;1" dur="7s" begin="-2.3s" repeatCount="indefinite"/>
</circle></g>
```
- Use 6–10 particles with seeded `begin` values and start angles.
- Draw them in the back layer, so the shadow swallows them.

## R11 · Contribution galaxy devour (880×220, 24 s loop)
```js
const x = 40 + w * 15.1, y = 50 + d * 15;                 // w = 0…52, d = 0…6, plus seeded jitter ±1.5
const R = [0.7, 1.2, 1.7, 2.2, 2.8], A = [0.16, 0.5, 0.7, 0.86, 1]; // by contribution level 0–4
const tw = ((x - 40) / 800) * 12;                         // the hole crosses x 40 → 840 in 0–12 s
// one group per column:
// <g class="col" style="animation-delay:${(tw - 24).toFixed(2)}s;transform-origin:${x.toFixed(1)}px 110px">…7 stars…</g>
// the hole, wrapped so its own transform stays free:
// <g transform="translate(40 110)"><g class="hole">…mini black hole (R3 scaled)…</g></g>
```
```css
.col{animation:devour 24s linear infinite}
@keyframes devour{
  0%{transform:none;opacity:1}
  3.3%,14.6%{transform:rotate(140deg) scale(.05);opacity:0}
  20.8%,100%{transform:none;opacity:1}
}
.hole{animation:hole 24s linear infinite}
@keyframes hole{0%{transform:translateX(0);opacity:0}3%{opacity:1}50%{transform:translateX(800px);opacity:1}53%,100%{transform:translateX(830px);opacity:0}}
```
- Negative delays (`tw − 24 s`) put every column mid-cycle at t = 0. So frame 0 is the complete galaxy, with the hole just about to enter.
- Each column:
  - swirls into the hole over 0.8 s
  - stays hidden for 2.7 s
  - re-forms over 1.5 s in the hole's wake
- From 12 to 24 s, the full galaxy rests.
- Animate the 53 column groups, not 371 individual stars.

## R12 · Starfield and HUD radar
```js
// Starfield, seeded, in 3 depths: { r: [0.4, 0.7], a: 0.5 } · { r: [0.7, 1.1], a: 0.75 } · { r: [1.1, 1.6], a: 1 }
// 8% of stars get class "tw", with --p between 2.4 and 5 s and a negative delay.
```
```css
.tw{animation:tw var(--p,3.6s) ease-in-out infinite}
@keyframes tw{50%{opacity:.25}}
.radar{transform-origin:0 0;animation:spin 4s linear infinite} /* rotates around the parent's local origin */
```
```svg
<linearGradient id="s-sweep" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#4FD8FF" stop-opacity=".45"/>
  <stop offset="1" stop-color="#4FD8FF" stop-opacity="0"/>
</linearGradient>
<g transform="translate(90 100)">
  <circle r="60" fill="none" stroke="#262E4A"/><circle r="40" fill="none" stroke="#262E4A"/>
  <g class="radar"><path d="M0 0L60 0A60 60 0 0 0 42.4 -42.4Z" fill="url(#s-sweep)"/></g>
</g>
```
