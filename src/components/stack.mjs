// C4 tech constellation (SPEC §3): every skills[].stack entry as a star in one
// of five constellations, tinted with its skill colour. Known technologies get
// a simple-icons glyph; unknown ones become text chips. Lines draw in once.
// No file at all when every stack is empty.
import { rng } from '../lib/rng.mjs';
import { techIcon } from '../lib/icons.mjs';
import { el, n, roundRectPath, svgDoc, starfield, TWINKLE_CSS } from '../lib/svg.mjs';
import { textPath, capHeight, measure, caps } from '../lib/text.mjs';

const W = 880;
const H = 208;
const PAD = 20;
const TOP = 72;
const BOTTOM = 132;

// Constellation shapes by node count (offsets from the cell centre), with a
// little seeded jitter. More than four nodes fall back to a zigzag.
const SHAPES = {
  1: [[0, 0]],
  2: [[-38, -14], [38, 14]],
  3: [[-46, 6], [0, -24], [46, 14]],
  4: [[-54, 10], [-18, -24], [18, 18], [54, -14]],
};

function place(r, k, cx, halfWidths, x0, w) {
  const shape = SHAPES[k] ?? Array.from({ length: k }, (_, i) => [((i - (k - 1) / 2) * (w - 60)) / Math.max(1, k - 1), i % 2 ? 18 : -18]);
  const mid = (TOP + BOTTOM) / 2;
  return shape.map(([dx, dy], i) => {
    const hw = halfWidths[i];
    const x = Math.min(Math.max(cx + dx + r.range(-5, 5), x0 + hw + 6), x0 + w - hw - 6);
    return [x, mid + dy + r.range(-4, 4)];
  });
}

export default function render({ profile, tokens, fonts }) {
  const groups = profile.skills.filter((s) => s.stack.length);
  if (!groups.length) return { files: [] };
  const c = tokens.color;
  const r = rng('stack');
  const cellW = (W - 2 * PAD) / profile.skills.length;
  const frame = roundRectPath(0.5, 0.5, W - 1, H - 1, 19.5);

  let lines = '';
  let nodes = '';
  let titles = '';
  let delay = 0.2;
  profile.skills.forEach((s, i) => {
    const x0 = PAD + i * cellW;
    const cx = x0 + cellW / 2;
    titles += el('path', { d: textPath(fonts.displayMedium, caps(s.title), { x: cx, y: H - 22, size: 11, tracking: 0.14, anchor: 'middle' }).d, fill: s.color });
    if (!s.stack.length) return;
    const halfWidths = s.stack.map((tech) => (techIcon(tech) ? Math.max(22, measure(fonts.mono, tech, 9.5) / 2) : (measure(fonts.mono, tech, 11) + 18) / 2));
    const pts = place(r, s.stack.length, cx, halfWidths, x0, cellW);
    for (let k = 1; k < pts.length; k++) {
      const [a, b] = [pts[k - 1], pts[k]];
      lines += el('path', { class: 'draw', style: `animation-delay:${n(delay + k * 0.25)}s`, pathLength: 100, d: `M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}`, stroke: s.color, 'stroke-width': 1, opacity: 0.45 });
    }
    delay += 0.3;
    s.stack.forEach((tech, k) => {
      const [x, y] = pts[k];
      const icon = techIcon(tech);
      if (icon) {
        nodes += el('circle', { cx: x, cy: y, r: 22, fill: s.color, opacity: 0.08 });
        nodes += el('circle', { cx: x, cy: y, r: 15, fill: c.space.void, stroke: s.color, 'stroke-width': 1, 'stroke-opacity': 0.7 });
        nodes += el('path', { d: icon.path, fill: s.color, transform: `translate(${n(x - 8)} ${n(y - 8)}) scale(.6667)` });
        nodes += el('path', { d: textPath(fonts.mono, tech, { x, y: y + 30, size: 9.5, anchor: 'middle' }).d, fill: c.text.mutedOnDark });
      } else {
        const size = 11;
        const w = measure(fonts.mono, tech, size) + 18;
        nodes += el('rect', { x: x - w / 2, y: y - 11, width: w, height: 22, rx: 11, fill: c.space.void, stroke: s.color, 'stroke-opacity': 0.7 });
        nodes += el('path', { d: textPath(fonts.mono, tech, { x, y: y + capHeight(fonts.mono, size) / 2, size, anchor: 'middle' }).d, fill: c.text.onDark });
      }
    });
  });

  const count = profile.skills.reduce((sum, s) => sum + s.stack.length, 0);
  const head = textPath(fonts.mono, 'TECH CONSTELLATION', { x: 28, y: 34, size: 10.5, tracking: 0.3 });
  const meta = textPath(fonts.mono, `${count} TECHNOLOGIES`, { x: W - 28, y: 34, size: 10.5, tracking: 0.2, anchor: 'end' });

  const defs =
    el('clipPath', { id: 's-clip' }, el('path', { d: frame })) +
    el('linearGradient', { id: 's-bg', x1: 0, y1: 0, x2: 0, y2: 1 }, el('stop', { offset: 0, 'stop-color': c.space.deep }) + el('stop', { offset: 1, 'stop-color': c.space.void }));
  const body =
    el('g', { 'clip-path': 'url(#s-clip)' }, el('path', { d: frame, fill: 'url(#s-bg)' }) + starfield(r, { w: W, h: H, count: 90, color: c.accretion.photon, twinkleShare: tokens.motion.twinkleShare })) +
    el('path', { d: frame, fill: 'none', stroke: c.space.line }) +
    el('path', { d: head.d, fill: c.accent.ion, opacity: 0.85 }) +
    el('path', { d: meta.d, fill: c.text.mutedOnDark }) +
    lines +
    nodes +
    titles;
  // Lines draw in once; their base style is the drawn state, so a still frame is complete.
  const css = TWINKLE_CSS + '.draw{animation:draw 1.6s cubic-bezier(.22,1,.36,1) backwards;stroke-dasharray:100}@keyframes draw{from{stroke-dashoffset:100}}';
  const alt = groups.map((s) => `${s.title}: ${s.stack.join(', ')}`).join('; ');
  return { files: [{ path: 'assets/stack/stack.svg', svg: svgDoc({ id: 's', w: W, h: H, title: `Tech constellation — ${alt}`, css, defs, body }) }] };
}
