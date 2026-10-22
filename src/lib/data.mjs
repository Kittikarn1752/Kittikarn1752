// Live data (SPEC §4): data/github.json, written by src/data/fetch.mjs.
// Helpers here are pure apart from loadData and loadGame, so fetch and build share them.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { EMPTY, STATE_FILE, validateState } from '../game/feed.mjs';

export const DATA_FILE = 'data/github.json';
export const FIXTURE_FILE = 'data/github.fixture.json';

const LEVELS = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

// GraphQL contributionLevel enum → 0–4.
export const level = (name) => LEVELS[name] ?? 0;

const day = (iso) => Date.parse(`${iso}T00:00:00Z`) / 86400000;

/**
 * Streaks from the calendar, in UTC days. The current streak counts back from
 * `today`; when today has no contributions yet, it counts back from yesterday,
 * so a streak doesn't break before the day is over.
 */
export function streaks(calendar, today) {
  const active = new Set(calendar.filter((d) => d.count > 0).map((d) => day(d.date)));
  let longest = 0;
  let run = 0;
  let prev = null;
  for (const d of [...active].sort((a, b) => a - b)) {
    run = prev !== null && d === prev + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  let cursor = day(today);
  if (!active.has(cursor)) cursor--;
  let current = 0;
  while (active.has(cursor)) {
    current++;
    cursor--;
  }
  return { current, longest };
}

// Throws on anything a component can't render, so a bad fetch never replaces good data.
export function validate(data) {
  const errors = [];
  const int = (v) => Number.isInteger(v) && v >= 0;
  if (!data?.generatedAt || Number.isNaN(Date.parse(data.generatedAt))) errors.push('generatedAt is not a date');
  if (!data?.user?.login) errors.push('user.login is empty');
  for (const k of ['followers', 'publicRepos']) if (!int(data?.user?.[k])) errors.push(`user.${k} is not a count`);
  for (const k of ['stars', 'contributionsYear', 'commitsYear', 'prs', 'issues']) if (!int(data?.totals?.[k])) errors.push(`totals.${k} is not a count`);
  for (const k of ['current', 'longest']) if (!int(data?.streak?.[k])) errors.push(`streak.${k} is not a count`);
  const cal = data?.calendar;
  if (!Array.isArray(cal) || cal.length < 365 || cal.length > 371) errors.push(`calendar has ${cal?.length} days (want 365–371)`);
  else if (cal.some((d) => !/^\d{4}-\d{2}-\d{2}$/.test(d.date) || !int(d.count) || !int(d.level) || d.level > 4)) errors.push('calendar has a malformed day');
  for (const k of ['languages', 'topRepos', 'events']) if (!Array.isArray(data?.[k])) errors.push(`${k} is not a list`);
  if (errors.length) throw new Error(`github.json:\n- ${errors.join('\n- ')}`);
  return data;
}

// The committed data, else the fixture (offline builds), else null.
export function loadData(root) {
  for (const file of [DATA_FILE, FIXTURE_FILE]) {
    const path = join(root, file);
    if (existsSync(path)) return { ...validate(JSON.parse(readFileSync(path, 'utf8'))), source: file };
  }
  return null;
}

// Game state (SPEC §5) plus cached avatars as data URIs, keyed by user id.
// No data/blackhole.json yet means nothing has been fed.
export const AVATAR_DIR = 'data/avatars';
const MIME = { png: 'image/png', jpg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' };

export function loadGame(root) {
  const file = join(root, STATE_FILE);
  const state = existsSync(file) ? validateState(JSON.parse(readFileSync(file, 'utf8'))) : EMPTY;
  const avatars = {};
  const dir = join(root, AVATAR_DIR);
  if (existsSync(dir)) {
    for (const name of readdirSync(dir).sort()) {
      const m = name.match(/^(\d+)\.(png|jpg|gif|webp)$/);
      if (m) avatars[m[1]] = `data:${MIME[m[2]]};base64,${readFileSync(join(dir, name)).toString('base64')}`;
    }
  }
  return { state, avatars };
}
