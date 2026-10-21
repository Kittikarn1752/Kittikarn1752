// C9 missions (SPEC §3): profile.yaml projects, otherwise the top 3 public
// non-fork repos that have a description, by stars (never the profile repo
// itself). Dark cards, 400×200 shown at 270 px, with live stars and language.
// No qualifying entry → no files and no section.
import { el, n, roundRectPath, svgDoc } from '../lib/svg.mjs';
import { textPath, measure } from '../lib/text.mjs';

const W = 400;
const H = 200;
const PAD = 24;

export function missions(profile, gh) {
  const repos = gh?.topRepos ?? [];
  const live = (name) => repos.find((r) => r.name.toLowerCase() === name.toLowerCase());
  if (profile.projects.length) {
    return profile.projects.slice(0, 6).map((p) => {
      const r = p.repo ? live(p.repo) : null;
      return { name: p.name, summary: p.summary || r?.description || '', url: p.url, stars: r?.stars ?? 0, language: r?.language ?? '', skill: p.skill };
    });
  }
  const self = `${profile.user}/${profile.user}`.toLowerCase();
  return repos
    .filter((r) => r.name.toLowerCase() !== self)
    .slice(0, 3)
    .map((r) => ({ name: r.name.split('/')[1], summary: r.description, url: r.url, stars: r.stars, language: r.language, skill: '' }));
}

// Greedy word wrap to `maxLines`, with an ellipsis when text is left over.
function wrap(font, text, size, width, maxLines) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  while (words.length) {
    const next = line ? `${line} ${words[0]}` : words[0];
    if (measure(font, next, size) <= width || !line) {
      line = next;
      words.shift();
    } else {
      lines.push(line);
      line = '';
      if (lines.length === maxLines) break;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (words.length) {
    let last = lines[maxLines - 1];
    while (last && measure(font, `${last}…`, size) > width) last = last.slice(0, -1).trimEnd();
    lines[maxLines - 1] = `${last}…`;
  }
  return lines;
}

function card(m, k, total, { tokens, fonts }) {
  const c = tokens.color;
  const id = `m${k}`;
  const accent = m.skill ? c.skill[m.skill] : c.accent.ion;
  const frame = roundRectPath(0.5, 0.5, W - 1, H - 1, 19.5);
  const defs =
    el('linearGradient', { id: `${id}-bg`, x1: 0, y1: 0, x2: 1, y2: 1 }, el('stop', { offset: 0, 'stop-color': c.space.nebula }) + el('stop', { offset: 0.55, 'stop-color': c.space.deep }) + el('stop', { offset: 1, 'stop-color': c.space.void })) +
    el('radialGradient', { id: `${id}-glow` }, el('stop', { offset: 0, 'stop-color': accent, 'stop-opacity': 0.2 }) + el('stop', { offset: 1, 'stop-color': accent, 'stop-opacity': 0 })) +
    el('clipPath', { id: `${id}-clip` }, el('path', { d: frame }));

  // A small planet with a ring in the top-right; its moon orbits every 12 s.
  const px = W - 64;
  const py = 58;
  const planet =
    el('ellipse', { cx: px, cy: py, rx: 90, ry: 70, fill: `url(#${id}-glow)` }) +
    el('ellipse', { cx: px, cy: py, rx: 34, ry: 9, fill: 'none', stroke: accent, opacity: 0.35, transform: `rotate(-14 ${px} ${py})` }) +
    el('circle', { cx: px, cy: py, r: 12, fill: c.space.deep, stroke: accent, 'stroke-width': 1.2 }) +
    el('g', { transform: `translate(${px} ${py})` }, el('g', { class: 'moon' }, el('circle', { cx: 26, cy: 0, r: 2.4, fill: accent })));

  let body = el('path', { d: frame, fill: `url(#${id}-bg)` }) + el('g', { 'clip-path': `url(#${id}-clip)` }, planet) + el('path', { d: frame, fill: 'none', stroke: c.space.line });
  body += el('path', { d: textPath(fonts.mono, `MISSION ${String(k).padStart(2, '0')} / ${String(total).padStart(2, '0')}`, { x: PAD, y: 40, size: 12, tracking: 0.16 }).d, fill: c.text.mutedOnDark });

  const [name] = wrap(fonts.displayMedium, m.name, 22, W - 2 * PAD, 1);
  body += el('path', { d: textPath(fonts.displayMedium, name, { x: PAD, y: 104, size: 22, tracking: 0.02 }).d, fill: c.text.onDark });
  wrap(fonts.uiRegular, m.summary, 15, W - 2 * PAD, 2).forEach((line, i) => {
    body += el('path', { d: textPath(fonts.uiRegular, line, { x: PAD, y: 130 + i * 20, size: 15 }).d, fill: c.text.mutedOnDark });
  });

  // Footer: language and stars, only when known and non-zero.
  let fx = PAD;
  if (m.language) {
    body += el('circle', { cx: fx + 5, cy: 177, r: 5, fill: accent });
    const t = textPath(fonts.mono, m.language, { x: fx + 16, y: 181, size: 12 });
    body += el('path', { d: t.d, fill: c.text.onDark });
    fx += 16 + t.width + 20;
  }
  if (m.stars > 0) {
    const star = (cx, cy, ro, ri) => `M${Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5; const rr = i % 2 ? ri : ro; return `${n(cx + rr * Math.cos(a))} ${n(cy + rr * Math.sin(a))}`; }).join('L')}Z`;
    body += el('path', { d: star(fx + 6, 176.5, 6.5, 2.8), fill: c.accretion.gold });
    body += el('path', { d: textPath(fonts.mono, String(m.stars), { x: fx + 17, y: 181, size: 12 }).d, fill: c.text.onDark });
  }

  const css = '.moon{transform-origin:0 0;animation:moon 12s linear infinite}@keyframes moon{to{transform:rotate(360deg)}}';
  const title = [m.name, m.summary, m.language, m.stars > 0 ? `${m.stars} stars` : ''].filter(Boolean).join(' — ');
  return svgDoc({ id, w: W, h: H, title, css, defs, body });
}

export default function render({ profile, tokens, fonts, data }) {
  const list = missions(profile, data.github);
  return { files: list.map((m, i) => ({ path: `assets/missions/m${i + 1}.svg`, svg: card(m, i + 1, list.length, { tokens, fonts }) })) };
}
