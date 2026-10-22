// Feed the Black Hole (SPEC §5): pure game logic, no I/O. src/game/run.mjs
// does the GitHub side; this file decides what every issue means.
//
// data/blackhole.json:
//   { "mass": 0, "entries": [{ "issue": 1, "login": "", "id": 0, "at": "ISO" }] }
// `mass` counts every accepted feed; `entries` keeps the newest RULES.keep,
// newest first. Time always comes from the issue's created_at, so a queued or
// re-run job reaches the same verdict as a prompt one.

export const RULES = { cooldownMs: 3600_000, hourlyCap: 30, keep: 50, travelers: 8 };
export const TITLE = 'feed|star';
export const STATE_FILE = 'data/blackhole.json';
export const EMPTY = Object.freeze({ mass: 0, entries: Object.freeze([]) });

const LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const time = (iso) => Date.parse(iso);
const same = (a, b) => a.toLowerCase() === b.toLowerCase();

// "feed|star" in any case, with optional spaces around the bar.
export const parseTitle = (title) => (/^\s*feed\s*\|\s*star\s*$/i.test(String(title ?? '')) ? 'star' : null);

// The workflow only wakes for titles that start with "feed|" (case-insensitive).
export const isGameTitle = (title) => /^feed\|/i.test(String(title ?? '').trimStart());

export const isBot = (user) => user?.type === 'Bot' || /\[bot\]$/i.test(user?.login ?? '');

// Throws on anything the renderer can't trust, so a bad state never ships.
export function validateState(state) {
  const errors = [];
  if (!Number.isInteger(state?.mass) || state.mass < 0) errors.push('mass is not a count');
  if (!Array.isArray(state?.entries)) errors.push('entries is not a list');
  else {
    if (state.entries.length > RULES.keep) errors.push(`entries has ${state.entries.length} items (max ${RULES.keep})`);
    if (state.entries.length > state.mass) errors.push('more entries than mass');
    for (const e of state.entries) {
      if (!Number.isInteger(e?.issue) || !LOGIN.test(e?.login ?? '') || !Number.isInteger(e?.id) || Number.isNaN(time(e?.at))) {
        errors.push(`malformed entry ${JSON.stringify(e)}`);
        break;
      }
    }
  }
  if (errors.length) throw new Error(`blackhole.json:\n- ${errors.join('\n- ')}`);
  return state;
}

/**
 * One issue against the current state. Verdicts:
 *   ignored    bot author: no reply, issue left alone
 *   duplicate  this issue already fed the hole (a re-run): just close it
 *   bad-title  starts with "feed|" but isn't "feed|star"
 *   cooldown   this user fed within the last hour        (retryAt)
 *   busy       RULES.hourlyCap feeds in the last hour   (retryAt)
 *   fed        accepted
 */
export function decide(state, issue) {
  const user = issue.user ?? {};
  if (isBot(user)) return { verdict: 'ignored' };
  if (state.entries.some((e) => e.issue === issue.number)) return { verdict: 'duplicate' };
  if (!parseTitle(issue.title)) return { verdict: 'bad-title' };
  if (!LOGIN.test(user.login ?? '')) return { verdict: 'ignored' };
  const t = time(issue.createdAt);
  const recent = state.entries.filter((e) => time(e.at) > t - RULES.cooldownMs && time(e.at) <= t);
  const mine = recent.find((e) => same(e.login, user.login));
  if (mine) return { verdict: 'cooldown', retryAt: new Date(time(mine.at) + RULES.cooldownMs).toISOString() };
  if (recent.length >= RULES.hourlyCap) {
    const oldest = Math.min(...recent.map((e) => time(e.at)));
    return { verdict: 'busy', retryAt: new Date(oldest + RULES.cooldownMs).toISOString() };
  }
  return { verdict: 'fed' };
}

export function feed(state, issue) {
  const entry = { issue: issue.number, login: issue.user.login, id: issue.user.id, at: new Date(time(issue.createdAt)).toISOString() };
  return { mass: state.mass + 1, entries: [entry, ...state.entries].slice(0, RULES.keep) };
}

/**
 * A batch of open issues, oldest first (created_at, then number). Returns the
 * new state and one result per issue, with the mass right after it.
 */
export function play(state, issues) {
  const order = [...issues].sort((a, b) => time(a.createdAt) - time(b.createdAt) || a.number - b.number);
  const results = [];
  let s = state;
  for (const issue of order) {
    const d = decide(s, issue);
    if (d.verdict === 'fed') s = feed(s, issue);
    results.push({ number: issue.number, login: issue.user?.login ?? '', ...d, mass: s.mass });
  }
  return { state: s, results };
}

// The newest distinct travelers, newest first.
export function travelers(state, n = RULES.travelers) {
  const seen = new Set();
  const out = [];
  for (const e of state.entries) {
    const key = e.login.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
    if (out.length === n) break;
  }
  return out;
}

// Copy approved 2026-10-22. The README button opens a prefilled issue.
export const ISSUE_BODY =
  'Press **Submit new issue** to throw a star into the black hole. A bot adds it within a minute or two, replies here and closes the issue. Your @handle and avatar will appear on this profile. One star per person per hour.';
export const feedUrl = (user) => `https://github.com/${user}/${user}/issues/new?title=${encodeURIComponent(TITLE)}&body=${encodeURIComponent(ISSUE_BODY)}`;

const utc = (iso) => `${iso.slice(11, 16)} UTC`;

// The bot's comment for one result; null means close without a comment.
export function reply(result) {
  switch (result.verdict) {
    case 'fed':
      return `☄️ Your star crossed the event horizon. The black hole has now devoured **${result.mass} ${result.mass === 1 ? 'star' : 'stars'}**, and you're the latest traveler on the profile (the image can take a few minutes to refresh).`;
    case 'cooldown':
      return `🌌 The black hole is still digesting your last star. Feed it again after **${utc(result.retryAt)}**.`;
    case 'busy':
      return `🌌 The black hole has had ${RULES.hourlyCap} stars this hour and needs a break. Try again after **${utc(result.retryAt)}**.`;
    case 'bad-title':
      return `🛰️ This title doesn't match the game. To feed the black hole, open an issue titled exactly \`${TITLE}\`, or use the button on the profile.`;
    default:
      return null;
  }
}

// How each verdict closes its issue; ignored issues stay open and untouched.
export const closeReason = (verdict) => ({ fed: 'completed', duplicate: 'completed', cooldown: 'not_planned', busy: 'not_planned', 'bad-title': 'not_planned' })[verdict] ?? null;

// r = r0 + k·log10(1 + mass), capped so the hole always fits its panel.
export const radius = (mass, { r0, k, rMax }) => Math.min(rMax, r0 + k * Math.log10(1 + mass));

// 0 → 1 as the hole approaches rMax: drives glow strength.
export const growth = (mass, g) => (radius(mass, g) - g.r0) / (g.rMax - g.r0);
