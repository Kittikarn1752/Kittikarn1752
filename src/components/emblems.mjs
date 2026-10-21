// Animated emblems for the C3 skill cards. Each returns { defs, body } centred
// on (cx, cy) in the card's coordinates, drawn in the skill colour.
import { el, n } from '../lib/svg.mjs';
import { textPath, capHeight } from '../lib/text.mjs';

export const EMBLEM_CSS =
  '.mer{transform-box:fill-box;transform-origin:center;animation:mer 12s ease-in-out infinite alternate}' +
  '@keyframes mer{from{transform:scaleX(1)}to{transform:scaleX(-1)}}' +
  '.belt{animation:belt 6s linear infinite}@keyframes belt{to{transform:translateX(-108px)}}' +
  '.weave{animation:weave 4s ease-in-out infinite alternate}@keyframes weave{from{transform:translateY(-14px)}to{transform:translateY(14px)}}' +
  '.flame{animation:flame .5s steps(1) infinite}@keyframes flame{50%{opacity:.35}}' +
  '.sway{transform-box:fill-box;transform-origin:center;animation:sway 6s ease-in-out infinite alternate}@keyframes sway{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}' +
  '.tile{animation:tile 3s ease-in-out infinite}@keyframes tile{50%{opacity:.3}}' +
  '.sig{animation:sig 3s ease-out infinite}@keyframes sig{0%{opacity:0}30%{opacity:1}100%{opacity:0}}' +
  '.spark{animation:spark 1.5s linear infinite}@keyframes spark{to{stroke-dashoffset:-23}}' +
  '.qpulse{transform-box:fill-box;transform-origin:center;animation:qpulse 4s ease-in-out infinite}@keyframes qpulse{50%{transform:scale(1.3);opacity:.15}}' +
  '.fire{opacity:.45;animation:fire 4s ease-out infinite}@keyframes fire{0%,100%{opacity:.45}8%{opacity:1}}' +
  '.glint{animation:glint 8s cubic-bezier(.65,0,.35,1) infinite}@keyframes glint{0%,75%{transform:translateX(0)}100%{transform:translateX(110px)}}';

// web: wireframe globe with an orbiting </> (R9 occlusion for the orbit).
function web({ id, cx, cy, color, fonts }) {
  const R = 44;
  let globe = el('circle', { cx, cy, r: R, fill: color, 'fill-opacity': 0.06, stroke: color, 'stroke-width': 1.4 });
  for (const lat of [-0.5, 0, 0.5]) {
    const rx = R * Math.cos(Math.asin(lat));
    globe += el('ellipse', { cx, cy: cy + R * lat, rx, ry: rx * 0.16, fill: 'none', stroke: color, 'stroke-width': 0.9, opacity: lat ? 0.5 : 0.75 });
  }
  // Meridians: scaleX between 1 and −1 with ease-in-out reads as a turning sphere.
  for (const k of [0, 1, 2]) {
    globe += el('ellipse', { class: 'mer', style: `animation-delay:${-8 * k}s`, cx, cy, rx: R, ry: R, fill: 'none', stroke: color, 'stroke-width': 0.9, opacity: 0.6 });
  }
  globe += el('line', { x1: cx, y1: cy - R, x2: cx, y2: cy + R, stroke: color, 'stroke-width': 0.9, opacity: 0.6 });

  const size = 15;
  const glyph = textPath(fonts.monoBold, '</>', { x: 0, y: capHeight(fonts.monoBold, size) / 2, size, anchor: 'middle' });
  const orbit = `M${n(R * 1.55)} 0A${n(R * 1.55)} ${n(R * 0.42)} 0 1 1 ${n(-R * 1.55)} 0A${n(R * 1.55)} ${n(R * 0.42)} 0 1 1 ${n(R * 1.55)} 0`;
  const rider = (clip) =>
    el(
      'g',
      { class: 'smil', 'clip-path': `url(#${id}-${clip})` },
      el('g', {}, el('rect', { x: -15, y: -10, width: 30, height: 20, rx: 6, fill: '#05060A', stroke: color, 'stroke-width': 1 }) + el('path', { d: glyph.d, fill: color }) + el('animateMotion', { dur: '12s', begin: '-3s', repeatCount: 'indefinite', path: orbit })),
    );
  const defs = el('clipPath', { id: `${id}-far` }, el('rect', { x: -120, y: -80, width: 240, height: 80 })) + el('clipPath', { id: `${id}-near` }, el('rect', { x: -120, y: 0, width: 240, height: 80 }));
  const ring = el('path', { d: orbit, fill: 'none', stroke: color, 'stroke-width': 1, opacity: 0.35, 'stroke-dasharray': '3 4' });
  const still = el('g', { class: 'static', transform: `translate(${n(R * 1.2)} ${n(R * 0.27)})` }, el('rect', { x: -15, y: -10, width: 30, height: 20, rx: 6, fill: '#05060A', stroke: color, 'stroke-width': 1 }) + el('path', { d: glyph.d, fill: color }));
  const body = el('g', { transform: `translate(${n(cx)} ${n(cy)}) rotate(-16)` }, ring + rider('far')) + globe + el('g', { transform: `translate(${n(cx)} ${n(cy)}) rotate(-16)` }, rider('near') + still);
  return { defs, body };
}

