// C12 section headers (SPEC §3): 880×64 on a transparent background, so each
// section ships a -dark and a -light file, served through <picture>.
// A single comet glides along the rule every 8 s.
import { el, n, svgDoc } from '../lib/svg.mjs';
import { textPath } from '../lib/text.mjs';
import { missions } from './missions.mjs';

const W = 880;
const H = 64;

// The README sections that have a header, in display order. Live sections
// appear only when data/github.json exists.
export function sections(profile, data = {}) {
  const list = [];
  if (profile.skills.length) list.push({ id: 'skills', title: 'Skills', meta: `${profile.skills.length} ORBITS` });
  if (data.github) list.push({ id: 'observatory', title: 'Observatory', meta: 'LIVE · SYNCED DAILY' });
  const m = missions(profile, data.github).length;
  if (m) list.push({ id: 'missions', title: 'Missions', meta: `${m} MISSION${m > 1 ? 'S' : ''}` });
  if (profile.links.length) list.push({ id: 'contact', title: 'Contact', meta: `${profile.links.length} CHANNEL${profile.links.length > 1 ? 'S' : ''}` });
  return list.map((s, i) => ({ ...s, index: String(i + 1).padStart(2, '0') }));
}

function header(section, theme, { fonts, tokens }) {
  const c = tokens.color;
  const dark = theme === 'dark';
  const ink = dark ? c.text.onDark : c.text.onLight;
  const muted = dark ? c.text.mutedOnDark : c.text.mutedOnLight;
  const accent = dark ? c.accent.ion : c.inkOnLight.ion;
  const id = `u-${section.id}`;
  const base = 43;

  const idx = textPath(fonts.monoBold, section.index, { x: 0, y: base, size: 14, tracking: 0.1 });
  const title = textPath(fonts.displayMedium, section.title.toUpperCase(), { x: 36, y: base + 1, size: 26, tracking: 0.2 });
  const meta = textPath(fonts.mono, section.meta, { x: W, y: base, size: 12, tracking: 0.2, anchor: 'end' });
  const x1 = 36 + title.width + 24;
  const x2 = W - meta.width - 20;
  const y = base - 8;

  const defs =
    el('linearGradient', { id: `${id}-rule`, gradientUnits: 'userSpaceOnUse', x1, x2, y1: 0, y2: 0 }, el('stop', { offset: 0, 'stop-color': accent, 'stop-opacity': 0.7 }) + el('stop', { offset: 1, 'stop-color': accent, 'stop-opacity': 0.08 })) +
    el('radialGradient', { id: `${id}-dot` }, el('stop', { offset: 0, 'stop-color': accent }) + el('stop', { offset: 1, 'stop-color': accent, 'stop-opacity': 0 }));
  const body =
    el('path', { d: idx.d, fill: accent }) +
    el('path', { d: title.d, fill: ink }) +
    el('path', { d: `M${n(x1)} ${n(y - 3)}l3 3l-3 3l-3 -3Z`, fill: accent }) +
    el('rect', { x: x1 + 8, y: y - 0.5, width: x2 - x1 - 8, height: 1, fill: `url(#${id}-rule)` }) +
    el('g', { transform: `translate(${n(x1 + 8)} ${n(y)})` }, el('ellipse', { class: 'glide', rx: 14, ry: 2, fill: `url(#${id}-dot)` })) +
    el('path', { d: meta.d, fill: muted });
  const travel = x2 - x1 - 8;
  const css = `.glide{opacity:0;animation:glide 8s cubic-bezier(.65,0,.35,1) infinite}@keyframes glide{0%{transform:translateX(0);opacity:0}6%{opacity:1}40%{transform:translateX(${n(travel)}px);opacity:0}100%{transform:translateX(${n(travel)}px);opacity:0}}`;
  return svgDoc({ id, w: W, h: H, title: section.title, css, defs, body });
}

export default function render({ profile, tokens, fonts, data }) {
  const files = [];
  for (const section of sections(profile, data)) {
    for (const theme of ['dark', 'light']) files.push({ path: `assets/ui/h-${section.id}-${theme}.svg`, svg: header(section, theme, { fonts, tokens }) });
  }
  return { files };
}
