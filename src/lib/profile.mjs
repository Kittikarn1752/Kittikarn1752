// profile.yaml → a normalized, validated object. Empty fields stay empty, and
// components leave those elements out. Nothing here invents a value.
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

// The companion site is live (P4, 2026-10-22): the hero, cards, website button and
// the C11 CTA link to it. Set false again if the site ever goes down.
export const SITE_LIVE = true;

const SKILL_IDS = ['web', 'game', 'app', 'ai', 'ios'];
const TRACKING_PARAM = /^(?:fbclid|gclid|igshid|mibextid|utm_[a-z]+)$/i;
const LINKS = [
  { channel: 'email', label: 'Email' },
  { channel: 'website', label: 'Website' },
  { channel: 'linkedin', label: 'LinkedIn' },
  { channel: 'x', label: 'X' },
  { channel: 'instagram', label: 'Instagram' },
  { channel: 'facebook', label: 'Facebook' },
  { channel: 'youtube', label: 'YouTube' },
  { channel: 'discord', label: 'Discord' },
];

const str = (v) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim());
const list = (v) => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);

// Drops click-tracking query parameters (fbclid, utm_*, …) from a URL.
export function cleanUrl(raw) {
  const value = str(raw);
  if (!/^https?:\/\//i.test(value)) return value;
  const url = new URL(value);
  for (const key of [...url.searchParams.keys()]) if (TRACKING_PARAM.test(key)) url.searchParams.delete(key);
  return url.toString();
}

export function normalizeProfile(raw, tokens) {
  const errors = [];
  const id = raw?.identity ?? {};
  const user = str(id.github_username);
  if (!user) errors.push('identity.github_username is empty');
  const site = { url: user ? `https://${user.toLowerCase()}.github.io` : '', live: SITE_LIVE };

  const skills = (raw?.skills ?? []).map((s, i) => {
    const skillId = str(s.id);
    if (!SKILL_IDS.includes(skillId)) errors.push(`skills[${i}].id "${skillId}" is not one of ${SKILL_IDS.join(', ')}`);
    const summary = str(s.summary);
    if (summary.length > 40) errors.push(`skills[${i}].summary is ${summary.length} chars (max 40)`);
    const link = cleanUrl(s.link) || (site.live ? `${site.url}/#${skillId}` : '');
    return {
      id: skillId,
      index: i + 1,
      title: str(s.title),
      summary,
      stack: list(s.stack),
      since: str(s.since),
      link,
      color: tokens.color.skill[skillId],
    };
  });

  const rawLinks = raw?.links ?? {};
  const links = [];
  for (const { channel, label } of LINKS) {
    let href = cleanUrl(rawLinks[channel]);
    if (channel === 'website' && !href && site.live) href = site.url;
    if (!href) continue;
    if (channel === 'email') href = `mailto:${href.replace(/^mailto:/i, '')}`;
    links.push({ channel, label, href });
  }

  const projects = (raw?.projects ?? []).map((p, i) => {
    const skill = str(p.skill);
    if (skill && !SKILL_IDS.includes(skill)) errors.push(`projects[${i}].skill "${skill}" is not one of ${SKILL_IDS.join(', ')}`);
    const repo = str(p.repo).replace(/^https?:\/\/github\.com\//i, '');
    const url = cleanUrl(p.url) || (repo ? `https://github.com/${repo}` : '');
    if (!str(p.name) || !url) errors.push(`projects[${i}] needs a name and a repo or url`);
    return { name: str(p.name), repo, url, summary: str(p.summary), skill };
  });

  if (errors.length) throw new Error(`profile.yaml:\n- ${errors.join('\n- ')}`);
  return {
    user,
    displayName: str(id.display_name) || user,
    fullName: str(id.full_name),
    location: str(id.location),
    roleLine: str(id.role_line),
    tagline: str(id.tagline),
    bio: str(id.bio),
    openTo: list(id.open_to),
    skills,
    projects,
    links,
    site,
  };
}

export function loadProfile(path, tokens) {
  return normalizeProfile(parse(readFileSync(path, 'utf8')), tokens);
}
