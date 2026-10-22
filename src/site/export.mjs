// profile.yaml + design tokens + design fonts → the companion site's inputs:
//   site/src/data/profile.json   public profile fields, colors, icon paths
//   site/public/fonts/*.otf      Latin subsets of the design fonts (+ OFL texts)
//   site/public/favicon.svg      the icon, from tokens
// The site is its own repo and its CI never sees this repo, so it builds from
// these committed copies. Only public fields are copied; nothing is added.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProfile } from '../lib/profile.mjs';
import { loadFonts } from '../lib/text.mjs';
import { techIcon } from '../lib/icons.mjs';
import { ENVELOPE, GLYPH } from '../components/buttons.mjs';
import { SITE_FONTS, subsetFont } from './fonts.mjs';
import { favicon } from './favicon.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const SITE = join(ROOT, 'site');
const LICENSES = ['OFL-Unbounded.txt', 'OFL-SpaceGrotesk.txt', 'OFL-JetBrainsMono.txt'];

const glyph = (icon) => (icon ? { path: icon.path, evenOdd: icon.fillRule === 'evenodd' } : null);

export function siteData(profile, tokens) {
  // Links back into the site itself (the README's deep links) make no sense on the site.
  const external = (href) => (href && !href.startsWith(profile.site.url) ? href : '');
  return {
    user: profile.user,
    displayName: profile.displayName,
    fullName: profile.fullName,
    location: profile.location,
    roleLine: profile.roleLine,
    tagline: profile.tagline,
    bio: profile.bio,
    github: `https://github.com/${profile.user}`,
    githubIcon: glyph(techIcon('github')),
    siteUrl: profile.site.url,
    skills: profile.skills.map(({ id, title, summary, stack, since, link, color }) => ({
      id,
      title,
      summary,
      stack: stack.map((name) => ({ name, icon: glyph(techIcon(name)) })),
      since,
      link: external(link),
      color,
    })),
    projects: profile.projects,
    links: profile.links
      .filter((l) => external(l.href))
      .map((l) => ({
        ...l,
        icon: l.channel === 'email' ? { path: ENVELOPE, evenOdd: false } : glyph(techIcon(GLYPH[l.channel] ?? l.channel)),
      })),
    color: tokens.color,
    physics: tokens.physics,
  };
}

function write(path, content) {
  const same = existsSync(path) && Buffer.compare(readFileSync(path), Buffer.from(content)) === 0;
  if (!same) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
  console.log(`${same ? 'unchanged' : 'wrote'} ${relative(ROOT, path).replaceAll('\\', '/')}`);
}

function main() {
  if (!existsSync(SITE)) throw new Error('site/ is missing: clone or scaffold the site repo first');
  const tokens = JSON.parse(readFileSync(join(ROOT, 'design/tokens.json'), 'utf8'));
  const profile = loadProfile(join(ROOT, 'profile.yaml'), tokens);
  write(join(SITE, 'src/data/profile.json'), `${JSON.stringify(siteData(profile, tokens), null, 2)}\n`);

  write(join(SITE, 'public/favicon.svg'), favicon(tokens));

  const fonts = loadFonts(join(ROOT, 'design/fonts'));
  for (const spec of SITE_FONTS) write(join(SITE, 'public/fonts', spec.out), subsetFont(fonts[spec.key], spec));
  for (const file of LICENSES) {
    const dest = join(SITE, 'public/fonts', file);
    copyFileSync(join(ROOT, 'design/fonts', file), dest);
  }
}

main();
