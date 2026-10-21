// C7 contribution galaxy (SPEC §3, recipe R11): the last 53 weeks, one star
// per day, sized and lit by contribution level; empty days are faint dust.
// A mini black hole crosses left to right in 0–12 s, each column swirls into
// it and re-forms in its wake; 12–24 s the galaxy rests. At t = 0 (and with
// reduced motion) it reads as the plain contribution graph.
import { rng } from '../lib/rng.mjs';
import { el, n, svgDoc, TWINKLE_CSS } from '../lib/svg.mjs';
import { textPath } from '../lib/text.mjs';
import { brackets, panel, plural } from './telemetry.mjs';

const W = 880;
const H = 220;
const GX = 40;
const GY = 58;
const DX = 15.1;
const DY = 15;
const MID = GY + 3 * DY;
const TRAVEL = 800;
const R = [1.1, 1.5, 1.9, 2.4, 3];
const A = [0.3, 0.6, 0.75, 0.9, 1];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export const galaxyCaption = (gh) => `${plural(gh.totals.contributionsYear, 'contribution')} in the last year · longest streak ${plural(gh.streak.longest, 'day')}`;

// Mini black hole (R3 scaled): back half of the disk, shadow with photon ring, front half.
function hole(c) {
  return (
    el('path', { d: 'M-24 0A24 5.5 0 0 1 24 0', fill: 'none', stroke: 'url(#g-disk)', 'stroke-width': 3, opacity: 0.75 }) +
    el('path', { d: 'M-12.5 -1A12.5 11 0 0 1 12.5 -1', fill: 'none', stroke: c.accretion.gold, 'stroke-width': 1.4, opacity: 0.55 }) +
    el('circle', { r: 9.6, fill: 'none', stroke: c.accretion.photon, 'stroke-width': 1, opacity: 0.9 }) +
    el('circle', { r: 8.8, fill: '#000' }) +
    el('path', { d: 'M-24 0A24 5.5 0 0 0 24 0', fill: 'none', stroke: 'url(#g-disk)', 'stroke-width': 3.2 })
  );
}

export default function render({ tokens, fonts, data }) {
  const gh = data.github;
  if (!gh) return { files: [] };
  const c = tokens.color;
  const r = rng('galaxy');
  const p = panel('g', H, r, tokens, 36);
  const color = (lv) => (lv === 4 ? c.accretion.gold : lv === 3 ? c.accretion.photon : lv ? c.accent.ion : c.accent.titanium);

  const dow0 = new Date(`${gh.calendar[0].date}T00:00:00Z`).getUTCDay();
  const columns = [];
  gh.calendar.forEach((d, i) => {
    const w = Math.floor((i + dow0) / 7);
    (columns[w] ??= []).push({ ...d, row: (i + dow0) % 7 });
  });

  let cols = '';
  columns.forEach((days, w) => {
    const x = GX + w * DX;
    let stars = '';
    for (const d of days) {
      const sx = x + r.range(-1.5, 1.5);
      const sy = GY + d.row * DY + r.range(-1.5, 1.5);
      if (d.level >= 3) stars += el('circle', { cx: sx, cy: sy, r: d.level === 4 ? 11 : 8, fill: `url(#g-h${d.level})` });
      stars += el('circle', { cx: sx, cy: sy, r: R[d.level], fill: color(d.level), opacity: A[d.level] });
    }
    // The hole reaches this column at tw seconds; a negative delay puts frame 0 mid-loop.
    const tw = ((x - GX) / TRAVEL) * 12;
    cols += el('g', { class: 'col', style: `animation-delay:${n(tw - 24)}s;transform-origin:${n(x)}px ${MID}px` }, stars);
  });

  let months = '';
  gh.calendar.forEach((d, i) => {
    if (!d.date.endsWith('-01')) return;
    const x = GX + Math.floor((i + dow0) / 7) * DX;
    if (x > W - 60) return;
    months += el('path', { d: textPath(fonts.mono, MONTHS[Number(d.date.slice(5, 7)) - 1], { x: x - 2, y: 182, size: 11, tracking: 0.1 }).d, fill: c.text.mutedOnDark, opacity: 0.75 });
  });

  // Legend: less → more, as on GitHub.
  let legend = '';
  const lx = W - 28;
  const more = textPath(fonts.mono, 'MORE', { x: lx, y: 40, size: 9.5, tracking: 0.15, anchor: 'end' });
  let cx = more.x - 12;
  for (let lv = 4; lv >= 0; lv--) {
    legend += el('circle', { cx, cy: 36.5, r: R[lv], fill: color(lv), opacity: A[lv] });
    cx -= 12;
  }
  const less = textPath(fonts.mono, 'LESS', { x: cx + 2, y: 40, size: 9.5, tracking: 0.15, anchor: 'end' });
  legend += el('path', { d: more.d + less.d, fill: c.text.mutedOnDark });

  const defs =
    p.defs +
    el('linearGradient', { id: 'g-disk', x1: 0, x2: 1, y1: 0, y2: 0 }, el('stop', { offset: 0, 'stop-color': c.accretion.plasma, 'stop-opacity': 0.5 }) + el('stop', { offset: 0.5, 'stop-color': c.accretion.gold }) + el('stop', { offset: 1, 'stop-color': c.accretion.photon })) +
    [3, 4].map((lv) => el('radialGradient', { id: `g-h${lv}` }, el('stop', { offset: 0, 'stop-color': color(lv), 'stop-opacity': 0.5 }) + el('stop', { offset: 1, 'stop-color': color(lv), 'stop-opacity': 0 }))).join('');

  const head = textPath(fonts.mono, `CONTRIBUTION GALAXY · ${columns.length} WEEKS`, { x: 28, y: 40, size: 11, tracking: 0.3 });
  const caption = galaxyCaption(gh);
  const body =
    p.back() +
    p.edge +
    brackets(W, H, c.accent.ion) +
    el('path', { d: head.d, fill: c.accent.ion }) +
    legend +
    cols +
    months +
    el('g', { transform: `translate(${GX} ${MID})` }, el('g', { class: 'hole' }, hole(c))) +
    el('path', { d: textPath(fonts.ui, caption, { x: W / 2, y: 205, size: 15, anchor: 'middle' }).d, fill: c.text.onDark });

  const css =
    TWINKLE_CSS +
    '.col{animation:devour 24s linear infinite}' +
    '@keyframes devour{0%{transform:none;opacity:1}3.3%,14.6%{transform:rotate(140deg) scale(.05);opacity:0}20.8%,100%{transform:none;opacity:1}}' +
    '.hole{opacity:0;animation:hole 24s linear infinite}' +
    `@keyframes hole{0%{transform:translateX(0);opacity:0}3%{opacity:1}50%{transform:translateX(${TRAVEL}px);opacity:1}53%,100%{transform:translateX(${TRAVEL + 30}px);opacity:0}}`;
  return { files: [{ path: 'assets/galaxy/galaxy.svg', svg: svgDoc({ id: 'g', w: W, h: H, title: `Contribution galaxy: ${caption}`, css, defs, body }) }] };
}
