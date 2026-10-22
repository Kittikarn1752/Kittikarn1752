// C5 observatory telemetry (SPEC §3): HUD panel with corner brackets, a radar
// sweep (R12), odometer digits that roll in once (R8) and a SYNCED stamp.
// Metrics with a value of 0 are left out; the cells re-flow to fit the rest.
// No file without data/github.json.
import { rng } from '../lib/rng.mjs';
import { el, n, roundRectPath, svgDoc, starfield, TWINKLE_CSS } from '../lib/svg.mjs';
import { textPath, capHeight } from '../lib/text.mjs';

const W = 880;
const H = 200;
const H2 = 228;
const DESK_RADAR = { x: 112, y: 106, r: 64 };
const X0 = 222;
const X1 = 852;

export const plural = (k, one, many = `${one}s`) => `${k} ${k === 1 ? one : many}`;

// The metrics SPEC lists, in order; zeros drop out.
export function metrics(gh) {
  const day = (v) => (v === 1 ? 'DAY' : 'DAYS');
  return [
    { label: 'CONTRIBUTIONS', sub: 'LAST YEAR', v: gh.totals.contributionsYear, alt: 'contributions in the last year' },
    { label: 'COMMITS', sub: 'LAST YEAR', v: gh.totals.commitsYear, alt: 'commits in the last year' },
    { label: 'STARS', sub: 'EARNED', v: gh.totals.stars, alt: 'stars earned' },
    { label: 'PULL REQUESTS', sub: 'ALL TIME', v: gh.totals.prs, alt: 'pull requests' },
    { label: 'ISSUES', sub: 'ALL TIME', v: gh.totals.issues, alt: 'issues' },
    { label: 'PUBLIC REPOS', sub: 'OWNED', v: gh.user.publicRepos, alt: 'public repos' },
    { label: 'FOLLOWERS', sub: 'ON GITHUB', v: gh.user.followers, alt: 'followers' },
    { label: 'CURRENT STREAK', sub: day(gh.streak.current), v: gh.streak.current, hot: true, alt: `${day(gh.streak.current).toLowerCase()} current streak` },
    { label: 'LONGEST STREAK', sub: day(gh.streak.longest), v: gh.streak.longest, hot: true, alt: `${day(gh.streak.longest).toLowerCase()} longest streak` },
  ].filter((m) => m.v > 0);
}

export const syncedStamp = (gh) => `${gh.generatedAt.slice(0, 10)} ${gh.generatedAt.slice(11, 16)} UTC`;

export function brackets(w, h, color, inset = 12, len = 16) {
  const corner = (x, y, dx, dy) => `M${x + dx * len} ${y}H${x}V${y + dy * len}`;
  const d = corner(inset, inset, 1, 1) + corner(w - inset, inset, -1, 1) + corner(inset, h - inset, 1, -1) + corner(w - inset, h - inset, -1, -1);
  return el('path', { d, fill: 'none', stroke: color, 'stroke-width': 1.5, opacity: 0.7 });
}

// Glass panel shared by the observatory panels: gradient, stars, 1 px edge.
export function panel(id, h, r, tokens, stars, w = W) {
  const c = tokens.color;
  const frame = roundRectPath(0.5, 0.5, w - 1, h - 1, 19.5);
  return {
    defs:
      el('clipPath', { id: `${id}-clip` }, el('path', { d: frame })) +
      el('linearGradient', { id: `${id}-bg`, x1: 0, y1: 0, x2: 0, y2: 1 }, el('stop', { offset: 0, 'stop-color': c.space.deep }) + el('stop', { offset: 1, 'stop-color': c.space.void })),
    back: (extra = '') => el('g', { 'clip-path': `url(#${id}-clip)` }, el('path', { d: frame, fill: `url(#${id}-bg)` }) + starfield(r, { w, h, count: stars, color: c.accretion.photon, twinkleShare: tokens.motion.twinkleShare }) + extra),
    edge: el('path', { d: frame, fill: 'none', stroke: c.space.line }),
  };
}

