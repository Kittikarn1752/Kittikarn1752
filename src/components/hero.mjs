// C1 hero (SPEC §3): an original, Gargantua-inspired black hole with the
// wordmark, a typing role rotator and the SGR A* micro-HUD.
// Layers, back to front: void + vignette, nebula, starfield, lensed streaks,
// back disk, lensed halo, infall, photon ring, shadow, front disk, type + HUD.
import { rng } from '../lib/rng.mjs';
import { el, n, px, py, svgDoc, starfield, TWINKLE_CSS } from '../lib/svg.mjs';
import { textPath, capHeight, measure, caps } from '../lib/text.mjs';

const W = 880;
const H = 368;

const PHYSICS = {
  tilt: 0.15, // cos(inclination): near edge-on
  disk: { inner: 1.18, outer: 3.9, rings: 9 },
  halo: { shift: 0.17, reach: 1.52, a: 1 },
  beam: [0.38, 1],
  bloom: { rx: 3.6, ry: 1.25, a: 0.2 },
  flare: 0.32,
};

// Composition: the hole sits on the right third, the wordmark on the left
// (direction A "Gargantua", picked in the P1 concept sprint).
const LOOK = {
  ...PHYSICS,
  w: W,
  h: H,
  hole: { cx: 636, cy: 184, rsh: 54 },
  type: { x: 56, maxW: 344, baseline: 190, size: 46, roleGap: 40, staticW: 404, staticRows: 1 },
  label: { x: 56, y: 56 },
  coords: { x: 56, y: 328 },
  inset: 20,
  bg: { stars: 170, nebV: [210, 70, 340, 150], nebI: [790, 330, 300, 120], vig: [W * 0.55, H / 2, 560], voidR: 620 },
};

// Phone layout (≤ 600 px, through <picture>), concept B "cinematic crop"
// picked in P5: 360 wide, so the HUD and role type render near their design
// size instead of ~5 px at 375 px. The disk runs off the right edge; the
// coordinates line is dropped.
const PH = 320;
const PHONE = {
  ...PHYSICS,
  w: 360,
  h: PH,
  hole: { cx: 240, cy: 120, rsh: 44 },
  type: { x: 28, maxW: 304, baseline: 236, size: 46, roleGap: 34, staticW: 304, staticRows: 2 },
  label: { x: 28, y: 40 },
  coords: null,
  inset: 12,
  bg: { stars: Math.round((170 * 360 * PH) / (W * H)), nebV: [86, PH * 0.18, 220, PH * 0.3], nebI: [324, PH * 0.88, 180, PH * 0.22], vig: [180, 120, 380], voidR: 420 },
};

const HUD_LINE = 'SGR A* · RA 17h45m40s · DEC −29°00′28″';

// Dash pattern in real units that tiles the circumference exactly, so the
// rotating ring has no seam. `r` is the seeded RNG.
function dashes(r, circumference, { minRepeat = 3, density = 0.6 } = {}) {
  const repeat = Math.max(minRepeat, Math.round(circumference / r.range(70, 120)));
  const unit = circumference / repeat;
  const parts = [];
  const count = r.int(2, 4);
  for (let i = 0; i < count; i++) parts.push(r.range(0.4, 1.6) * density, r.range(0.3, 1.2) * (1 - density) + 0.15);
  const sum = parts.reduce((a, b) => a + b, 0);
  return parts.map((p) => n((p / sum) * unit)).join(' ');
}

