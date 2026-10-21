// C12 footer (SPEC §3): a drifting starfield wave on its own dark panel with
// "Built in orbit · <year>". The wave tile repeats every 440 px and drifts one
// tile per 24 s, so the loop is seamless.
import { rng } from '../lib/rng.mjs';
import { el, n, roundRectPath, svgDoc } from '../lib/svg.mjs';
import { textPath } from '../lib/text.mjs';

const W = 880;
const H = 96;
const TILE = 440;

export default function render({ tokens, fonts, data }) {
  const c = tokens.color;
  const r = rng('footer');
  const frame = roundRectPath(0.5, 0.5, W - 1, H - 1, 19.5);

  let stars = '';
  for (let i = 0; i < 70; i++) {
    const x = r.range(0, TILE);
    const band = r.next() < 0.7;
    const wave = 48 + 16 * Math.sin((x / TILE) * Math.PI * 4);
    const y = band ? wave + r.range(-7, 7) : r.range(6, H - 6);
    const color = band && r.chance(0.3) ? c.accretion.gold : c.accretion.photon;
    stars += el('circle', { cx: x, cy: y, r: band ? r.range(0.5, 1.3) : r.range(0.3, 0.7), fill: color, opacity: band ? r.range(0.45, 0.95) : r.range(0.2, 0.5) });
  }
  const strip = [0, 1, 2].map((k) => el('g', { transform: `translate(${k * TILE} 0)` }, stars)).join('');

  const label = `Built in orbit · ${data.year}`;
  const text = textPath(fonts.mono, label.toUpperCase(), { x: W / 2, y: H / 2 + 4, size: 11, tracking: 0.32, anchor: 'middle' });
  const pad = 20;
  const defs =
    el('clipPath', { id: 'u-fclip' }, el('path', { d: frame })) +
    el('linearGradient', { id: 'u-fbg', x1: 0, y1: 0, x2: 0, y2: 1 }, el('stop', { offset: 0, 'stop-color': c.space.deep }) + el('stop', { offset: 1, 'stop-color': c.space.void })) +
    el('linearGradient', { id: 'u-fplate', x1: 0, y1: 0, x2: 1, y2: 0 }, el('stop', { offset: 0, 'stop-color': c.space.void, 'stop-opacity': 0 }) + el('stop', { offset: 0.5, 'stop-color': c.space.void, 'stop-opacity': 0.92 }) + el('stop', { offset: 1, 'stop-color': c.space.void, 'stop-opacity': 0 }));
  const plateW = text.width + 160;
  const body =
    el('g', { 'clip-path': 'url(#u-fclip)' }, el('path', { d: frame, fill: 'url(#u-fbg)' }) + el('g', { class: 'drift' }, strip) + el('rect', { x: (W - plateW) / 2, y: H / 2 - 14, width: plateW, height: 26, fill: 'url(#u-fplate)' })) +
    el('path', { d: frame, fill: 'none', stroke: c.space.line }) +
    el('path', { d: text.d, fill: c.text.onDark, opacity: 0.85 }) +
    el('path', { d: `M${n(W / 2 - text.width / 2 - pad - 14)} ${H / 2}h14M${n(W / 2 + text.width / 2 + pad)} ${H / 2}h14`, stroke: c.accent.ion, opacity: 0.6 });
  const css = `.drift{animation:drift 24s linear infinite}@keyframes drift{to{transform:translateX(-${TILE}px)}}`;
  return { files: [{ path: 'assets/ui/footer.svg', svg: svgDoc({ id: 'u-f', w: W, h: H, title: label, css, defs, body }) }] };
}
