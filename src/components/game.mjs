// C8 Feed the Black Hole (SPEC §5): the game panel and its button. The hole is
// the hero's (same disk, halo and photon ring), scaled by mass:
// r = r0 + k·log10(1 + mass), and its glow grows with it. The last travelers'
// avatars are embedded as data URIs (an <img> SVG can't load external images);
// a traveler without a cached avatar gets an initial instead.
import { rng } from '../lib/rng.mjs';
import { el, n, svgDoc, TWINKLE_CSS } from '../lib/svg.mjs';
import { measure, textPath } from '../lib/text.mjs';
import { button } from './buttons.mjs';
import { blackHole } from './hero.mjs';
import { panel } from './telemetry.mjs';
import { EMPTY, growth, radius, travelers } from '../game/feed.mjs';

// Copy approved 2026-10-22.
export const COPY = {
  head: 'FEED THE BLACK HOLE',
  unit: (mass) => (mass === 1 ? 'STAR DEVOURED' : 'STARS DEVOURED'),
  last: (e) => `LAST FED BY @${e.login} · ${e.at.slice(0, 10)}`,
  empty: 'NOTHING FED YET · BE THE FIRST',
  cta: 'CLICK TO THROW IN A STAR',
  button: 'Feed the black hole',
};

const HOLE = [624, 130];

// Ring with a hole (nonzero: the inner circle runs the other way).
const GLYPH = 'M12 3a9 9 0 1 1 0 18a9 9 0 1 1 0-18ZM12 8.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7Z';

const look = (cx, cy, rsh, g) => ({
  hole: { cx, cy, rsh },
  tilt: 0.15,
  disk: { inner: 1.18, outer: 3.9, rings: 9 },
  halo: { shift: 0.17, reach: 1.52, a: 0.72 + 0.28 * g },
  beam: [0.38, 1],
  bloom: { rx: 3.6, ry: 1.25, a: 0.1 + 0.16 * g },
  flare: 0.16 + 0.18 * g,
});

function avatar(entry, i, x, y, rad, { avatars, fonts, c }) {
  const id = `g-av${i}`;
  const clip = el('clipPath', { id }, el('circle', { cx: x, cy: y, r: rad }));
  const uri = avatars[entry.id];
  const face = uri
    ? el('image', { href: uri, x: x - rad, y: y - rad, width: 2 * rad, height: 2 * rad, preserveAspectRatio: 'xMidYMid slice', 'clip-path': `url(#${id})` })
    : el('circle', { cx: x, cy: y, r: rad, fill: c.space.nebula }) + el('path', { d: textPath(fonts.monoBold, entry.login[0].toUpperCase(), { x, y: y + rad * 0.36, size: rad, anchor: 'middle' }).d, fill: c.accent.titanium });
  const ring = el('circle', { cx: x, cy: y, r: rad + 1.5, fill: 'none', stroke: i ? c.accent.titanium : c.accretion.gold, 'stroke-width': 1.2, opacity: i ? 0.55 : 0.95 });
  return { defs: clip, body: face + ring };
}

// One gold star every 24 s: a quick spiral from the far side into the shadow.
function infall(cx, cy, rsh, tilt, c) {
  const r0 = rsh * 5.2;
  const pts = [];
  for (let s = 0; s <= 48; s++) {
    const u = s / 48;
    const rr = rsh * 0.96 + (r0 - rsh * 0.96) * (1 - u ** 1.4);
    const a = -2.6 + 1.6 * Math.PI * u;
    pts.push(`${n(cx + rr * Math.cos(a))} ${n(cy + rr * Math.sin(a) * tilt * 2.2)}`);
  }
  return el(
    'g',
    { class: 'smil' },
    el(
      'circle',
      { r: 2.2, fill: c.accretion.photon, opacity: 0 },
      el('animateMotion', { dur: '24s', begin: '-14s', repeatCount: 'indefinite', path: `M${pts.join('L')}`, keyPoints: '0;0;1;1', keyTimes: '0;.72;.9;1', calcMode: 'linear' }) +
        el('animate', { attributeName: 'opacity', values: '0;0;1;1;0;0', keyTimes: '0;.72;.74;.88;.9;1', dur: '24s', begin: '-14s', repeatCount: 'indefinite' }),
    ),
  );
}

