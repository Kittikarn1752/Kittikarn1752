// README.md from src/readme/template.md. Each `<!-- slot:name -->` line is
// replaced by a generated block; a block with no data renders nothing, and
// its slot disappears. GitHub-safe output only: no style, class or script.
import { sections } from '../components/headers.mjs';
import { metrics, syncedStamp } from '../components/telemetry.mjs';
import { pct, topLanguages } from '../components/languages.mjs';
import { galaxyCaption } from '../components/galaxy.mjs';
import { missions } from '../components/missions.mjs';
import { COPY } from '../components/game.mjs';
import { COPY as CTA } from '../components/cta.mjs';
import { feedUrl } from '../game/feed.mjs';

// User text goes into HTML blocks, so escape it (bio "-->" stays visible text).
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const img = (src, alt, size) => `<img src="${src}" ${size} alt="${esc(alt)}">`;
const linked = (href, inner) => (href ? `<a href="${esc(href)}">${inner}</a>` : inner);

function header(section) {
  return [
    '<picture>',
    `  <source media="(prefers-color-scheme: dark)" srcset="assets/ui/h-${section.id}-dark.svg">`,
    `  <source media="(prefers-color-scheme: light)" srcset="assets/ui/h-${section.id}-light.svg">`,
    `  ${img(`assets/ui/h-${section.id}-dark.svg`, section.title, 'width="100%"')}`,
    '</picture>',
  ].join('\n');
}

