// GitHub (public data only) → data/github.json (SPEC §4).
//   node src/data/fetch.mjs
// Auth: GITHUB_TOKEN or GH_TOKEN (CI). Without one, it asks the local `gh` CLI,
// which keeps the token to itself. On any failure the previous file stays
// untouched and the process exits 1, so the CI run shows red while the build
// still renders the last good data. Never logs tokens or payloads.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from 'yaml';
import { DATA_FILE, level, streaks, validate } from '../lib/data.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const API = 'https://api.github.com';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

const USER_QUERY = `query($login: String!) {
  user(login: $login) {
    login name
    followers { totalCount }
    pullRequests { totalCount }
    issues { totalCount }
    repositories(ownerAffiliations: OWNER, privacy: PUBLIC) { totalCount }
    contributionsCollection {
      totalCommitContributions
      contributionCalendar { totalContributions weeks { contributionDays { date contributionCount contributionLevel } } }
    }
  }
}`;

const REPOS_QUERY = `query($login: String!, $after: String) {
  user(login: $login) {
    repositories(ownerAffiliations: OWNER, privacy: PUBLIC, isFork: false, first: 100, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes {
        name nameWithOwner description url stargazerCount pushedAt
        primaryLanguage { name }
        languages(first: 20, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name } } }
      }
    }
  }
}`;