// Pixel art as one path: each row's runs of set cells become one rectangle.
function pixels(rows, ch, x0, y0, p) {
  let d = '';
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== ch) continue;
      let end = x;
      while (row[end + 1] === ch) end++;
      d += `M${n(x0 + x * p)} ${n(y0 + y * p)}h${n((end - x + 1) * p)}v${n(p)}h${n(-(end - x + 1) * p)}Z`;
      x = end;
    }
  });
  return d;
}

const SHIP = ['...H.......', '..HHH......', '..HHHH.....', '.HHHHHHHH..', 'HHHCCHHHHHH', '.HHHHHHHH..', '..HHHH.....', '..HHH......', '...H.......'];

// game: a pixel starship weaving through a scrolling asteroid belt.
function game({ id, cx, cy, color, tokens, r }) {
  const c = tokens.color;
  const R = 54;
  const T = 108; // belt tile width; the belt scrolls exactly one tile per loop
  let rocks = '';
  for (let k = 0; k < 7; k++) {
    const x = r.range(4, T - 4);
    const y = cy + r.range(-34, 34);
    const size = r.range(2.5, 6.5);
    const sides = r.int(5, 7);
    let d = '';
    for (let s = 0; s < sides; s++) {
      const a = (s / sides) * Math.PI * 2;
      const rr = size * r.range(0.7, 1.15);
      d += `${s ? 'L' : 'M'}${n(x + rr * Math.cos(a))} ${n(y + rr * Math.sin(a))}`;
    }
    rocks += el('path', { d: `${d}Z`, fill: c.space.line, stroke: color, 'stroke-width': 0.8, 'stroke-opacity': 0.6 });
    rocks += el('circle', { cx: r.range(0, T), cy: cy + r.range(-40, 40), r: 0.7, fill: color, opacity: 0.5 });
  }
  const belt = el('g', { class: 'belt' }, el('g', { transform: `translate(${cx - R} 0)` }, rocks) + el('g', { transform: `translate(${cx - R + T} 0)` }, rocks));

  const p = 3.2;
  const sx = cx - 22;
  const sy = cy - (SHIP.length * p) / 2;
  const ship =
    el('path', { d: pixels(SHIP, 'H', sx, sy, p), fill: color }) +
    el('path', { d: pixels(SHIP, 'C', sx, sy, p), fill: c.accretion.photon }) +
    el('path', { class: 'flame', d: `M${n(sx - 2 * p)} ${n(sy + 4 * p)}h${n(2 * p)}v${n(p)}h${n(-2 * p)}Z M${n(sx - 3.5 * p)} ${n(sy + 4.25 * p)}h${n(p)}v${n(p / 2)}h${n(-p)}Z`, fill: c.accretion.gold });

  const ticks = [0, 1, 2, 3].map((q) => {
    const a = (q * Math.PI) / 2;
    return `M${n(cx + (R - 6) * Math.cos(a))} ${n(cy + (R - 6) * Math.sin(a))}L${n(cx + R * Math.cos(a))} ${n(cy + R * Math.sin(a))}`;
  });
  const defs = el('clipPath', { id: `${id}-gw` }, el('circle', { cx, cy, r: R - 1 }));
  const body =
    el('circle', { cx, cy, r: R, fill: color, 'fill-opacity': 0.05, stroke: color, 'stroke-width': 1.2, 'stroke-opacity': 0.5 }) +
    el('path', { d: ticks.join(''), stroke: color, 'stroke-width': 1, opacity: 0.6 }) +
    el('g', { 'clip-path': `url(#${id}-gw)` }, belt + el('g', { class: 'weave' }, ship));
  return { defs, body };
}