// Phone layout (≤ 600 px, through <picture>): header and stamp stacked on the
// left, a smaller radar on the right, metrics in a 2-column grid below.
const PW = 360;
const PRADAR = { x: 292, y: 66, r: 40 };
const PROW = { y: 156, step: 74 };

export default function render(ctx) {
  if (!ctx.data.github) return { files: [] };
  return {
    files: [
      { path: 'assets/stats/telemetry.svg', svg: telemetrySvg(false, ctx) },
      { path: 'assets/stats/telemetry-mobile.svg', svg: telemetrySvg(true, ctx) },
    ],
  };
}

function telemetrySvg(phone, { tokens, fonts, data }) {
  const gh = data.github;
  const c = tokens.color;
  const r = rng(phone ? 'telemetry-mobile' : 'telemetry');
  const list = metrics(gh);
  const twoRows = list.length > 5;
  const w = phone ? PW : W;
  // Two desktop rows get a taller panel, so row 2's digits clear row 1's labels.
  const h = phone ? PROW.y + (Math.ceil(list.length / 2) - 1) * PROW.step + 64 : twoRows ? H2 : H;
  const RADAR = phone ? PRADAR : { ...DESK_RADAR, y: h / 2 + 6 };
  const p = panel('t', h, r, tokens, phone ? 52 : 70, w);

  // Odometer glyphs 0–9, defined once and stacked with <use>.
  const size = phone ? 30 : twoRows ? 28 : 38;
  const step = Math.round(size * 1.3);
  const glyphs = [...'0123456789'].map((d) => textPath(fonts.display, d, { x: 0, y: 0, size }));
  const slot = Math.max(...glyphs.map((g) => g.width)) + 2;
  const cap = capHeight(fonts.display, size);
  let defs = p.defs;
  glyphs.forEach((g, d) => {
    defs += el('path', { id: `t-d${d}`, d: textPath(fonts.display, String(d), { x: (slot - g.width) / 2, y: 0, size }).d });
  });
  defs += el('clipPath', { id: 't-win' }, el('rect', { x: -1, y: -cap - 6, width: slot + 2, height: cap + 12 }));
  defs += el('linearGradient', { id: 't-sweep', x1: 0, y1: 0, x2: 1, y2: 0 }, el('stop', { offset: 0, 'stop-color': c.accent.ion, 'stop-opacity': 0.5 }) + el('stop', { offset: 1, 'stop-color': c.accent.ion, 'stop-opacity': 0 }));

  // Radar: rings, crosshair, a 4 s sweep and one blip per public repo (max 6),
  // each flashing as the sweep's leading edge passes it.
  let blips = '';
  const count = Math.min(gh.user.publicRepos, 6);
  for (let i = 0; i < count; i++) {
    const a = ((i + r.range(0.15, 0.85)) / count) * 360;
    const rad = phone ? r.range(10, RADAR.r - 6) : r.range(16, RADAR.r - 8);
    const hit = (a / 360) * 4;
    blips += el('circle', { class: 'blip', cx: rad * Math.cos((a * Math.PI) / 180), cy: rad * Math.sin((a * Math.PI) / 180), r: 2, fill: i ? c.accent.ion : c.accretion.gold, style: `animation-delay:${n(hit - 4)}s` });
  }
  const radar = el(
    'g',
    { transform: `translate(${RADAR.x} ${RADAR.y})` },
    (phone ? [RADAR.r, 27, 14] : [RADAR.r, 44, 24]).map((rr) => el('circle', { r: rr, fill: 'none', stroke: c.space.line })).join('') +
      el('path', { d: `M${-RADAR.r - 6} 0H${RADAR.r + 6}M0 ${-RADAR.r - 6}V${RADAR.r + 6}`, stroke: c.space.line }) +
      el('g', { class: 'radar' }, el('path', { d: `M0 0L${RADAR.r} 0A${RADAR.r} ${RADAR.r} 0 0 0 ${n(RADAR.r * Math.SQRT1_2)} ${n(-RADAR.r * Math.SQRT1_2)}Z`, fill: 'url(#t-sweep)' })) +
      blips +
      el('circle', { r: 2.5, fill: c.accent.ion }),
  );

  // Cells: one row up to five metrics, otherwise two balanced rows (6 → 3 + 3,
  // never 5 + 1); pairs on a phone.
  const half = Math.ceil(list.length / 2);
  const rows = [];
  if (phone) for (let i = 0; i < list.length; i += 2) rows.push(list.slice(i, i + 2));
  else rows.push(...(twoRows ? [list.slice(0, half), list.slice(half)] : [list]));
  const base = phone ? rows.map((_, ri) => PROW.y + ri * PROW.step) : twoRows ? [96, 168] : [118];
  let cells = '';
  let k = 0;
  rows.forEach((row, ri) => {
    const [x0, x1] = phone ? [24, PW - 24] : [X0, X1];
    const cw = (x1 - x0) / (phone ? 2 : twoRows ? half : row.length);
    row.forEach((m, i) => {
      const x = x0 + i * cw;
      const y = base[ri];
      const ink = m.hot ? c.accretion.gold : c.text.onDark;
      cells += el('path', { d: `M${n(x)} ${y - cap - 6}V${y + (m.sub ? 36 : 22)}`, stroke: c.space.line });
      const digits = String(m.v);
      [...digits].forEach((d, j) => {
        let stack = '';
        for (let v = 0; v <= 9; v++) stack += el('use', { href: `#t-d${v}`, y: v * step });
        const delay = 0.3 + k * 0.12 + j * 0.08;
        cells += el('g', { transform: `translate(${n(x + 18 + j * slot)} ${y})`, 'clip-path': 'url(#t-win)' }, el('g', { class: 'roll', fill: ink, style: `transform:translateY(${-Number(d) * step}px);animation-delay:${n(delay)}s` }, stack));
      });
      cells += el('path', { d: textPath(fonts.mono, m.label, { x: x + 18, y: y + 20, size: 12.5, tracking: 0.04 }).d, fill: c.text.mutedOnDark });
      if (m.sub) cells += el('path', { d: textPath(fonts.mono, m.sub, { x: x + 18, y: y + 34, size: 10, tracking: 0.1 }).d, fill: c.text.mutedOnDark, opacity: 0.85 });
      k++;
    });
  });

  const head = textPath(fonts.mono, 'OBSERVATORY', { x: phone ? 24 : X0, y: phone ? 40 : 44, size: 11, tracking: 0.3 });
  const stamp = phone
    ? textPath(fonts.mono, `SYNCED ${syncedStamp(gh)}`, { x: 24, y: 62, size: 10, tracking: 0.08 })
    : textPath(fonts.mono, `SYNCED ${syncedStamp(gh)}`, { x: W - 28, y: 44, size: 10.5, tracking: 0.15, anchor: 'end' });
  const body = p.back() + p.edge + brackets(w, h, c.accent.ion) + radar + el('path', { d: head.d, fill: c.accent.ion }) + el('path', { d: stamp.d, fill: c.text.mutedOnDark }) + cells;

  // Base styles are the final state, so a still frame shows the right numbers.
  const css =
    TWINKLE_CSS +
    '.roll{animation:roll 1.8s cubic-bezier(.22,1,.36,1) backwards}@keyframes roll{from{transform:translateY(0)}}' +
    '.radar{transform-origin:0 0;animation:spin 4s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}' +
    '.blip{opacity:.9;animation:blip 4s linear infinite}@keyframes blip{0%{opacity:1}60%,100%{opacity:.2}}';
  const title = `Observatory: ${list.map((m) => `${m.v} ${m.alt}`).join(', ')}. Synced ${syncedStamp(gh)}.`;
  return svgDoc({ id: 't', w, h, title, css, defs, body });
}
