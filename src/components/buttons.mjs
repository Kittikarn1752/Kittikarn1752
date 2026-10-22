// C11 contact buttons (SPEC §3): a 44 px pill with its own dark background for
// every filled link. Social glyphs come from simple-icons; email gets a plain
// envelope. Buttons are static: the page already has enough motion.
import { techIcon } from '../lib/icons.mjs';
import { el, n, roundRectPath, svgDoc } from '../lib/svg.mjs';
import { textPath, capHeight } from '../lib/text.mjs';

const H = 44;
export const ENVELOPE = 'M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm1 2.2V17h16V7.2l-8 5.3ZM5.4 7l6.6 4.4L18.6 7Z';
// A globe for the website button (nonzero: holes run the other way).
const GLOBE =
  'M12 2a10 10 0 0 1 0 20a10 10 0 0 1 0-20ZM12 3.6a8.4 8.4 0 0 0 0 16.8a8.4 8.4 0 0 0 0-16.8Z' +
  'M12 2.8a4.4 9.2 0 0 1 0 18.4a4.4 9.2 0 0 1 0-18.4ZM12 4.4a2.8 7.6 0 0 0 0 15.2a2.8 7.6 0 0 0 0-15.2ZM2.6 11.2h18.8v1.6H2.6Z';
export const GLYPH = { linkedin: 'linkedin', x: 'x', instagram: 'instagram', facebook: 'facebook', youtube: 'youtube', discord: 'discord' };

// `link.glyph` (24 px path data) overrides the channel icon; the game uses it.
export function button(link, { fonts, tokens }) {
  const c = tokens.color;
  const size = 15;
  const label = textPath(fonts.ui, link.label, { x: 48, y: H / 2 + capHeight(fonts.ui, size) / 2, size, tracking: 0.02 });
  const w = Math.ceil(48 + label.width + 22);
  const frame = roundRectPath(0.5, 0.5, w - 1, H - 1, H / 2 - 0.5);
  const own = { email: ENVELOPE, website: GLOBE }[link.channel];
  const glyph = link.glyph ?? own ?? techIcon(GLYPH[link.channel] ?? link.channel)?.path;
  const id = `u-b${link.channel}`;
  const defs = el('linearGradient', { id: `${id}-bg`, x1: 0, y1: 0, x2: 0, y2: 1 }, el('stop', { offset: 0, 'stop-color': c.space.nebula }) + el('stop', { offset: 1, 'stop-color': c.space.deep }));
  const body =
    el('path', { d: frame, fill: `url(#${id}-bg)`, stroke: c.space.line }) +
    el('path', { d: `M${H / 2} 1.5H${w - H / 2}`, stroke: '#fff', 'stroke-opacity': 0.08 }) +
    el('circle', { cx: 24, cy: H / 2, r: 14, fill: c.accent.ion, 'fill-opacity': 0.1, stroke: c.accent.ion, 'stroke-opacity': 0.45 }) +
    (glyph ? el('path', { d: glyph, fill: c.accent.ion, transform: `translate(${n(24 - 8)} ${n(H / 2 - 8)}) scale(.6667)` }) : '') +
    el('path', { d: label.d, fill: c.text.onDark });
  return svgDoc({ id, w, h: H, title: link.label, defs, body });
}

export default function render({ profile, tokens, fonts }) {
  return { files: profile.links.map((link) => ({ path: `assets/ui/btn-${link.channel}.svg`, svg: button(link, { fonts, tokens }) })) };
}