// Exported for the game (C8): `id` prefixes every def, `w`/`h` size the clips.
export function blackHole(r, look, c, { id = 'h', w = W, h = H } = {}) {
  const { cx, cy, rsh } = look.hole;
  const rin = rsh * look.disk.inner;
  const rout = rsh * look.disk.outer;
  const t = look.tilt;
  const defs = [];
  const layers = {};

  // Disk body: a static radial gradient across the annulus, then rotating
  // dashed rings for plasma streaks (inner rings faster: 6 → 12 → 24 s).
  const f = (v) => n(v / rout);
  defs.push(
    el(
      'radialGradient',
      { id: `${id}-diskG`, gradientUnits: 'userSpaceOnUse', cx: 0, cy: 0, r: rout },
      [
        el('stop', { offset: f(rin * 0.97), 'stop-color': c.photon, 'stop-opacity': 0 }),
        el('stop', { offset: f(rin), 'stop-color': c.photon, 'stop-opacity': 0.95 }),
        el('stop', { offset: f(rin + (rout - rin) * 0.22), 'stop-color': c.gold, 'stop-opacity': 0.85 }),
        el('stop', { offset: f(rin + (rout - rin) * 0.52), 'stop-color': c.plasma, 'stop-opacity': 0.5 }),
        el('stop', { offset: 1, 'stop-color': c.plasma, 'stop-opacity': 0 }),
      ].join(''),
    ),
  );
  const annulus =
    `M${n(-rout)} 0a${n(rout)} ${n(rout)} 0 1 0 ${n(2 * rout)} 0a${n(rout)} ${n(rout)} 0 1 0 ${n(-2 * rout)} 0Z` +
    `M${n(-rin)} 0a${n(rin)} ${n(rin)} 0 1 0 ${n(2 * rin)} 0a${n(rin)} ${n(rin)} 0 1 0 ${n(-2 * rin)} 0Z`;
  let rings = '';
  const N = look.disk.rings;
  for (let k = 0; k < N; k++) {
    const u = k / (N - 1);
    const radius = rin + (rout - rin) * (0.04 + 0.86 * u ** 1.3);
    const width = ((rout - rin) / N) * (1.5 - 0.5 * u);
    const color = u < 0.22 ? c.photon : u < 0.6 ? c.gold : c.plasma;
    const opacity = 0.1 + 0.75 * (1 - u) ** 1.4;
    const period = u < 0.3 ? 6 : u < 0.66 ? 12 : 24;
    const dash = dashes(r, 2 * Math.PI * radius, { density: 0.55 + 0.25 * (1 - u) });
    rings += el(
      'g',
      { class: 'spin', style: `--p:${period}s;animation-delay:-${n(r.range(0, period))}s` },
      el('circle', { r: radius, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-dasharray': dash, opacity }),
    );
  }
  const disk = el('g', { transform: `translate(${n(cx)} ${n(cy)}) scale(1 ${n(t)})` }, el('path', { d: annulus, 'fill-rule': 'evenodd', fill: `url(#${id}-diskG)` }) + rings + el('circle', { r: rin * 1.02, fill: 'none', stroke: c.photon, 'stroke-width': 1.4, 'vector-effect': 'non-scaling-stroke', opacity: 0.85 }));

  // The two halves come from the same disk: the far half sits behind the
  // shadow, the near half crosses in front of it.
  defs.push(el('clipPath', { id: `${id}-back` }, el('rect', { width: w, height: cy })));
  defs.push(el('clipPath', { id: `${id}-front` }, el('rect', { y: cy, width: w, height: h - cy })));

  // Doppler beaming: a static mask that brightens the approaching (right) side.
  defs.push(
    el(
      'linearGradient',
      { id: `${id}-beamG`, gradientUnits: 'userSpaceOnUse', x1: cx - rout, x2: cx + rout, y1: 0, y2: 0 },
      el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': look.beam[0] }) + el('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': look.beam[1] }),
    ),
  );
  defs.push(el('mask', { id: `${id}-beam`, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: w, height: h }, el('rect', { width: w, height: h, fill: `url(#${id}-beamG)` })));

  layers.diskBack = el('g', { 'clip-path': `url(#${id}-back)`, mask: `url(#${id}-beam)` }, disk);
  layers.diskFront = el('g', { 'clip-path': `url(#${id}-front)`, mask: `url(#${id}-beam)` }, disk);

  // Lensed far side of the disk: a halo whose centre sits above the hole, so
  // the arc over the shadow is thicker than the one beneath it.
  const hcy = cy - rsh * look.halo.shift;
  const reach = rsh * look.halo.reach;
  const g = (v) => n((rsh * v) / reach);
  // The shadow's top edge, measured from the shifted halo centre.
  const top = 1 - look.halo.shift;
  defs.push(
    el(
      'radialGradient',
      { id: `${id}-haloG`, gradientUnits: 'userSpaceOnUse', cx, cy: hcy, r: reach },
      [
        el('stop', { offset: g(top - 0.04), 'stop-color': c.photon, 'stop-opacity': 0 }),
        el('stop', { offset: g(top), 'stop-color': c.photon, 'stop-opacity': 0.95 * look.halo.a }),
        el('stop', { offset: g(top + 0.12), 'stop-color': c.gold, 'stop-opacity': 0.85 * look.halo.a }),
        el('stop', { offset: g(top + 0.3), 'stop-color': c.plasma, 'stop-opacity': 0.38 * look.halo.a }),
        el('stop', { offset: 1, 'stop-color': c.plasma, 'stop-opacity': 0 }),
      ].join(''),
    ),
  );
  let haloTexture = '';
  for (const [k, rr] of [1.14, 1.32].entries()) {
    const period = k ? 24 : 12;
    haloTexture += el(
      'g',
      { class: 'spin', style: `--p:${period}s;animation-delay:-${n(r.range(0, period))}s` },
      el('circle', {
        cx,
        cy: hcy,
        r: rsh * rr,
        fill: 'none',
        stroke: k ? c.plasma : c.gold,
        'stroke-width': k ? 5 : 3,
        'stroke-dasharray': dashes(r, 2 * Math.PI * rsh * rr, { density: 0.6 }),
        opacity: k ? 0.16 : 0.3,
      }),
    );
  }
  layers.halo = el('g', { mask: `url(#${id}-beam)` }, el('circle', { cx, cy: hcy, r: reach, fill: `url(#${id}-haloG)` }) + haloTexture);

  // Bloom and anamorphic flare: static light, no filters.
  defs.push(
    el(
      'radialGradient',
      { id: `${id}-bloomG` },
      el('stop', { offset: 0, 'stop-color': c.gold, 'stop-opacity': look.bloom.a }) +
        el('stop', { offset: 0.45, 'stop-color': c.plasma, 'stop-opacity': look.bloom.a * 0.35 }) +
        el('stop', { offset: 1, 'stop-color': c.plasma, 'stop-opacity': 0 }),
    ),
  );
  layers.bloom = el('ellipse', { cx, cy, rx: rsh * look.bloom.rx, ry: rsh * look.bloom.ry, fill: `url(#${id}-bloomG)` });
  if (look.flare) {
    defs.push(
      el(
        'linearGradient',
        { id: `${id}-flareG` },
        el('stop', { offset: 0, 'stop-color': c.photon, 'stop-opacity': 0 }) +
          el('stop', { offset: 0.5, 'stop-color': c.photon, 'stop-opacity': look.flare }) +
          el('stop', { offset: 1, 'stop-color': c.photon, 'stop-opacity': 0 }),
      ),
    );
    const fw = rout * 2.5;
    layers.flare = el('rect', { x: cx - fw / 2, y: cy + rin * t - 0.6, width: fw, height: 1.2, fill: `url(#${id}-flareG)` });
  }

  // Photon ring and shadow (≈ 2.6 Rs).
  layers.photon =
    el('circle', { cx, cy, r: rsh * 1.035, fill: 'none', stroke: c.photon, 'stroke-width': 0.6, opacity: 0.45 }) +
    el('circle', { cx, cy, r: rsh * 1.012, fill: 'none', stroke: c.photon, 'stroke-width': 1.3, opacity: 0.95 });
  layers.shadow = el('circle', { cx, cy, r: rsh, fill: '#000' });

  // Static lensed star streaks: short tangential arcs around the hole.
  let streaks = '';
  for (let i = 0; i < 9; i++) {
    let a = r.range(0, Math.PI * 2);
    if (Math.abs(Math.sin(a)) < 0.3) a += Math.PI / 2;
    const rr = rsh * r.range(1.8, 2.9);
    const span = r.range(0.05, 0.16);
    streaks += el('path', {
      d: `M${px(cx, rr, a)} ${py(cy, rr, a)}A${n(rr)} ${n(rr)} 0 0 1 ${px(cx, rr, a + span)} ${py(cy, rr, a + span)}`,
      fill: 'none',
      stroke: c.photon,
      'stroke-width': r.range(0.5, 0.9),
      'stroke-linecap': 'round',
      opacity: r.range(0.12, 0.34),
    });
  }
  layers.streaks = streaks;

  // Infalling particles (recipe R10): seeded spirals in the disk plane that
  // accelerate inward; the shadow swallows them.
  let particles = '';
  for (let i = 0; i < 8; i++) {
    const r0 = rout * r.range(0.6, 0.92);
    const turns = r.range(0.9, 1.5);
    const theta0 = r.range(0, Math.PI * 2);
    const pts = [];
    for (let s = 0; s <= 40; s++) {
      const u = s / 40;
      const rr = rsh * 0.96 + (r0 - rsh * 0.96) * (1 - u ** 1.6);
      const a = theta0 + turns * 2 * Math.PI * u;
      pts.push(`${n(cx + rr * Math.cos(a))} ${n(cy + rr * Math.sin(a) * t)}`);
    }
    const dur = r.pick([6, 8, 12]);
    const begin = `-${n(r.range(0, dur))}s`;
    particles += el(
      'circle',
      { r: r.range(0.9, 1.6), fill: c.photon, opacity: 0 },
      el('animateMotion', { dur: `${dur}s`, begin, repeatCount: 'indefinite', path: `M${pts.join('L')}` }) +
        el('animate', { attributeName: 'opacity', values: '0;1;1;0', keyTimes: '0;.12;.86;1', dur: `${dur}s`, begin, repeatCount: 'indefinite' }),
    );
  }
  layers.particles = el('g', { class: 'smil' }, particles);

  return { defs: defs.join(''), layers };
}

function background(r, look, c, tokens) {
  const { cx, cy, rsh } = look.hole;
  const { w, h, bg } = look;
  const [vx, vy, vr] = bg.vig;
  const ellipse = ([ecx, ecy, rx, ry], fill) => el('ellipse', { cx: n(ecx), cy: n(ecy), rx: n(rx), ry: n(ry), fill });
  const defs =
    el(
      'radialGradient',
      { id: 'h-voidG', gradientUnits: 'userSpaceOnUse', cx, cy, r: bg.voidR },
      el('stop', { offset: 0, 'stop-color': c.deep }) + el('stop', { offset: 1, 'stop-color': c.void }),
    ) +
    el(
      'radialGradient',
      { id: 'h-vigG', gradientUnits: 'userSpaceOnUse', cx: n(vx), cy: n(vy), r: vr },
      el('stop', { offset: 0.5, 'stop-color': c.void, 'stop-opacity': 0 }) + el('stop', { offset: 1, 'stop-color': c.void, 'stop-opacity': 0.85 }),
    ) +
    el('radialGradient', { id: 'h-nebV' }, el('stop', { offset: 0, 'stop-color': tokens.color.accent.violet, 'stop-opacity': 0.13 }) + el('stop', { offset: 1, 'stop-color': tokens.color.accent.violet, 'stop-opacity': 0 })) +
    el('radialGradient', { id: 'h-nebI' }, el('stop', { offset: 0, 'stop-color': tokens.color.accent.ion, 'stop-opacity': 0.07 }) + el('stop', { offset: 1, 'stop-color': tokens.color.accent.ion, 'stop-opacity': 0 }));
  const body =
    el('rect', { width: w, height: h, fill: 'url(#h-voidG)' }) +
    ellipse(bg.nebV, 'url(#h-nebV)') +
    ellipse(bg.nebI, 'url(#h-nebI)') +
    starfield(r, { w, h, count: bg.stars, color: c.photon, twinkleShare: tokens.motion.twinkleShare, avoid: [{ x: cx, y: cy, r: rsh * 1.7 }] });
  return { defs, body, vignette: el('rect', { width: w, height: h, fill: 'url(#h-vigG)' }) };
}

// Wordmark with sheen (R6), role rotator (R7) and HUD.
function typography(look, profile, fonts, tokens) {
  const c = tokens.color;
  const { x, maxW, baseline } = look.type;
  const name = profile.displayName.toUpperCase();
  const tracking = 0.14;
  const unit = measure(fonts.display, name, 1, tracking);
  const size = Math.min(look.type.size, maxW / unit);
  const wm = textPath(fonts.display, name, { x, y: baseline, size, tracking });
  const cap = capHeight(fonts.display, size);

  const defs =
    el('linearGradient', { id: 'h-wmG', x1: 0, y1: 0, x2: 0, y2: 1 }, el('stop', { offset: 0, 'stop-color': '#FFFFFF' }) + el('stop', { offset: 1, 'stop-color': c.text.onDark })) +
    el('clipPath', { id: 'h-wmC' }, el('path', { d: wm.d })) +
    el(
      'linearGradient',
      { id: 'h-sheenG', x1: 0, x2: 1, y1: 0, y2: 0 },
      el('stop', { offset: 0, 'stop-color': c.accretion.photon, 'stop-opacity': 0 }) +
        el('stop', { offset: 0.5, 'stop-color': c.accretion.photon, 'stop-opacity': 0.85 }) +
        el('stop', { offset: 1, 'stop-color': c.accretion.photon, 'stop-opacity': 0 }),
    );
  let body = el('path', { d: wm.d, fill: 'url(#h-wmG)' });
  body += el('g', { 'clip-path': 'url(#h-wmC)' }, el('g', { transform: `translate(${n(x)} 0) skewX(-20)` }, el('rect', { class: 'sheen', x: -120, y: baseline - cap - 10, width: 70, height: cap + 20, fill: 'url(#h-sheenG)' })));

  // Role rotator: five titles, 3 s each (15 s), typed in mono with a caret.
  const roleSize = 17;
  const roleY = baseline + look.type.roleGap;
  const roles = profile.skills.map((s) => caps(s.title));
  const prompt = textPath(fonts.monoBold, '›', { x, y: roleY, size: roleSize });
  const rx = x + prompt.width + 10;
  const capR = capHeight(fonts.mono, roleSize);
  let css = '';
  let roleDefs = '';
  let roleBody = el('path', { d: prompt.d, fill: c.accent.ion });
  roles.forEach((title, i) => {
    const tp = textPath(fonts.mono, title, { x: rx, y: roleY, size: roleSize, tracking: 0.08 });
    const delay = `${n(i * 3 - 1.6)}s`;
    const steps = title.length + 1;
    roleDefs += el('clipPath', { id: `h-r${i}` }, el('rect', { class: 'type', style: `animation-delay:${delay};animation-timing-function:steps(${steps},end)`, x: rx - 2, y: roleY - capR - 6, width: tp.width + 16, height: capR + 12 }));
    roleBody += el(
      'g',
      { class: i === 0 ? 'role r0' : 'role', style: `animation-delay:${delay}` },
      el('g', { 'clip-path': `url(#h-r${i})` }, el('path', { d: tp.d, fill: c.text.onDark }) + el('rect', { class: 'caret', x: rx + tp.width + 5, y: roleY - capR - 1, width: 2, height: capR + 3, fill: c.accent.ion })),
    );
  });
  // Static fallback: all five titles on `staticRows` lines, sized to fit.
  const titles = profile.skills.map((s) => s.title);
  const per = Math.ceil(titles.length / look.type.staticRows);
  const rows = [];
  for (let i = 0; i < titles.length; i += per) rows.push(titles.slice(i, i + per).join('  ·  '));
  const allSize = Math.min(13, ...rows.map((row) => look.type.staticW / measure(fonts.mono, row, 1)));
  const allD = rows.map((row, i) => textPath(fonts.mono, row, { x, y: roleY + i * (allSize + 7), size: allSize }).d).join('');
  body += el('g', { class: 'roles' }, roleBody) + el('path', { class: 'static', d: allD, fill: c.text.onDark });
  css +=
    '.role{opacity:0;animation:role 15s linear infinite}.r0{opacity:1}' +
    '@keyframes role{0%,19.9%{opacity:1}20%,100%{opacity:0}}' +
    '.type{transform-box:fill-box;transform-origin:left center;animation:type 15s infinite}' +
    '@keyframes type{0%{transform:scaleX(0)}8%,19.9%{transform:scaleX(1);animation-timing-function:steps(1)}20%,100%{transform:scaleX(0)}}' +
    '.caret{animation:blink 1s steps(1) infinite}@keyframes blink{50%{opacity:0}}' +
    '.sheen{animation:sheen 8s cubic-bezier(.65,0,.35,1) infinite}' +
    `@keyframes sheen{0%,70%{transform:translateX(0)}100%{transform:translateX(${n(wm.width + 260)}px)}}` +
    '@media (prefers-reduced-motion:reduce){.roles{display:none}}';

  return { defs: defs + roleDefs, body, css, wordmark: { x, baseline, cap, width: wm.width, size }, roleY };
}

function hud(look, fonts, tokens) {
  const c = tokens.color;
  const muted = c.text.mutedOnDark;
  const { w, h } = look;
  let out = '';
  if (look.coords) {
    const coord = textPath(fonts.mono, HUD_LINE, { x: look.coords.x, y: look.coords.y, size: 10.5, tracking: 0.06 });
    out += el('path', { d: coord.d, fill: muted });
  }
  const label = textPath(fonts.mono, 'EVENT HORIZON', { x: look.label.x, y: look.label.y, size: 10.5, tracking: 0.32 });
  out += el('path', { d: label.d, fill: c.accent.ion, opacity: 0.85 });
  out += el('rect', { x: n(look.label.x + label.width + 14), y: look.label.y - 4, width: 40, height: 1, fill: c.accent.ion, opacity: 0.5 });

  const bracket = (x, y, sx, sy, len = 14) => `M${n(x)} ${n(y + sy * len)}V${n(y)}H${n(x + sx * len)}`;
  const m = look.inset;
  const d = [bracket(m, m, 1, 1), bracket(w - m, m, -1, 1), bracket(m, h - m, 1, -1), bracket(w - m, h - m, -1, -1)].join('');
  out += el('path', { d, fill: 'none', stroke: c.accent.ion, 'stroke-width': 1, opacity: 0.55 });
  return out;
}

function heroSvg(look, seed, { profile, tokens, fonts }) {
  const { w, h } = look;
  const c = { ...tokens.color.space, ...tokens.color.accretion };
  const r = rng(seed);
  const bg = background(r, look, c, tokens);
  const bh = blackHole(r, look, c, { w, h });
  const type = typography(look, profile, fonts, tokens);

  const css =
    '.spin{transform-box:fill-box;transform-origin:center;animation:spin var(--p,24s) linear infinite}@keyframes spin{to{transform:rotate(1turn)}}' +
    TWINKLE_CSS +
    type.css;
  const L = bh.layers;
  const scene = bg.body + L.streaks + L.bloom + L.diskBack + L.halo + L.particles + L.photon + L.shadow + L.diskFront + (L.flare ?? '') + bg.vignette;
  const frame = el('rect', { x: 0.5, y: 0.5, width: w - 1, height: h - 1, rx: 23.5, fill: 'none', stroke: c.line, 'stroke-width': 1 });
  const body = el('g', { 'clip-path': 'url(#h-clip)' }, scene + type.body + hud(look, fonts, tokens)) + frame;
  const defs = el('clipPath', { id: 'h-clip' }, el('rect', { width: w, height: h, rx: 24 })) + bg.defs + bh.defs + type.defs;
  const titles = profile.skills.map((s) => s.title).join(', ');
  return svgDoc({
    id: 'h',
    w,
    h,
    title: `${profile.displayName} — Event Horizon`,
    desc: `Animated black hole with a rotating accretion disk ${look.w === W ? 'beside' : 'with'} the name ${profile.displayName}. Roles: ${titles}.`,
    css,
    defs,
    body,
  });
}

export default function render(ctx) {
  return {
    files: [
      { path: 'assets/hero/hero.svg', svg: heroSvg(LOOK, 'hero', ctx) },
      { path: 'assets/hero/hero-mobile.svg', svg: heroSvg(PHONE, 'hero-mobile', ctx) },
    ],
  };
}
