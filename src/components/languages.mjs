// C6 language orbits (SPEC §3): the top 6 languages by bytes across owned,
// non-fork public repos. Each is a planet sized ∝ √share on its own tilted
// orbit around a star (R9 occlusion), coloured from rankRamp; legend in %.
import { rng } from '../lib/rng.mjs';
import { el, n, svgDoc, TWINKLE_CSS } from '../lib/svg.mjs';
import { textPath } from '../lib/text.mjs';
import { brackets, panel } from './telemetry.mjs';

const W = 880;
const H = 220;
const DESK_SUN = { x: 250, y: 128 };
const PERIODS = [8, 12, 24, 24, 24, 24];

export const pct = (share) => `${(share * 100).toFixed(1)}%`;

export function topLanguages(gh, tokens) {
  return gh.languages.slice(0, 6).map((l, i) => ({ ...l, color: tokens.color.rankRamp[i] }));
}

// Phone layout (≤ 600 px, through <picture>): the orbits on top at 0.72×,
// the legend below as full-width rows.
const PW = 360;
const PSUN = { x: 180, y: 140 };
const PLEGEND = { y: 236, step: 26 };

export default function render(ctx) {
  if (!ctx.data.github?.languages.length) return { files: [] };
  return {
    files: [
      { path: 'assets/stats/languages.svg', svg: languagesSvg(false, ctx) },
      { path: 'assets/stats/languages-mobile.svg', svg: languagesSvg(true, ctx) },
    ],
  };
}

function languagesSvg(phone, { tokens, fonts, data }) {
  const gh = data.github;
  const c = tokens.color;
  const r = rng(phone ? 'languages-mobile' : 'languages');
  const langs = topLanguages(gh, tokens);
  const w = phone ? PW : W;
  const h = phone ? PLEGEND.y + (langs.length - 1) * PLEGEND.step + 24 : H;
  const SUN = phone ? PSUN : DESK_SUN;
  const k = phone ? 0.72 : 1;
  const p = panel('l', h, r, tokens, phone ? 44 : 60, w);

  let defs =
    p.defs +
    el('clipPath', { id: 'l-far' }, el('rect', { x: -260, y: -120, width: 520, height: 120 })) +
    el('clipPath', { id: 'l-near' }, el('rect', { x: -260, y: 0, width: 520, height: 120 })) +
    el('radialGradient', { id: 'l-sun' }, el('stop', { offset: 0, 'stop-color': c.accretion.photon }) + el('stop', { offset: 0.3, 'stop-color': c.accretion.photon, 'stop-opacity': 0.85 }) + el('stop', { offset: 0.6, 'stop-color': c.accent.titanium, 'stop-opacity': 0.25 }) + el('stop', { offset: 1, 'stop-color': c.accent.titanium, 'stop-opacity': 0 }));

  let lines = '';
  let far = '';
  let near = '';
  let still = '';
  let legend = '';
  const n0 = langs.length;
  langs.forEach((l, i) => {
    const a = k * (n0 === 1 ? 120 : 88 + (i * (196 - 88)) / (n0 - 1));
    const b = a * 0.3;
    const tilt = i % 2 ? 6 : -8;
    const dur = PERIODS[i];
    const begin = `-${n(dur * ((i * 0.618 + 0.23) % 1))}s`;
    const pr = 3 + (phone ? 11 : 13) * Math.sqrt(l.share);
    const orbit = `M${n(a)} 0A${n(a)} ${n(b)} 0 1 1 ${n(-a)} 0A${n(a)} ${n(b)} 0 1 1 ${n(a)} 0`;
    const frame = (children) => el('g', { transform: `translate(${SUN.x} ${SUN.y}) rotate(${tilt})` }, children);
    defs += el('radialGradient', { id: `l-p${i}`, cx: 0.35, cy: 0.35, r: 0.75 }, el('stop', { offset: 0, 'stop-color': c.accretion.photon, 'stop-opacity': 0.9 }) + el('stop', { offset: 0.35, 'stop-color': l.color }) + el('stop', { offset: 1, 'stop-color': c.space.deep }));
    const planet = el('circle', { r: pr + 4, fill: l.color, opacity: 0.16 }) + el('circle', { r: pr, fill: `url(#l-p${i})` });
    const rider = (half) => el('g', { 'clip-path': `url(#l-${half})` }, el('g', {}, planet + el('animateMotion', { dur: `${dur}s`, begin, repeatCount: 'indefinite', path: orbit })));
    lines += frame(el('path', { d: orbit, fill: 'none', stroke: l.color, 'stroke-width': 0.8, opacity: 0.3 }));
    far += frame(el('g', { class: 'smil' }, rider('far')));
    near += frame(el('g', { class: 'smil' }, rider('near')));
    // Reduced motion: parked on the near half, spread by the golden ratio so
    // the planets never line up on one ray.
    const t = (0.12 + 0.76 * ((i * 0.618) % 1)) * Math.PI;
    still += frame(el('g', { class: 'static', transform: `translate(${n(a * Math.cos(t))} ${n(b * Math.sin(t))})` }, planet));

    // Legend row: dot, name, share bar, percentage.
    const y = phone ? PLEGEND.y + i * PLEGEND.step : 78 + i * (n0 > 4 ? 22 : 28);
    const lx = phone ? 30 : 560;
    const bx = phone ? 168 : lx + 110;
    const bar = phone ? 100 : 150;
    legend += el('circle', { cx: lx, cy: y - 4, r: 5, fill: l.color });
    legend += el('path', { d: textPath(fonts.ui, l.name, { x: lx + 14, y, size: 15 }).d, fill: c.text.onDark });
    legend += el('rect', { x: bx, y: y - 5.5, width: bar, height: 3, rx: 1.5, fill: c.space.line });
    legend += el('rect', { x: bx, y: y - 5.5, width: Math.max(3, bar * l.share), height: 3, rx: 1.5, fill: l.color });
    legend += el('path', { d: textPath(fonts.mono, pct(l.share), { x: w - (phone ? 24 : 40), y, size: 13, anchor: 'end' }).d, fill: c.text.mutedOnDark });
  });

  const sun = el('circle', { class: 'pulse', cx: SUN.x, cy: SUN.y, r: phone ? 24 : 30, fill: 'url(#l-sun)' }) + el('circle', { cx: SUN.x, cy: SUN.y, r: phone ? 6 : 7, fill: c.accretion.photon });
  const head = textPath(fonts.mono, 'LANGUAGE ORBITS', { x: phone ? 24 : 28, y: phone ? 38 : 40, size: 11, tracking: 0.3 });
  const meta = phone
    ? textPath(fonts.mono, `TOP ${n0} BY CODE SIZE · OWN REPOS`, { x: 24, y: 58, size: 10, tracking: 0.08 })
    : textPath(fonts.mono, `TOP ${n0} BY CODE SIZE · OWN REPOS`, { x: W - 28, y: 40, size: 10.5, tracking: 0.15, anchor: 'end' });
  const body =
    p.back(lines + far + sun + near + still) +
    p.edge +
    brackets(w, h, c.accent.ion) +
    el('path', { d: head.d, fill: c.accent.ion }) +
    el('path', { d: meta.d, fill: c.text.mutedOnDark }) +
    legend;
  const css = TWINKLE_CSS + '.pulse{transform-box:fill-box;transform-origin:center;animation:pulse 4s ease-in-out infinite}@keyframes pulse{50%{transform:scale(1.1);opacity:.85}}';
  const title = `Language orbits: ${langs.map((l) => `${l.name} ${pct(l.share)}`).join(', ')}`;
  return svgDoc({ id: 'l', w, h, title, css, defs, body });
}
