// README.md from src/readme/template.md. Each `<!-- slot:name -->` line is
// replaced by a generated block; a block with no data renders nothing, and
// its slot disappears. GitHub-safe output only: no style, class or script.
import { sections } from '../components/headers.mjs';

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

  skills: ({ profile }) => {
    const section = sections(profile).find((s) => s.id === 'skills');
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

  contact: ({ profile }) => {
    const section = sections(profile).find((s) => s.id === 'contact');
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
