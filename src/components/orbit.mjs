// C2 porthole (SPEC §3): a round window onto a "K" core star with the five
// skill planets on tilted elliptical orbits. Each planet is drawn twice and
// clipped to its far and near half, so it passes behind and in front of the
// core (recipe R9).
import { rng } from '../lib/rng.mjs';
import { el, n, svgDoc, starfield, TWINKLE_CSS } from '../lib/svg.mjs';
import { textPath, capHeight } from '../lib/text.mjs';

const S = 360;
const C = S / 2;
const WINDOW = 164;
const TILTS = [-14, 11, -23, 17, -6];
const PERIODS = [8, 12, 12, 24, 24];

export default function render({ profile, tokens, fonts }) {
  const c = tokens.color;
  const r = rng('orbit');
  const skills = profile.skills;

  let defs =
    el('clipPath', { id: 'o-win' }, el('circle', { cx: C, cy: C, r: WINDOW })) +
    el('radialGradient', { id: 'o-bg' }, el('stop', { offset: 0, 'stop-color': c.space.nebula }) + el('stop', { offset: 0.6, 'stop-color': c.space.deep }) + el('stop', { offset: 1, 'stop-color': c.space.void })) +
    el(
      'radialGradient',
      { id: 'o-core' },
      el('stop', { offset: 0, 'stop-color': c.accretion.photon }) +
        el('stop', { offset: 0.35, 'stop-color': c.accretion.photon, 'stop-opacity': 0.9 }) +
        el('stop', { offset: 0.6, 'stop-color': c.accretion.gold, 'stop-opacity': 0.35 }) +
        el('stop', { offset: 1, 'stop-color': c.accretion.gold, 'stop-opacity': 0 }),
    ) +
    el('linearGradient', { id: 'o-rim', x1: 0, y1: 0, x2: 1, y2: 1 }, el('stop', { offset: 0, 'stop-color': c.accent.titanium, 'stop-opacity': 0.55 }) + el('stop', { offset: 0.5, 'stop-color': c.space.line }) + el('stop', { offset: 1, 'stop-color': c.accent.titanium, 'stop-opacity': 0.3 }));

  // Window: background, stars, then the orbits.
  let inside = el('circle', { cx: C, cy: C, r: WINDOW, fill: 'url(#o-bg)' }) + starfield(r, { w: S, h: S, count: 70, color: c.accretion.photon, twinkleShare: tokens.motion.twinkleShare, avoid: [{ x: C, y: C, r: 26 }] });

  let lines = '';
  let far = '';
  let near = '';
  let still = '';
  // Tiny labels: the first word of each title, centred above its planet so it never leaves the window.
  const label = (s) => s.title.split(/\s+/)[0];
  skills.forEach((s, i) => {
    const a = 54 + i * 22.5;
    const b = a * 0.36;
    const tilt = TILTS[i % TILTS.length];
    const dur = PERIODS[i % PERIODS.length];
    // Golden-ratio phases spread the planets around their orbits at t = 0.
    const begin = `-${n(dur * ((i * 0.618 + 0.11) % 1))}s`;
    const pr = 7.5 - i * 0.3;
    const orbit = `M${n(a)} 0A${n(a)} ${n(b)} 0 1 1 ${n(-a)} 0A${n(a)} ${n(b)} 0 1 1 ${n(a)} 0`;
    const frame = (children) => el('g', { transform: `translate(${C} ${C}) rotate(${tilt})` }, children);

    defs += el('radialGradient', { id: `o-p${i}`, cx: 0.35, cy: 0.35, r: 0.75 }, el('stop', { offset: 0, 'stop-color': '#FFFFFF', 'stop-opacity': 0.9 }) + el('stop', { offset: 0.35, 'stop-color': s.color }) + el('stop', { offset: 1, 'stop-color': c.space.deep }));
    const tp = textPath(fonts.monoBold, label(s), { x: 0, y: -pr - 6, size: 9, tracking: 0.06, anchor: 'middle' });
    const planet =
      el('circle', { r: pr + 5, fill: s.color, opacity: 0.16 }) +
      el('circle', { r: pr, fill: `url(#o-p${i})` }) +
      // Counter-rotate the label so it stays level while the orbit is tilted.
      el('g', { transform: `rotate(${-tilt})` }, el('path', { class: 'lbl', d: tp.d, fill: c.text.onDark, opacity: 0.85 }));
    const rider = (half) => el('g', { 'clip-path': `url(#o-${half})` }, el('g', {}, planet + el('animateMotion', { dur: `${dur}s`, begin, repeatCount: 'indefinite', path: orbit })));

    lines += frame(el('path', { d: orbit, fill: 'none', stroke: s.color, 'stroke-width': 0.8, opacity: 0.3 }));
    far += frame(el('g', { class: 'smil' }, rider('far')));
    near += frame(el('g', { class: 'smil' }, rider('near')));
    // Reduced motion: each planet parked on the near half of its orbit.
    const t = r.range(0.15, 0.85) * Math.PI;
    still += frame(el('g', { class: 'static', transform: `translate(${n(a * Math.cos(t))} ${n(b * Math.sin(t))})` }, planet));
  });
  defs += el('clipPath', { id: 'o-far' }, el('rect', { x: -C, y: -C, width: S, height: C })) + el('clipPath', { id: 'o-near' }, el('rect', { x: -C, y: 0, width: S, height: C }));

  // The "K" core star.
  const k = textPath(fonts.display, 'K', { x: C, y: C + capHeight(fonts.display, 17) / 2, size: 17, anchor: 'middle' });
  const core = el('circle', { class: 'pulse', cx: C, cy: C, r: 44, fill: 'url(#o-core)' }) + el('circle', { cx: C, cy: C, r: 15, fill: c.accretion.photon }) + el('path', { d: k.d, fill: c.space.void });

  inside += lines + far + core + near + still;

  // Rim: a metal ring with bolts.
  let rim = el('circle', { cx: C, cy: C, r: WINDOW + 6, fill: 'none', stroke: 'url(#o-rim)', 'stroke-width': 9 });
  rim += el('circle', { cx: C, cy: C, r: WINDOW + 10.5, fill: 'none', stroke: c.space.line, 'stroke-width': 1 });
  rim += el('circle', { cx: C, cy: C, r: WINDOW + 0.5, fill: 'none', stroke: c.space.line, 'stroke-width': 1 });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + Math.PI / 12;
    rim += el('circle', { cx: C + (WINDOW + 6) * Math.cos(a), cy: C + (WINDOW + 6) * Math.sin(a), r: 1.6, fill: c.accent.titanium, opacity: 0.6 });
  }

  const css =
    TWINKLE_CSS +
    '.pulse{transform-box:fill-box;transform-origin:center;animation:pulse 4s ease-in-out infinite}@keyframes pulse{50%{transform:scale(1.12);opacity:.8}}' +
    // On phones the porthole renders ~105 px wide; its labels would be ~3 px, so they go.
    '@media (max-width:200px){.lbl{display:none}}';
  const names = skills.map((s) => s.title).join(', ');
  const svg = svgDoc({
    id: 'o',
    w: S,
    h: S,
    title: `Porthole: ${skills.length} skill planets orbiting a K star`,
    desc: `Planets: ${names}.`,
    css,
    defs,
    body: el('g', { 'clip-path': 'url(#o-win)' }, inside) + rim,
  });
  return { files: [{ path: 'assets/intro/orbit.svg', svg }] };
}