async function graphql(query, variables) {
  let body;
  if (TOKEN) {
    const res = await fetch(`${API}/graphql`, {
      method: 'POST',
      headers: { authorization: `bearer ${TOKEN}`, 'content-type': 'application/json', 'user-agent': 'event-horizon-stats' },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`);
    body = await res.json();
  } else {
    const args = ['api', 'graphql', '-f', `query=${query}`];
    for (const [k, v] of Object.entries(variables)) if (v != null) args.push('-f', `${k}=${v}`);
    body = JSON.parse(gh(args));
  }
  if (body.errors?.length) throw new Error(`GraphQL: ${body.errors.map((e) => e.message).join('; ')}`);
  return body.data;
}

async function rest(path) {
  if (!TOKEN) return JSON.parse(gh(['api', path]));
  const res = await fetch(`${API}/${path}`, {
    headers: { authorization: `bearer ${TOKEN}`, accept: 'application/vnd.github+json', 'user-agent': 'event-horizon-stats' },
  });
  if (!res.ok) throw new Error(`REST ${path.split('?')[0]}: HTTP ${res.status}`);
  return res.json();
}

function gh(args) {
  try {
    return execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024 });
  } catch (e) {
    throw new Error(`gh ${args[1] === 'graphql' ? 'api graphql' : `api ${args[1].split('?')[0]}`} failed: ${String(e.stderr || e.message).trim().split('\n')[0]}`);
  }
}

async function repos(login) {
  const all = [];
  let after = null;
  do {
    const page = (await graphql(REPOS_QUERY, { login, after })).user.repositories;
    all.push(...page.nodes);
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);
  return all;
}

const branch = (ref) => String(ref ?? '').replace(/^refs\/(heads|tags)\//, '');

// One line per public event; types without a clear story are skipped.
function describe(e) {
  const repo = e.repo?.name ?? '';
  const repoUrl = `https://github.com/${repo}`;
  const p = e.payload ?? {};
  switch (e.type) {
    case 'PushEvent':
      return { title: `Pushed to ${branch(p.ref) || 'a branch'}`, url: p.head ? `${repoUrl}/commit/${p.head}` : repoUrl };
    case 'CreateEvent':
      if (p.ref_type === 'repository') return { title: 'Created the repository', url: repoUrl };
      return { title: `Created ${p.ref_type} ${p.ref}`, url: p.ref_type === 'tag' ? `${repoUrl}/releases/tag/${p.ref}` : `${repoUrl}/tree/${p.ref}` };
    case 'PullRequestEvent': {
      const pr = p.pull_request ?? {};
      const action = p.action === 'closed' && pr.merged ? 'Merged' : cap(p.action ?? 'updated');
      return { title: `${action} pull request #${p.number ?? pr.number}${pr.title ? `: ${pr.title}` : ''}`, url: pr.html_url || `${repoUrl}/pull/${p.number ?? pr.number}` };
    }
    case 'IssuesEvent': {
      const issue = p.issue ?? {};
      return { title: `${cap(p.action ?? 'updated')} issue #${issue.number}${issue.title ? `: ${issue.title}` : ''}`, url: issue.html_url || repoUrl };
    }
    case 'ReleaseEvent':
      return { title: `Released ${p.release?.name || p.release?.tag_name || 'a new version'}`, url: p.release?.html_url || `${repoUrl}/releases` };
    case 'PublicEvent':
      return { title: 'Made the repository public', url: repoUrl };
    case 'ForkEvent':
      return { title: 'Forked the repository', url: p.forkee?.html_url || repoUrl };
    case 'WatchEvent':
      return { title: 'Starred the repository', url: repoUrl };
    default:
      return null;
  }
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export async function collect(login, now = new Date()) {
  const { user } = await graphql(USER_QUERY, { login });
  if (!user) throw new Error(`user "${login}" not found`);
  const owned = await repos(login);
  const events = await rest(`users/${login}/events/public?per_page=30`);

  const calendar = user.contributionsCollection.contributionCalendar.weeks
    .flatMap((w) => w.contributionDays)
    .map((d) => ({ date: d.date, count: d.contributionCount, level: level(d.contributionLevel) }));

  const bytes = new Map();
  for (const r of owned) for (const { size, node } of r.languages.edges) bytes.set(node.name, (bytes.get(node.name) ?? 0) + size);
  const totalBytes = [...bytes.values()].reduce((a, b) => a + b, 0);
  const languages = [...bytes]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, b]) => ({ name, bytes: b, share: Math.round((b / totalBytes) * 10000) / 10000 }));

  // Candidates for C9 missions: described, by stars, then most recently pushed.
  const topRepos = owned
    .filter((r) => r.description?.trim())
    .sort((a, b) => b.stargazerCount - a.stargazerCount || b.pushedAt.localeCompare(a.pushedAt) || a.name.localeCompare(b.name))
    .slice(0, 10)
    .map((r) => ({ name: r.nameWithOwner, description: r.description.trim(), stars: r.stargazerCount, language: r.primaryLanguage?.name ?? '', url: r.url }));

  const log = [];
  for (const e of events) {
    const d = describe(e);
    if (d) log.push({ type: e.type, repo: e.repo.name, title: d.title, url: d.url, createdAt: e.created_at });
    if (log.length === 5) break;
  }

  const generatedAt = now.toISOString().replace(/\.\d{3}Z$/, 'Z');
  return validate({
    generatedAt,
    user: { login: user.login, name: user.name ?? '', followers: user.followers.totalCount, publicRepos: user.repositories.totalCount },
    totals: {
      stars: owned.reduce((a, r) => a + r.stargazerCount, 0),
      contributionsYear: user.contributionsCollection.contributionCalendar.totalContributions,
      commitsYear: user.contributionsCollection.totalCommitContributions,
      prs: user.pullRequests.totalCount,
      issues: user.issues.totalCount,
    },
    streak: streaks(calendar, generatedAt.slice(0, 10)),
    languages,
    calendar,
    topRepos,
    events: log,
  });
}

async function main() {
  const login = String(parse(readFileSync(join(ROOT, 'profile.yaml'), 'utf8'))?.identity?.github_username ?? '').trim();
  if (!login) throw new Error('profile.yaml: identity.github_username is empty');
  const data = await collect(login);
  const out = join(ROOT, DATA_FILE);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(`${out}.tmp`, `${JSON.stringify(data, null, 2)}\n`);
  renameSync(`${out}.tmp`, out);
  const t = data.totals;
  console.log(`✓ ${DATA_FILE} · ${data.user.login} · ${t.contributionsYear} contributions · ${t.stars} stars · ${data.languages.length} languages · streak ${data.streak.current}/${data.streak.longest} · ${data.events.length} events`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(`fetch: ${e.message}\nfetch: kept the previous ${DATA_FILE}`);
    process.exit(1);
  });
}
