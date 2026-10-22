// Subsets the design fonts for the companion site with opentype.js (already a
// dependency of the SVG build). The site shows Latin text only, so each file
// keeps printable ASCII plus a few marks. Output is CFF-flavored OpenType.
// Families get neutral internal names; the OFL licenses ship alongside.
import * as ot from 'opentype.js';

const OT = ot.Font ? ot : ot.default;

export const SITE_FONTS = [
  { key: 'display', family: 'EH Display', style: 'Bold', weight: 700, out: 'display-700.otf' },
  { key: 'uiRegular', family: 'EH Text', style: 'Regular', weight: 400, out: 'text-400.otf' },
  { key: 'ui', family: 'EH Text', style: 'Medium', weight: 500, out: 'text-500.otf' },
  { key: 'mono', family: 'EH Mono', style: 'Regular', weight: 400, out: 'mono-400.otf' },
];

const EXTRA = '·→←↗—–’‘“”…×';
export const CHARSET = [...Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)), ...EXTRA];

export function subsetFont(font, { family, style }) {
  const glyphs = [font.glyphs.get(0)];
  const seen = new Set([0]);
  for (const ch of CHARSET) {
    const g = font.charToGlyph(ch);
    if (!g || g.index === 0 || seen.has(g.index)) continue;
    seen.add(g.index);
    glyphs.push(
      new OT.Glyph({
        name: g.name || `uni${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`,
        unicode: ch.codePointAt(0),
        advanceWidth: g.advanceWidth,
        path: g.path,
      }),
    );
  }
  const notdef = glyphs[0];
  glyphs[0] = new OT.Glyph({ name: '.notdef', advanceWidth: notdef.advanceWidth, path: notdef.path });
  const out = new OT.Font({
    familyName: family,
    styleName: style,
    unitsPerEm: font.unitsPerEm,
    ascender: font.ascender,
    descender: font.descender,
    glyphs,
  });
  return pinTimestamps(Buffer.from(out.toArrayBuffer()), PINNED_TIME);
}

// opentype.js stamps `head.modified` with the current time; pin both dates so
// the output is byte-identical between runs, then redo the two checksums.
const PINNED_TIME = Date.UTC(2026, 9, 21) / 1000; // the day the fonts were downloaded
const MAC_EPOCH = 2082844800n; // seconds from 1904 to 1970

function pinTimestamps(buf, seconds) {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const word = (at) => (at + 4 <= buf.length ? view.getUint32(at) : buf.readUIntBE(at, buf.length - at) * 256 ** (4 - (buf.length - at)));
  const checksum = (start, length) => {
    let sum = 0;
    for (let at = start; at < start + length; at += 4) sum = (sum + word(at)) >>> 0;
    return sum;
  };
  let head = null;
  for (let i = 0; i < view.getUint16(4); i++) {
    const rec = 12 + i * 16;
    if (buf.toString('latin1', rec, rec + 4) === 'head') head = { rec, offset: view.getUint32(rec + 8), length: view.getUint32(rec + 12) };
  }
  if (!head) throw new Error('subset font has no head table');
  const stamp = BigInt(seconds) + MAC_EPOCH;
  view.setBigUint64(head.offset + 20, stamp);
  view.setBigUint64(head.offset + 28, stamp);
  view.setUint32(head.offset + 8, 0);
  view.setUint32(head.rec + 4, checksum(head.offset, head.length));
  view.setUint32(head.offset + 8, (0xb1b0afba - checksum(0, buf.length)) >>> 0);
  return buf;
}