const BLOCKS = {
  hero: ({ profile }) => {
    const alt = `${profile.displayName} — animated black hole with a glowing accretion disk`;
    const hero = img('assets/hero/hero.svg', alt, 'width="100%"');
    return `<p align="center">${linked(profile.site.live ? profile.site.url : '', hero)}</p>`;
  },

  intro: ({ profile }) => {
    const p = profile;
    const names = p.skills.map((s) => s.title).join(', ');
    const lines = [img('assets/intro/orbit.svg', `Porthole: ${p.skills.length} skill planets (${names}) orbiting a K star`, 'align="right" width="34%"'), '', `### Hi, I'm ${esc(p.displayName)}`];
    if (p.tagline) lines.push('', `**${esc(p.tagline)}**`);
    if (p.bio) lines.push('', esc(p.bio));
    if (p.roleLine) lines.push('', esc(p.roleLine));
    const facts = [];
    if (p.location) facts.push(`📍 ${esc(p.location)}`);
    if (p.openTo.length) facts.push(`Open to ${p.openTo.map(esc).join(', ')}`);
    if (facts.length) lines.push('', facts.join(' · '));
    lines.push('', '<br clear="right">');
    return lines.join('\n');
  },

  skills: ({ profile, data }) => {
    const section = sections(profile, data).find((s) => s.id === 'skills');
    if (!section) return '';
    const card = (s) => linked(s.link, img(`assets/cards/${s.id}.svg`, [s.title, s.summary, s.stack.join(', ')].filter(Boolean).join(' — '), 'width="270"'));
    // 3 + 2 on desktop; fixed pixel widths wrap to one per row on mobile.
    const rows = [profile.skills.slice(0, 3), profile.skills.slice(3)].filter((row) => row.length);
    const out = [header(section), '', ...rows.map((row) => `<p align="center">\n  ${row.map(card).join('\n  ')}\n</p>`)];
    if (profile.skills.some((s) => s.stack.length)) {
      const alt = profile.skills.filter((s) => s.stack.length).map((s) => `${s.title}: ${s.stack.join(', ')}`).join('; ');
      out.push(`<p align="center">${img('assets/stack/stack.svg', `Tech constellation — ${alt}`, 'width="100%"')}</p>`);
    }
    return out.join('\n');
  },

  observatory: ({ profile, data, tokens }) => {
    const gh = data.github;
    const section = sections(profile, data).find((s) => s.id === 'observatory');
    if (!section) return '';
    const stats = metrics(gh).map((m) => `${m.v} ${m.alt}`).join(', ');
    const out = [header(section), '', `<p align="center">${img('assets/stats/telemetry.svg', `Observatory: ${stats}. Synced ${syncedStamp(gh)}.`, 'width="100%"')}</p>`];
    if (gh.languages.length) out.push(`<p align="center">${img('assets/stats/languages.svg', `Language orbits: ${topLanguages(gh, tokens).map((l) => `${l.name} ${pct(l.share)}`).join(', ')}`, 'width="100%"')}</p>`);
    out.push(`<p align="center">${img('assets/galaxy/galaxy.svg', `Contribution galaxy: ${galaxyCaption(gh)}`, 'width="100%"')}</p>`);
    return out.join('\n');
  },

  // C8: the game panel and button both open a prefilled feed|star issue.
  // ?v=<mass> changes the image URL on every feed, so caches can't serve the old hole.
  interact: ({ profile, data }) => {
    const section = sections(profile, data).find((s) => s.id === 'interact');
    if (!section) return '';
    const { mass, entries } = data.game.state;
    const url = feedUrl(profile.user);
    const alt = `Feed the Black Hole: ${mass} ${mass === 1 ? 'star' : 'stars'} devoured${entries.length ? `, last fed by @${entries[0].login}` : ''}. Opens an issue that throws in a star.`;
    return [
      header(section),
      '',
      '<!-- FEED:START -->',
      // Narrow screens get the 360 px layout, so the panel's type stays legible.
      `<p align="center">${linked(url, `<picture>\n  <source media="(max-width: 600px)" srcset="assets/game/blackhole-mobile.svg?v=${mass}">\n  ${img(`assets/game/blackhole.svg?v=${mass}`, alt, 'width="100%"')}\n</picture>`)}</p>`,
      `<p align="center">${linked(url, img('assets/ui/btn-feed.svg', COPY.button, 'height="44"'))}</p>`,
      '<!-- FEED:END -->',
      // C11 site CTA, outside the FEED markers so the game workflow never touches it.
      ...(profile.site.live
        ? [`<p align="center">${linked(profile.site.url, `<picture>\n  <source media="(max-width: 600px)" srcset="assets/ui/cta-mobile.svg">\n  ${img('assets/ui/cta.svg', CTA.alt, 'width="100%"')}\n</picture>`)}</p>`]
        : []),
    ].join('\n');
  },

  missions: ({ profile, data }) => {
    const section = sections(profile, data).find((s) => s.id === 'missions');
    if (!section) return '';
    const list = missions(profile, data.github);
    const card = (m, i) => linked(m.url, img(`assets/missions/m${i + 1}.svg`, [m.name, m.summary].filter(Boolean).join(' — '), 'width="270"'));
    const rows = [list.slice(0, 3), list.slice(3)].filter((row) => row.length);
    return [header(section), '', ...rows.map((row, r) => `<p align="center">\n  ${row.map((m, i) => card(m, r * 3 + i)).join('\n  ')}\n</p>`)].join('\n');
  },

  // C10: the last public events between LOG markers, inside <details>.
  log: ({ data }) => {
    const events = data.github?.events ?? [];
    if (!events.length) return '';
    const md = (s) => esc(s).replace(/([\\`*_[\]#|~])/g, '\\$1');
    const items = events.map((e) => `- ${e.createdAt.slice(0, 10)} · [${md(e.title)}](${e.url.replace(/[()\s]/g, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`)}) · ${md(e.repo)}`);
    return ['<details>', '<summary><b>Ship\'s log</b> · recent transmissions</summary>', '', '<!-- LOG:START -->', ...items, '<!-- LOG:END -->', '', '</details>'].join('\n');
  },

  contact: ({ profile, data }) => {
    const section = sections(profile, data).find((s) => s.id === 'contact');
    if (!section) return '';
    const buttons = profile.links.map((l) => linked(l.href, img(`assets/ui/btn-${l.channel}.svg`, l.label, 'height="44"')));
    return [header(section), '', `<p align="center">\n  ${buttons.join('\n  ')}\n</p>`].join('\n');
  },

  footer: ({ data }) => `<p align="center">${img('assets/ui/footer.svg', `Built in orbit · ${data.year}`, 'width="100%"')}</p>`,
};

export function renderReadme({ template, ...ctx }) {
  const body = template.replace(/^<!-- slot:(\w+) -->$/gm, (_, name) => {
    if (!BLOCKS[name]) throw new Error(`template: unknown slot "${name}"`);
    return BLOCKS[name](ctx);
  });
  // Empty slots leave blank runs behind; keep at most one blank line.
  return body.replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
