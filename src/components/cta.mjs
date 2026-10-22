// C11 site CTA (SPEC §2, §3): "ENTER THE EVENT HORIZON →", a wide panel that
// links to the companion site, closing the Interact section. The hero's hole
// sits on the left like a portal, a comet runs around the frame (recipe R5)
// and the arrow leans toward the click. Narrow screens get a 360 px file
// through <picture>, so the type stays legible at phone width.
// Rendered only once the site is live (SITE_LIVE in src/lib/profile.mjs).
import { rng } from '../lib/rng.mjs';
import { el, n, roundRectPath, svgDoc, TWINKLE_CSS } from '../lib/svg.mjs';
import { measure, textPath } from '../lib/text.mjs';
import { blackHole } from './hero.mjs';
import { look } from './game.mjs';
import { panel } from './telemetry.mjs';

export const COPY = {
  head: 'ENTER THE EVENT HORIZON',
  arrow: '→',
  alt: 'Enter the Event Horizon: the interactive WebGL companion site',
};

const LAYOUTS = {
  desktop: {
    file: 'assets/ui/cta.svg', w: 880, h: 128, hole: [124, 64], rsh: 17, stars: 56,
    lines: [{ text: COPY.head, x: 240, y: 66, size: 30 }], sub: { x: 242, y: 96, size: 12 },
  },
  mobile: {
    file: 'assets/ui/cta-mobile.svg', w: 360, h: 140, hole: [304, 70], rsh: 10.5, stars: 26,
    lines: [
      { text: 'ENTER THE', x: 22, y: 50, size: 19 },
      { text: 'EVENT HORIZON', x: 22, y: 78, size: 19 },
    ],
    sub: { x: 23, y: 108, size: 10 },
  },
};

// Head plus two fading tails, each ending where the head ends (R5).
function comet(frame, color) {
  const tails = [
    { width: 3, dash: '1.5 98.5', o: 0, opacity: 1 },
    { width: 2, dash: '6 94', o: 4.5, opacity: 0.45 },
    { width: 1.5, dash: '14 86', o: 12.5, opacity: 0.18 },
  ];
  return el(
    'g',
    { fill: 'none', stroke: color, 'stroke-linecap': 'round' },
    tails.map((t) => el('path', { class: 'comet', pathLength: 100, d: frame, 'stroke-width': t.width, 'stroke-dasharray': t.dash, opacity: t.opacity, style: t.o ? `--o:${t.o}` : undefined })).join(''),
  );
}

function ctaPanel({ tokens, fonts, host, layout }) {
  const L = LAYOUTS[layout];
  const c = tokens.color;
  const r = rng(`cta-${layout}`);
  const [cx, cy] = L.hole;
  const bh = blackHole(r, look(cx, cy, L.rsh, 1), { ...c.space, ...c.accretion }, { id: 'c', w: L.w, h: L.h });
  const H = bh.layers;
  const p = panel('c', L.h, r, tokens, L.stars, L.w);
  const frame = roundRectPath(0.5, 0.5, L.w - 1, L.h - 1, 19.5);

  let text = '';
  let right = 0;
  for (const line of L.lines) {
    const t = textPath(fonts.display, line.text, { x: line.x, y: line.y, size: line.size, tracking: 0.04 });
    text += el('path', { d: t.d, fill: c.text.onDark });
    right = line.x + t.width;
  }
  const last = L.lines.at(-1);
  const arrow = textPath(fonts.display, COPY.arrow, { x: right + last.size * 0.5, y: last.y, size: last.size });
  const sub = textPath(fonts.mono, host.toUpperCase(), { ...L.sub, tracking: 0.2 });
  const holeLeft = cx - L.rsh * look(cx, cy, L.rsh, 1).disk.outer;
  const limit = layout === 'desktop' ? L.w - 40 : holeLeft - 6;
  if (right + last.size * 0.5 + arrow.width > limit) throw new Error(`${L.file}: CTA text runs into the ${layout === 'desktop' ? 'edge' : 'hole'}`);
  if (L.sub.x + measure(fonts.mono, host.toUpperCase(), L.sub.size, 0.2) > limit) throw new Error(`${L.file}: host line is too long`);

  const scene = H.streaks + H.bloom + H.diskBack + H.halo + H.particles + H.photon + H.shadow + H.diskFront + (H.flare ?? '');
  const body =
    p.back(scene) +
    p.edge +
    comet(frame, c.accent.ion) +
    text +
    el('g', { class: 'nudge' }, el('path', { d: arrow.d, fill: c.accent.ion })) +
    el('path', { d: sub.d, fill: c.text.mutedOnDark });
  const css =
    '.spin{transform-box:fill-box;transform-origin:center;animation:spin var(--p,24s) linear infinite}@keyframes spin{to{transform:rotate(1turn)}}' +
    '.comet{stroke-dashoffset:var(--o,0);animation:comet 8s linear infinite}@keyframes comet{to{stroke-dashoffset:calc(var(--o,0) - 100)}}' +
    `.nudge{animation:nudge 3s ${tokens.motion.easeInOut} infinite}@keyframes nudge{50%{transform:translateX(${n(last.size * 0.25)}px)}}` +
    TWINKLE_CSS;
  return svgDoc({ id: 'c', w: L.w, h: L.h, title: COPY.alt, css, defs: p.defs + bh.defs, body });
}

export default function render({ profile, tokens, fonts }) {
  if (!profile.site.live) return { files: [] };
  const host = new URL(profile.site.url).host;
  return { files: Object.keys(LAYOUTS).map((layout) => ({ path: LAYOUTS[layout].file, svg: ctaPanel({ tokens, fonts, host, layout }) })) };
}
