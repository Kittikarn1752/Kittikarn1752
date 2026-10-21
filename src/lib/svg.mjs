// SVG string helpers shared by every component: rounding, elements, the base
// document (recipe R1) and the reduced-motion contract.

// At most 2 decimals, no trailing zeros, never "-0".
export function n(v) {
  const r = Math.round(v * 100) / 100;
  return Object.is(r, -0) ? '0' : String(r);
}

export function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function attrs(a = {}) {
  let out = '';
  for (const [k, v] of Object.entries(a)) {
    if (v === undefined || v === null || v === false || v === '') continue;
    out += ` ${k}="${typeof v === 'number' ? n(v) : esc(v)}"`;
  }
  return out;
}

export function el(name, a, children) {
  return children === undefined || children === null ? `<${name}${attrs(a)}/>` : `<${name}${attrs(a)}>${children}</${name}>`;
}

// Polar to cartesian, rounded.
export const px = (cx, r, a) => n(cx + r * Math.cos(a));
export const py = (cy, r, a) => n(cy + r * Math.sin(a));

export const REDUCED_MOTION =
  '.static{display:none}@media (prefers-reduced-motion:reduce){*{animation:none!important}.smil{display:none}.static{display:inline}}';

/**
 * The base document. `css` is joined with the reduced-motion rules, so every
 * file carries them. `style` lands on the root element (per-file CSS variables).
 */
export function svgDoc({ id, w, h, title, desc, css = '', defs = '', body, style }) {
  const labelled = desc ? `${id}-t ${id}-d` : `${id}-t`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="${labelled}"${attrs({ style })}>` +
    `<title id="${id}-t">${esc(title)}</title>` +
    (desc ? `<desc id="${id}-d">${esc(desc)}</desc>` : '') +
    `<style>${css}${REDUCED_MOTION}</style>` +
    (defs ? `<defs>${defs}</defs>` : '') +
    body +
    `</svg>`
  );
}

// Rounded rectangle as one closed path starting at the top-left straight edge,
// so dash animations (recipe R5) run clockwise around the frame.
export function roundRectPath(x, y, w, h, r) {
  return (
    `M${n(x + r)} ${n(y)}H${n(x + w - r)}A${n(r)} ${n(r)} 0 0 1 ${n(x + w)} ${n(y + r)}` +
    `V${n(y + h - r)}A${n(r)} ${n(r)} 0 0 1 ${n(x + w - r)} ${n(y + h)}` +
    `H${n(x + r)}A${n(r)} ${n(r)} 0 0 1 ${n(x)} ${n(y + h - r)}` +
    `V${n(y + r)}A${n(r)} ${n(r)} 0 0 1 ${n(x + r)} ${n(y)}Z`
  );
}

// Annulus (ring) as an even-odd path; the inner circle may be offset.
export function ringPath(cx, cy, rOuter, rInner, innerDy = 0) {
  const circle = (x, y, r) => `M${n(x - r)} ${n(y)}a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0Z`;
  return circle(cx, cy, rOuter) + circle(cx, cy + innerDy, rInner);
}

/**
 * Seeded starfield in three depths (recipe R12). Stars inside `avoid`
 * circles are skipped. A share of them twinkle with periods that divide 24 s.
 */
export function starfield(r, { w, h, count, color, twinkleShare = 0.08, periods = [2.4, 3, 4], avoid = [] }) {
  const depths = [
    { r: [0.35, 0.6], a: 0.45, share: 0.62 },
    { r: [0.6, 0.95], a: 0.7, share: 0.28 },
    { r: [0.95, 1.4], a: 0.95, share: 0.1 },
  ];
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = r.range(2, w - 2);
    const y = r.range(2, h - 2);
    const roll = r.next();
    const d = roll < depths[0].share ? depths[0] : roll < depths[0].share + depths[1].share ? depths[1] : depths[2];
    const rad = r.range(d.r[0], d.r[1]);
    const alpha = d.a * r.range(0.55, 1);
    const twinkle = r.chance(twinkleShare);
    const period = r.pick(periods);
    const delay = -r.range(0, period);
    if (avoid.some((c) => (x - c.x) ** 2 + (y - c.y) ** 2 < c.r ** 2)) continue;
    out += el('circle', {
      cx: x,
      cy: y,
      r: rad,
      fill: color,
      opacity: alpha,
      class: twinkle ? 'tw' : undefined,
      style: twinkle ? `--p:${period}s;animation-delay:${n(delay)}s` : undefined,
    });
  }
  return out;
}

export const TWINKLE_CSS = '.tw{animation:tw var(--p,3s) ease-in-out infinite}@keyframes tw{50%{opacity:.2}}';
