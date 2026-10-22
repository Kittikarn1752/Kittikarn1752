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

// Phone layout (≤ 600 px, through <picture>): the year in two stacked bands;
// one hole crosses the top band in 0–6 s, another the bottom band in 6–12 s.
const PW = 360;
const PGX = 30;
const PDX = 11.4;
const PDY = 11;
const PBANDS = [84, 196];
const PSCALE = 0.82;

export default function render(ctx) {
  if (!ctx.data.github) return { files: [] };
  return {
    files: [
      { path: 'assets/galaxy/galaxy.svg', svg: galaxySvg(false, ctx) },
      { path: 'assets/galaxy/galaxy-mobile.svg', svg: galaxySvg(true, ctx) },
    ],
  };
}

function galaxySvg(phone, { tokens, fonts, data }) {
  const gh = data.github;
  const c = tokens.color;
  const r = rng(phone ? 'galaxy-mobile' : 'galaxy');
  const w = phone ? PW : W;
  const h = phone ? 344 : H;
  const p = panel('g', h, r, tokens, phone ? 30 : 36, w);
  const color = (lv) => (lv === 4 ? c.accretion.gold : lv === 3 ? c.accretion.photon : lv ? c.accent.ion : c.accent.titanium);
  const k = phone ? PSCALE : 1;

  const dow0 = new Date(`${gh.calendar[0].date}T00:00:00Z`).getUTCDay();
  const columns = [];
  gh.calendar.forEach((d, i) => {
    const wk = Math.floor((i + dow0) / 7);
    (columns[wk] ??= []).push({ ...d, row: (i + dow0) % 7 });
  });
  // Week → band, x and row-0 y. Desktop has one band; the phone splits the year.
  const half = Math.ceil(columns.length / 2);
  const travel = phone ? (half - 1) * PDX + 6 : TRAVEL;
  const at = (wk) => {
    if (!phone) return { band: 0, x: GX + wk * DX, y0: GY, mid: MID };
    const band = wk < half ? 0 : 1;
    return { band, x: PGX + (wk - band * half) * PDX, y0: PBANDS[band], mid: PBANDS[band] + 3 * PDY };
  };

  let cols = '';
  columns.forEach((days, wk) => {
    const { band, x, y0, mid } = at(wk);
    let stars = '';
    for (const d of days) {
      const sx = x + r.range(-1.5, 1.5) * k;
      const sy = y0 + d.row * (phone ? PDY : DY) + r.range(-1.5, 1.5) * k;
      if (d.level >= 3) stars += el('circle', { cx: sx, cy: sy, r: (d.level === 4 ? 11 : 8) * k, fill: `url(#g-h${d.level})` });
      stars += el('circle', { cx: sx, cy: sy, r: R[d.level] * k, fill: color(d.level), opacity: A[d.level] });
    }
    // The hole reaches this column at tw seconds; a negative delay puts frame 0 mid-loop.
    const tw = phone ? band * 6 + ((x - PGX) / travel) * 6 : ((x - GX) / TRAVEL) * 12;
    cols += el('g', { class: 'col', style: `animation-delay:${n(tw - 24)}s;transform-origin:${n(x)}px ${mid}px` }, stars);
  });

  let months = '';
  gh.calendar.forEach((d, i) => {
    if (!d.date.endsWith('-01')) return;
    const { x, y0 } = at(Math.floor((i + dow0) / 7));
    if (x > w - (phone ? 40 : 60)) return;
    months += el('path', { d: textPath(fonts.mono, MONTHS[Number(d.date.slice(5, 7)) - 1], { x: x - 2, y: phone ? y0 + 6 * PDY + 18 : 182, size: 11, tracking: 0.1 }).d, fill: c.text.mutedOnDark, opacity: 0.85 });
  });

  // Legend: less → more, as on GitHub. Phone: on its own line under the head.
  let legend = '';
  const lx = w - (phone ? 24 : 28);
  const ly = phone ? 62 : 40;
  const more = textPath(fonts.mono, 'MORE', { x: lx, y: ly, size: 9.5, tracking: 0.15, anchor: 'end' });
  let cx = more.x - 12;
  for (let lv = 4; lv >= 0; lv--) {
    legend += el('circle', { cx, cy: ly - 3.5, r: R[lv], fill: color(lv), opacity: A[lv] });
    cx -= 12;
  }
  const less = textPath(fonts.mono, 'LESS', { x: cx + 2, y: ly, size: 9.5, tracking: 0.15, anchor: 'end' });
  legend += el('path', { d: more.d + less.d, fill: c.text.mutedOnDark });

  const defs =
    p.defs +
    el('linearGradient', { id: 'g-disk', x1: 0, x2: 1, y1: 0, y2: 0 }, el('stop', { offset: 0, 'stop-color': c.accretion.plasma, 'stop-opacity': 0.5 }) + el('stop', { offset: 0.5, 'stop-color': c.accretion.gold }) + el('stop', { offset: 1, 'stop-color': c.accretion.photon })) +
    [3, 4].map((lv) => el('radialGradient', { id: `g-h${lv}` }, el('stop', { offset: 0, 'stop-color': color(lv), 'stop-opacity': 0.5 }) + el('stop', { offset: 1, 'stop-color': color(lv), 'stop-opacity': 0 }))).join('');

  const head = textPath(fonts.mono, `CONTRIBUTION GALAXY · ${columns.length} WEEKS`, { x: phone ? 24 : 28, y: 40, size: phone ? 10.5 : 11, tracking: phone ? 0.2 : 0.3 });
  const caption = galaxyCaption(gh);
  // Phone: the second hole runs 6 s behind the first, over the bottom band.
  const holes = phone
    ? PBANDS.map((y0, band) => el('g', { transform: `translate(${PGX} ${y0 + 3 * PDY})` }, el('g', { class: 'hole', style: band ? 'animation-delay:-18s' : undefined }, el('g', { transform: `scale(${PSCALE})` }, hole(c))))).join('')
    : el('g', { transform: `translate(${GX} ${MID})` }, el('g', { class: 'hole' }, hole(c)));
  const captionText = phone
    ? caption.split(' · ').map((line, i) => textPath(fonts.ui, line, { x: w / 2, y: 304 + i * 20, size: 14, anchor: 'middle' }).d).join('')
    : textPath(fonts.ui, caption, { x: W / 2, y: 205, size: 15, anchor: 'middle' }).d;
  const body =
    p.back() +
    p.edge +
    brackets(w, h, c.accent.ion) +
    el('path', { d: head.d, fill: c.accent.ion }) +
    legend +
    cols +
    months +
    holes +
    el('path', { d: captionText, fill: c.text.onDark });

  // Desktop: one 12 s crossing (0–50 %); phone: 6 s per band (0–25 %).
  const end = phone ? [1.5, 25, 26.5, 15] : [3, 50, 53, 30];
  const css =
    TWINKLE_CSS +
    '.col{animation:devour 24s linear infinite}' +
    '@keyframes devour{0%{transform:none;opacity:1}3.3%,14.6%{transform:rotate(140deg) scale(.05);opacity:0}20.8%,100%{transform:none;opacity:1}}' +
    '.hole{opacity:0;animation:hole 24s linear infinite}' +
    `@keyframes hole{0%{transform:translateX(0);opacity:0}${end[0]}%{opacity:1}${end[1]}%{transform:translateX(${n(travel)}px);opacity:1}${end[2]}%,100%{transform:translateX(${n(travel + end[3])}px);opacity:0}}`;
  return svgDoc({ id: 'g', w, h, title: `Contribution galaxy: ${caption}`, css, defs, body });
}
