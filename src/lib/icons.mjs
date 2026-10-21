// Technology glyphs (24×24 monochrome paths): our traced brand glyphs first,
// then simple-icons. Unknown names return null, and callers render a text chip instead.
import * as si from 'simple-icons';
import { BRAND_ICONS } from './brand-icons.mjs';

// Spellings people write that differ from the simple-icons title or slug.
const ALIAS = { html: 'html5', css: 'css3', js: 'javascript', ts: 'typescript', 'c++': 'cplusplus', 'c#': 'csharp' };

const index = new Map();
for (const icon of Object.values(si)) {
  if (!icon?.slug) continue;
  index.set(icon.slug, icon);
  index.set(icon.title.toLowerCase(), icon);
}

export function techIcon(name) {
  const key = String(name).trim().toLowerCase();
  const compact = key.replace(/[^a-z0-9]/g, '');
  const brand = BRAND_ICONS[compact];
  // Traced glyphs have holes drawn as separate loops, so they need even-odd filling.
  if (brand) return { slug: compact, title: brand.title, path: brand.path, fillRule: 'evenodd' };
  const icon = index.get(ALIAS[key] ?? key) ?? index.get(compact);
  return icon ? { slug: icon.slug, title: icon.title, path: icon.path } : null;
}
