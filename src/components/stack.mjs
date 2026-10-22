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

// Phone layout (≤ 600 px, through <picture>): one row per skill, title on the
// left and its constellation on the right, so labels stay ~10 px at 375 px.
const PW = 360;
const PTOP = 56;
const ROW = 68;
const LABEL = { desktop: 9.5, phone: 10.5 };

function place(r, k, cx, halfWidths, x0, w) {
  const shape = SHAPES[k] ?? Array.from({ length: k }, (_, i) => [((i - (k - 1) / 2) * (w - 60)) / Math.max(1, k - 1), i % 2 ? 18 : -18]);
  const mid = (TOP + BOTTOM) / 2;
  return shape.map(([dx, dy], i) => {
    const hw = halfWidths[i];
    const x = Math.min(Math.max(cx + dx + r.range(-5, 5), x0 + hw + 6), x0 + w - hw - 6);
    return [x, mid + dy + r.range(-4, 4)];
  });
}

// A row: nodes spread over [x0, x1] at most 84 apart, zigzagging ±7 around `mid`.
function placeRow(r, halfWidths, x0, x1, mid) {
  const k = halfWidths.length;
  const first = x0 + halfWidths[0];
  const span = Math.min(x1 - halfWidths[k - 1] - first, 84 * (k - 1));
  const start = k === 1 ? (x0 + x1) / 2 : first + (x1 - halfWidths[k - 1] - first - span) / 2;
  return halfWidths.map((_, i) => [start + (k === 1 ? 0 : (i * span) / (k - 1)) + r.range(-3, 3), mid + (k === 1 ? 0 : i % 2 ? 7 : -7) + r.range(-2, 2)]);
}

function node(tech, x, y, color, c, fonts, labelSize) {
  const icon = techIcon(tech);
  if (icon) {
    return (
      el('circle', { cx: x, cy: y, r: 22, fill: color, opacity: 0.08 }) +
      el('circle', { cx: x, cy: y, r: 15, fill: c.space.void, stroke: color, 'stroke-width': 1, 'stroke-opacity': 0.7 }) +
      el('path', { d: icon.path, fill: color, 'fill-rule': icon.fillRule, transform: `translate(${n(x - 8)} ${n(y - 8)}) scale(.6667)` }) +
      el('path', { d: textPath(fonts.mono, tech, { x, y: y + 30, size: labelSize, anchor: 'middle' }).d, fill: c.text.mutedOnDark })
    );
  }
  const size = 11;
  const w = measure(fonts.mono, tech, size) + 18;
  return (
    el('rect', { x: x - w / 2, y: y - 11, width: w, height: 22, rx: 11, fill: c.space.void, stroke: color, 'stroke-opacity': 0.7 }) +
    el('path', { d: textPath(fonts.mono, tech, { x, y: y + capHeight(fonts.mono, size) / 2, size, anchor: 'middle' }).d, fill: c.text.onDark })
  );
}