const fit = (font, text, size, tracking, maxW) => {
  let t = text;
  while (t.length > 2 && measure(font, t, size, tracking) > maxW) t = t.slice(0, -1);
  return t === text ? t : `${t.slice(0, -1)}…`;
};

// Direction A "Accretion gauge" (picked in the P3 concept sprint): mass and
// travelers on the left, the hole on the right third like the hero.
function info({ fonts, c, mass, last, list, avatars }) {
  const path = (font, text, o, fill, extra = {}) => el('path', { d: textPath(font, text, o).d, fill, ...extra });
  let defs = '';
  let body = path(fonts.mono, COPY.head, { x: 48, y: 50, size: 12, tracking: 0.3 }, c.accent.ion);
  body += path(fonts.display, String(mass), { x: 46, y: 122, size: 58 }, c.accretion.gold);
  body += path(fonts.mono, COPY.unit(mass), { x: 48, y: 150, size: 13, tracking: 0.2 }, c.text.onDark);
  body += path(fonts.mono, fit(fonts.mono, last ? COPY.last(last) : COPY.empty, 12, 0.08, 330), { x: 48, y: 174, size: 12, tracking: 0.08 }, c.text.mutedOnDark);
  list.forEach((e, i) => {
    const a = avatar(e, i, 62 + i * 36, 214, 13, { avatars, fonts, c });
    defs += a.defs;
    body += a.body;
  });
  body += path(fonts.mono, COPY.cta, { x: 852, y: 238, size: 11, tracking: 0.2, anchor: 'end' }, c.accent.ion, { opacity: 0.8 });
  return { defs, body };
}

export function gamePanel({ tokens, fonts, state, avatars = {} }) {
  const g = tokens.game;
  const c = tokens.color;
  const r = rng('game');
  const mass = state.mass;
  const [cx, cy] = HOLE;
  const rsh = radius(mass, g);
  const bh = blackHole(r, look(cx, cy, rsh, growth(mass, g)), { ...c.space, ...c.accretion }, { id: 'g', w: g.w, h: g.h });
  const L = bh.layers;
  const p = panel('g', g.h, r, tokens, 64);
  const list = travelers(state);
  const last = state.entries[0];
  const text = info({ fonts, c, mass, last, list, avatars });

  const scene = L.streaks + L.bloom + L.diskBack + L.halo + L.particles + infall(cx, cy, rsh, 0.15, c) + L.photon + L.shadow + L.diskFront + (L.flare ?? '');
  const body = p.back(scene) + p.edge + text.body;
  const css = '.spin{transform-box:fill-box;transform-origin:center;animation:spin var(--p,24s) linear infinite}@keyframes spin{to{transform:rotate(1turn)}}' + TWINKLE_CSS;
  const title = `Feed the Black Hole: ${mass} ${mass === 1 ? 'star' : 'stars'} devoured${last ? `, last fed by @${last.login}` : ''}`;
  const desc = list.length ? `A black hole that grows with every star fed through an issue. Last travelers: ${list.map((e) => `@${e.login}`).join(', ')}.` : 'A black hole that grows with every star fed through an issue.';
  return svgDoc({ id: 'g', w: g.w, h: g.h, title, desc, css, defs: p.defs + bh.defs + text.defs, body });
}

export default function render({ tokens, fonts, data }) {
  const game = data.game ?? { state: EMPTY, avatars: {} };
  return {
    files: [
      { path: 'assets/game/blackhole.svg', svg: gamePanel({ tokens, fonts, state: game.state, avatars: game.avatars }) },
      { path: 'assets/ui/btn-feed.svg', svg: button({ channel: 'feed', label: COPY.button, glyph: GLYPH }, { fonts, tokens }) },
    ],
  };
}