// app: a satellite assembled from app tiles, gently swaying, with a signal.
function app({ cx, cy, color, tokens }) {
  const c = tokens.color;
  const t = 15;
  const gap = 4;
  let tiles = '';
  [0.95, 0.6, 0.75, 0.45].forEach((a, k) => {
    const x = cx - t - gap / 2 + (k % 2) * (t + gap);
    const y = cy - t - gap / 2 + Math.floor(k / 2) * (t + gap);
    tiles += el('rect', { class: 'tile', style: `animation-delay:${n(-0.75 * k)}s`, x, y, width: t, height: t, rx: 4, fill: color, opacity: a });
  });
  const wing = (dir) => {
    const x0 = dir < 0 ? cx - t - gap / 2 - 10 - 40 : cx + t + gap / 2 + 10;
    const y0 = cy - 8;
    let w = el('rect', { x: x0, y: y0, width: 40, height: 16, rx: 3, fill: color, 'fill-opacity': 0.14, stroke: color, 'stroke-width': 1 });
    w += el('path', { d: `M${n(x0 + 13.3)} ${y0}v16M${n(x0 + 26.7)} ${y0}v16`, stroke: color, 'stroke-width': 0.8, opacity: 0.7 });
    return w;
  };
  const struts = `M${n(cx - t - gap / 2 - 10)} ${cy}H${n(cx - t - gap / 2)}M${n(cx + t + gap / 2)} ${cy}H${n(cx + t + gap / 2 + 10)}`;
  const top = cy - t - gap / 2;
  const antenna = el('path', { d: `M${cx} ${n(top)}V${n(top - 12)}M${n(cx - 7)} ${n(top - 15)}A9 9 0 0 0 ${n(cx + 7)} ${n(top - 15)}`, fill: 'none', stroke: color, 'stroke-width': 1.3 }) + el('circle', { cx, cy: top - 13, r: 1.8, fill: c.accretion.photon });
  const signal = [0, 1].map((k) => el('path', { class: 'sig', style: `animation-delay:${-1.5 * k}s`, d: `M${n(cx - 9 - k * 6)} ${n(top - 21 - k * 6)}A${12 + k * 8} ${12 + k * 8} 0 0 1 ${n(cx + 9 + k * 6)} ${n(top - 21 - k * 6)}`, fill: 'none', stroke: color, 'stroke-width': 1.2, 'stroke-linecap': 'round' })).join('');
  const ring = el('ellipse', { cx, cy, rx: 60, ry: 17, fill: 'none', stroke: color, 'stroke-width': 0.8, 'stroke-dasharray': '2 4', opacity: 0.35, transform: `rotate(-12 ${cx} ${cy})` });
  const body = ring + el('g', { class: 'sway' }, el('path', { d: struts, stroke: color, 'stroke-width': 1.2 }) + wing(-1) + wing(1) + antenna + signal + tiles);
  return { defs: '', body };
}

