// C3 skill cards ×5 (SPEC §3): dark glass frame, comet border (R5), sheen (R6),
// HUD index, an animated emblem per skill, title, summary and stack chips.
// Empty fields drop their element; nothing is padded with placeholders.
import { rng } from '../lib/rng.mjs';
import { el, n, roundRectPath, svgDoc } from '../lib/svg.mjs';
import { textPath, capHeight, measure } from '../lib/text.mjs';
import { EMBLEMS, EMBLEM_CSS } from './emblems.mjs';

const W = 400;
const H = 240;
const R = 20;
const PAD = 24;
const MAX_CHIPS = 4;

function chips(stack, { fonts, color, ink, x, y, maxRight }) {
  const size = 13;
  const h = 24;
  const gap = 8;
  const shown = stack.length > MAX_CHIPS ? stack.slice(0, MAX_CHIPS - 1) : stack;
  const labels = [...shown];
  if (stack.length > shown.length) labels.push(`+${stack.length - shown.length}`);
  let out = '';
  let cx = x;
  for (const label of labels) {
    const w = measure(fonts.mono, label, size) + 20;
    if (cx + w > maxRight) break;
    out += el('rect', { x: cx + 0.5, y: y + 0.5, width: w - 1, height: h - 1, rx: (h - 1) / 2, fill: color, 'fill-opacity': 0.1, stroke: color, 'stroke-opacity': 0.55 });
    out += el('path', { d: textPath(fonts.mono, label, { x: cx + 10, y: y + h / 2 + capHeight(fonts.mono, size) / 2, size }).d, fill: ink });
    cx += w + gap;
  }
  return out;
}

export function card(skill, { fonts, tokens, total }) {
  const c = tokens.color;
  const id = `c${skill.index}`;
  const r = rng(`card-${skill.id}`);
  const frame = roundRectPath(0.5, 0.5, W - 1, H - 1, R - 0.5);

  const defs =
    el('linearGradient', { id: `${id}-bg`, x1: 0, y1: 0, x2: 1, y2: 1 }, el('stop', { offset: 0, 'stop-color': c.space.nebula }) + el('stop', { offset: 0.55, 'stop-color': c.space.deep }) + el('stop', { offset: 1, 'stop-color': c.space.void })) +
    el('radialGradient', { id: `${id}-glow` }, el('stop', { offset: 0, 'stop-color': skill.color, 'stop-opacity': 0.22 }) + el('stop', { offset: 1, 'stop-color': skill.color, 'stop-opacity': 0 })) +
    el('linearGradient', { id: `${id}-sheenG`, x1: 0, x2: 1, y1: 0, y2: 0 }, el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0 }) + el('stop', { offset: 0.5, 'stop-color': '#fff', 'stop-opacity': 0.07 }) + el('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 0 })) +
    el('clipPath', { id: `${id}-clip` }, el('path', { d: frame }));

  const ex = 312;
  const ey = 96;
  const emblem = EMBLEMS[skill.id]?.({ id, cx: ex, cy: ey, color: skill.color, tokens, fonts, r }) ?? { defs: '', body: '' };

  let body = el('path', { d: frame, fill: `url(#${id}-bg)` });
  body += el('g', { 'clip-path': `url(#${id}-clip)` }, el('ellipse', { cx: ex, cy: ey, rx: 130, ry: 110, fill: `url(#${id}-glow)` }) + emblem.body + el('g', { transform: 'skewX(-18)' }, el('rect', { class: 'sheen', x: -220, y: -10, width: 120, height: H + 20, fill: `url(#${id}-sheenG)` })));
  body += el('path', { d: `M${R} 1.5H${W - R}`, stroke: '#fff', 'stroke-opacity': 0.08 });
  body += el('path', { d: frame, fill: 'none', stroke: c.space.line });

  // HUD: index and, when given, the year the skill started.
  const idx = `${String(skill.index).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
  body += el('path', { d: textPath(fonts.mono, idx, { x: PAD, y: 40, size: 12, tracking: 0.16 }).d, fill: c.text.mutedOnDark });
  if (skill.since) body += el('path', { d: textPath(fonts.mono, `SINCE ${skill.since}`, { x: PAD, y: 60, size: 11, tracking: 0.16 }).d, fill: skill.color, opacity: 0.9 });

  const titleY = skill.summary ? 160 : 176;
  body += el('path', { d: textPath(fonts.displayMedium, skill.title, { x: PAD, y: titleY, size: 26, tracking: 0.02 }).d, fill: c.text.onDark });
  if (skill.summary) body += el('path', { d: textPath(fonts.uiRegular, skill.summary, { x: PAD, y: 186, size: 17 }).d, fill: c.text.mutedOnDark });
  if (skill.stack.length) body += chips(skill.stack, { fonts, color: skill.color, ink: c.text.onDark, x: PAD, y: 200, maxRight: W - PAD });

  // Comet: a head plus two fading tails ending at the same point (R5).
  // Each tail's offset is its length minus the head's, so all three end together.
  const tails = [
    { w: 2.6, dash: '1.5 98.5', o: 0, a: 1 },
    { w: 1.8, dash: '6 94', o: 4.5, a: 0.45 },
    { w: 1.2, dash: '14 86', o: 12.5, a: 0.18 },
  ];
  body += tails.map((t, i) => el('path', { class: `comet cm${i}`, pathLength: 100, d: frame, fill: 'none', stroke: skill.color, 'stroke-width': t.w, 'stroke-linecap': 'round', 'stroke-dasharray': t.dash, opacity: t.a })).join('');

  // Comets and sheens are desynced per card: 0, −1.3, −2.6, … s.
  const delay = `${n(-1.3 * (skill.index - 1))}s`;
  const css =
    `.comet{animation:6s linear ${delay} infinite}` +
    tails.map((t, i) => `.cm${i}{stroke-dashoffset:${t.o};animation-name:cm${i}}@keyframes cm${i}{to{stroke-dashoffset:${n(t.o - 100)}}}`).join('') +
    `.sheen{animation:sheen 8s cubic-bezier(.65,0,.35,1) ${delay} infinite}` +
    '@keyframes sheen{0%,72%{transform:translateX(0)}100%{transform:translateX(760px)}}' +
    EMBLEM_CSS;
  const alt = [skill.title, skill.summary, skill.stack.join(', ')].filter(Boolean).join(' — ');
  return svgDoc({ id, w: W, h: H, title: alt, css, defs: defs + emblem.defs, body });
}

export default function render({ profile, tokens, fonts }) {
  const total = profile.skills.length;
  return { files: profile.skills.map((s) => ({ path: `assets/cards/${s.id}.svg`, svg: card(s, { fonts, tokens, total }) })) };
}
