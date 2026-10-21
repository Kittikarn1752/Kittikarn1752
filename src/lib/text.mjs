// Text as SVG paths (opentype.js). Fonts are loaded once by build.mjs and passed
// to components, so components stay pure.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as ot from 'opentype.js';
import { n } from './svg.mjs';

const parse = ot.parse ?? ot.default.parse;

export const FONT_FILES = {
  display: 'Unbounded-Bold.ttf',
  displayMedium: 'Unbounded-Medium.ttf',
  ui: 'SpaceGrotesk-Medium.ttf',
  uiRegular: 'SpaceGrotesk-Regular.ttf',
  mono: 'JetBrainsMono-Regular.ttf',
  monoBold: 'JetBrainsMono-SemiBold.ttf',
};

export function loadFonts(dir) {
  const fonts = {};
  for (const [key, file] of Object.entries(FONT_FILES)) {
    const buf = readFileSync(join(dir, file));
    fonts[key] = parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  }
  return fonts;
}

// Advance width of `text`, with `tracking` in em, without the trailing space
// that letterSpacing adds after the last glyph.
export function measure(font, text, size, tracking = 0) {
  if (!text) return 0;
  return font.getAdvanceWidth(text, size, { kerning: true, letterSpacing: tracking }) - tracking * size;
}

// Uppercase for HUD-style labels, keeping brand casing such as "iOS".
export const caps = (s) => s.toUpperCase().replace(/\bIOS\b/g, 'iOS');

export const capHeight = (font, size) => ((font.tables.os2?.sCapHeight || font.unitsPerEm * 0.7) / font.unitsPerEm) * size;

/**
 * Lays out one line and returns its path data. `y` is the baseline.
 * anchor: start | middle | end.
 */
export function textPath(font, text, { x = 0, y = 0, size, tracking = 0, anchor = 'start' }) {
  const width = measure(font, text, size, tracking);
  const x0 = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
  const d = serialize(font.getPath(text, x0, y, size, { kerning: true, letterSpacing: tracking }).commands);
  return { d, width, x: x0 };
}

// Our own path serializer: opentype.js 2.0's toPathData rounds through strings
// and turns tiny values written in exponent form (1e-7) into NaN.
function serialize(commands) {
  let d = '';
  for (const c of commands) {
    if (c.type === 'M' || c.type === 'L') d += `${c.type}${n(c.x)} ${n(c.y)}`;
    else if (c.type === 'Q') d += `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
    else if (c.type === 'C') d += `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
    else if (c.type === 'Z') d += 'Z';
  }
  return d;
}