// ai: a neural quasar with a pulsing core and synapse sparks along its jets.
function ai({ id, cx, cy, color, tokens, r }) {
  const c = tokens.color;
  const defs =
    el('linearGradient', { id: `${id}-jet`, x1: 0, y1: 0, x2: 0, y2: 1 }, el('stop', { offset: 0, 'stop-color': color, 'stop-opacity': 0 }) + el('stop', { offset: 1, 'stop-color': color, 'stop-opacity': 0.75 })) +
    el('clipPath', { id: `${id}-qb` }, el('rect', { x: -80, y: -80, width: 160, height: 80 })) +
    el('clipPath', { id: `${id}-qf` }, el('rect', { x: -80, y: 0, width: 160, height: 80 }));
  // The lower jet is the upper one mirrored, so its gradient also fades away from the core.
  const jet = (s) => el('path', { d: 'M-5 -10L-1.2 -58H1.2L5 -10Z', fill: `url(#${id}-jet)`, transform: s < 0 ? 'scale(1 -1)' : undefined });
  const spark = (s) => el('path', { class: 'spark', d: `M0 ${-12 * s}V${-58 * s}`, stroke: c.accretion.photon, 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-dasharray': '3 20' });

  let net = '';
  let nodes = '';
  const pts = [];
  for (let k = 0; k < 7; k++) {
    // Keep nodes away from the jet axis.
    const a = (k / 7) * Math.PI * 2 + r.range(-0.2, 0.2);
    const side = Math.cos(a) >= 0 ? 1 : -1;
    const ang = Math.abs(Math.sin(a)) > 0.8 ? a + side * 0.5 : a;
    const rr = r.range(34, 50);
    pts.push([rr * Math.cos(ang), rr * Math.sin(ang)]);
  }
  pts.forEach(([x, y], k) => {
    const [nx, ny] = pts[(k + 1) % pts.length];
    net += `M0 0L${n(x)} ${n(y)}M${n(x)} ${n(y)}L${n(nx)} ${n(ny)}`;
    nodes += el('circle', { class: 'fire', style: `animation-delay:${n(-(k * 4) / 7)}s`, cx: x, cy: y, r: 2.4, fill: color });
  });
  const ringHalf = (clip) => el('g', { 'clip-path': `url(#${id}-${clip})` }, el('ellipse', { rx: 30, ry: 7.5, fill: 'none', stroke: color, 'stroke-width': 1.6 }) + el('ellipse', { rx: 20, ry: 4.5, fill: 'none', stroke: c.accretion.photon, 'stroke-width': 1, opacity: 0.7 }));
  const core = el('circle', { class: 'qpulse', r: 18, fill: color, opacity: 0.3 }) + el('circle', { r: 8, fill: c.accretion.photon });
  const body = el(
    'g',
    { transform: `translate(${cx} ${cy}) rotate(-20)` },
    el('path', { d: net, stroke: color, 'stroke-width': 0.7, opacity: 0.35 }) + nodes + jet(1) + jet(-1) + spark(1) + spark(-1) + ringHalf('qb') + core + ringHalf('qf'),
  );
  return { defs, body };
}

// ios: a titanium device silhouette (no logo) circled by a comet swoosh.
function ios({ id, cx, cy, color, tokens }) {
  const c = tokens.color;
  const defs =
    el('linearGradient', { id: `${id}-ti`, x1: 0, y1: 0, x2: 1, y2: 1 }, el('stop', { offset: 0, 'stop-color': color }) + el('stop', { offset: 0.5, 'stop-color': c.space.line }) + el('stop', { offset: 1, 'stop-color': color, 'stop-opacity': 0.6 })) +
    el('linearGradient', { id: `${id}-scr`, x1: 0, y1: 0, x2: 0, y2: 1 }, el('stop', { offset: 0, 'stop-color': c.space.nebula }) + el('stop', { offset: 1, 'stop-color': c.space.void })) +
    el('clipPath', { id: `${id}-sb` }, el('rect', { x: -90, y: -60, width: 180, height: 60 })) +
    el('clipPath', { id: `${id}-sf` }, el('rect', { x: -90, y: 0, width: 180, height: 60 })) +
    el('clipPath', { id: `${id}-glass` }, el('rect', { x: -20, y: -43, width: 40, height: 86, rx: 9.5 }));
  const device =
    el('rect', { x: -23, y: -46, width: 46, height: 92, rx: 12, fill: `url(#${id}-ti)` }) +
    el('rect', { x: -20, y: -43, width: 40, height: 86, rx: 9.5, fill: `url(#${id}-scr)` }) +
    el('rect', { x: -7, y: -39, width: 14, height: 4.5, rx: 2.25, fill: '#000' }) +
    el('path', { d: 'M-24.5 -26h1.5v10h-1.5ZM23 -20h1.5v16H23Z', fill: color, opacity: 0.8 }) +
    el('g', { 'clip-path': `url(#${id}-glass)` }, el('g', { transform: 'skewX(-20)' }, el('rect', { class: 'glint', x: -60, y: -50, width: 14, height: 100, fill: '#fff', opacity: 0.08 })));
  const swoosh = 'M62 0A62 17 0 1 1 -62 0A62 17 0 1 1 62 0';
  const tails = [
    { w: 2.4, dash: '1.5 98.5', a: 1 },
    { w: 1.6, dash: '6 94', a: 0.5 },
    { w: 1.1, dash: '16 84', a: 0.2 },
  ];
  const comet = tails.map((t, i) => el('path', { class: `comet cm${i}`, style: 'animation-delay:-2.2s', pathLength: 100, d: swoosh, fill: 'none', stroke: c.accretion.photon, 'stroke-width': t.w, 'stroke-linecap': 'round', 'stroke-dasharray': t.dash, opacity: t.a })).join('');
  const orbit = (clip) => el('g', { transform: 'rotate(-14)', 'clip-path': `url(#${id}-${clip})` }, el('path', { d: swoosh, fill: 'none', stroke: color, 'stroke-width': 0.8, opacity: 0.3 }) + comet);
  const body = el('g', { transform: `translate(${cx} ${cy})` }, orbit('sb') + el('g', { transform: 'rotate(-12)' }, device) + orbit('sf'));
  return { defs, body };
}

export const EMBLEMS = { web, game, app, ai, ios };
