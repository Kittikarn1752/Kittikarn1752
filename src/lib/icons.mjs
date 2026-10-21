// Technology glyphs from simple-icons (24×24 monochrome paths). Unknown names
// return null, and callers render a text chip instead.
import * as si from 'simple-icons';

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
  const icon = index.get(ALIAS[key] ?? key) ?? index.get(key.replace(/[^a-z0-9]/g, ''));
  return icon ? { slug: icon.slug, title: icon.title, path: icon.path } : null;
}