function stackSvg(phone, { profile, tokens, fonts }) {
  const c = tokens.color;
  const r = rng(phone ? 'stack-mobile' : 'stack');
  const w = phone ? PW : W;
  const h = phone ? PTOP + profile.skills.length * ROW + 6 : H;
  const pad = phone ? 24 : 28;
  const labelSize = phone ? LABEL.phone : LABEL.desktop;
  const frame = roundRectPath(0.5, 0.5, w - 1, h - 1, 19.5);
  const halfWidth = (tech) => (techIcon(tech) ? Math.max(22, measure(fonts.mono, tech, labelSize) / 2) : (measure(fonts.mono, tech, 11) + 18) / 2);
  const cellW = (W - 2 * PAD) / profile.skills.length;
  const titleSize = phone ? 11.5 : 11;
  const titleW = Math.max(...profile.skills.map((s) => measure(fonts.displayMedium, caps(s.title), titleSize, 0.14)));

  let lines = '';
  let nodes = '';
  let titles = '';
  let delay = 0.2;
  profile.skills.forEach((s, i) => {
    let pts;
    if (phone) {
      const mid = PTOP + i * ROW + 24;
      titles += el('path', { d: textPath(fonts.displayMedium, caps(s.title), { x: pad, y: mid + capHeight(fonts.displayMedium, titleSize) / 2, size: titleSize, tracking: 0.14 }).d, fill: s.color });
      if (!s.stack.length) return;
      pts = placeRow(r, s.stack.map(halfWidth), pad + titleW + 18, w - pad, mid);
    } else {
      const x0 = PAD + i * cellW;
      const cx = x0 + cellW / 2;
      titles += el('path', { d: textPath(fonts.displayMedium, caps(s.title), { x: cx, y: H - 22, size: 11, tracking: 0.14, anchor: 'middle' }).d, fill: s.color });
      if (!s.stack.length) return;
      pts = place(r, s.stack.length, cx, s.stack.map(halfWidth), x0, cellW);
    }
    for (let k = 1; k < pts.length; k++) {
      const [a, b] = [pts[k - 1], pts[k]];
      lines += el('path', { class: 'draw', style: `animation-delay:${n(delay + k * 0.25)}s`, pathLength: 100, d: `M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}`, stroke: s.color, 'stroke-width': 1, opacity: 0.45 });
    }
    delay += 0.3;
    s.stack.forEach((tech, k) => {
      nodes += node(tech, pts[k][0], pts[k][1], s.color, c, fonts, labelSize);
    });
  });

  const count = profile.skills.reduce((sum, s) => sum + s.stack.length, 0);
  const head = textPath(fonts.mono, 'TECH CONSTELLATION', { x: pad, y: 34, size: 10.5, tracking: phone ? 0.24 : 0.3 });
  const meta = textPath(fonts.mono, `${count} TECHNOLOGIES`, { x: w - pad, y: 34, size: 10.5, tracking: phone ? 0.1 : 0.2, anchor: 'end' });
  const stars = phone ? Math.round((90 * w * h) / (W * H)) : 90;

  const defs =
    el('clipPath', { id: 's-clip' }, el('path', { d: frame })) +
    el('linearGradient', { id: 's-bg', x1: 0, y1: 0, x2: 0, y2: 1 }, el('stop', { offset: 0, 'stop-color': c.space.deep }) + el('stop', { offset: 1, 'stop-color': c.space.void }));
  const body =
    el('g', { 'clip-path': 'url(#s-clip)' }, el('path', { d: frame, fill: 'url(#s-bg)' }) + starfield(r, { w, h, count: stars, color: c.accretion.photon, twinkleShare: tokens.motion.twinkleShare })) +
    el('path', { d: frame, fill: 'none', stroke: c.space.line }) +
    el('path', { d: head.d, fill: c.accent.ion, opacity: 0.85 }) +
    el('path', { d: meta.d, fill: c.text.mutedOnDark }) +
    lines +
    nodes +
    titles;
  // Lines draw in once; their base style is the drawn state, so a still frame is complete.
  const css = TWINKLE_CSS + '.draw{animation:draw 1.6s cubic-bezier(.22,1,.36,1) backwards;stroke-dasharray:100}@keyframes draw{from{stroke-dashoffset:100}}';
  const alt = profile.skills.filter((s) => s.stack.length).map((s) => `${s.title}: ${s.stack.join(', ')}`).join('; ');
  return svgDoc({ id: 's', w, h, title: `Tech constellation — ${alt}`, css, defs, body });
}

export default function render(ctx) {
  if (!ctx.profile.skills.some((s) => s.stack.length)) return { files: [] };
  return {
    files: [
      { path: 'assets/stack/stack.svg', svg: stackSvg(false, ctx) },
      { path: 'assets/stack/stack-mobile.svg', svg: stackSvg(true, ctx) },
    ],
  };
}
