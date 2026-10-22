// Dry-run tests for the game rules (SPEC §5). Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY, RULES, closeReason, feedUrl, growth, isGameTitle, parseTitle, play, radius, reply, travelers, validateState } from './feed.mjs';

const T0 = Date.parse('2026-10-22T10:00:00Z');
const at = (min) => new Date(T0 + min * 60_000).toISOString();
let next = 1;
const issue = (login, min, title = 'feed|star', extra = {}) => ({ number: next++, title, createdAt: at(min), user: { login, id: login.length * 1000 + login.charCodeAt(0), type: 'User' }, ...extra });
const verdicts = (r) => r.results.map((x) => x.verdict);

test('titles: only feed|star counts, case and spaces forgiven', () => {
  for (const t of ['feed|star', 'FEED|STAR', ' Feed | Star ', 'feed |star']) assert.equal(parseTitle(t), 'star', t);
  for (const t of ['feed|', 'feed|planet', 'feed|star!', 'feed|star star', 'feedstar', 'star', '', null]) assert.equal(parseTitle(t), null, String(t));
  assert.equal(isGameTitle('feed|planet'), true);
  assert.equal(isGameTitle('Feed|x'), true);
  assert.equal(isGameTitle('Bug: feed|star broken'), false);
});

test('first feed is accepted and recorded', () => {
  const r = play(EMPTY, [issue('alice', 0)]);
  assert.deepEqual(verdicts(r), ['fed']);
  assert.equal(r.state.mass, 1);
  assert.equal(r.state.entries[0].login, 'alice');
  assert.equal(r.state.entries[0].at, at(0));
  validateState(r.state);
});

test('cooldown: one feed per user per hour, case-insensitive', () => {
  const r = play(EMPTY, [issue('alice', 0), issue('Alice', 59), issue('alice', 60)]);
  assert.deepEqual(verdicts(r), ['fed', 'cooldown', 'fed']);
  assert.equal(r.results[1].retryAt, at(60));
  assert.equal(r.state.mass, 2);
});

test('rejected attempts do not extend the cooldown', () => {
  const r = play(EMPTY, [issue('bob', 0), issue('bob', 30), issue('bob', 61)]);
  assert.deepEqual(verdicts(r), ['fed', 'cooldown', 'fed']);
});

test('global cap: at most 30 feeds per rolling hour', () => {
  const crowd = Array.from({ length: RULES.hourlyCap + 2 }, (_, i) => issue(`user${i}`, i));
  const r = play(EMPTY, crowd);
  assert.equal(r.results.filter((x) => x.verdict === 'fed').length, RULES.hourlyCap);
  assert.deepEqual(verdicts(r).slice(-2), ['busy', 'busy']);
  assert.equal(r.results.at(-1).retryAt, at(60));
  // Once the first feed leaves the window, there is room again.
  const later = play(r.state, [issue('late', 60)]);
  assert.deepEqual(verdicts(later), ['fed']);
});

test('bots are ignored and never change the state', () => {
  const r = play(EMPTY, [issue('dependabot[bot]', 0), issue('helper', 1, 'feed|star', { user: { login: 'helper', id: 9, type: 'Bot' } })]);
  assert.deepEqual(verdicts(r), ['ignored', 'ignored']);
  assert.equal(r.state, EMPTY);
});

test('bad titles are rejected without feeding', () => {
  const r = play(EMPTY, [issue('carol', 0, 'feed|planet'), issue('carol', 1)]);
  assert.deepEqual(verdicts(r), ['bad-title', 'fed']);
});

test('re-running the same issue never counts twice', () => {
  const first = issue('dave', 0);
  const once = play(EMPTY, [first]);
  const twice = play(once.state, [first]);
  assert.deepEqual(verdicts(twice), ['duplicate']);
  assert.equal(twice.state.mass, 1);
});

test('issues are played oldest first, whatever order the API returns', () => {
  const a = issue('erin', 5);
  const b = issue('erin', 0);
  const r = play(EMPTY, [a, b]);
  assert.deepEqual(r.results.map((x) => [x.number, x.verdict]), [[b.number, 'fed'], [a.number, 'cooldown']]);
});

test('keeps the last 50 entries while mass keeps counting', () => {
  let s = EMPTY;
  for (let i = 0; i < 60; i++) s = play(s, [issue(`u${i}`, i * 61)]).state;
  assert.equal(s.mass, 60);
  assert.equal(s.entries.length, RULES.keep);
  assert.equal(s.entries[0].login, 'u59');
  validateState(s);
});

test('travelers: the last 8 distinct users, newest first', () => {
  let s = EMPTY;
  for (const [i, who] of ['a', 'b', 'a', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'b'].entries()) s = play(s, [issue(who, i * 61)]).state;
  assert.deepEqual(travelers(s).map((e) => e.login), ['b', 'i', 'h', 'g', 'f', 'e', 'd', 'c']);
});

test('radius grows with log10(1 + mass) and is capped', () => {
  const g = { r0: 20, k: 12, rMax: 60 };
  assert.equal(radius(0, g), 20);
  assert.equal(radius(9, g), 32);
  assert.equal(radius(99, g), 44);
  assert.equal(radius(1e9, g), 60);
  assert.equal(growth(0, g), 0);
  assert.equal(growth(1e9, g), 1);
});

test('validateState rejects malformed data', () => {
  assert.throws(() => validateState({ mass: -1, entries: [] }));
  assert.throws(() => validateState({ mass: 1, entries: [{ issue: 1, login: 'bad login', id: 1, at: at(0) }] }));
  assert.throws(() => validateState({ mass: 0, entries: [{ issue: 1, login: 'a', id: 1, at: at(0) }] }));
  validateState(EMPTY);
});

test('replies: every verdict gets the right comment and close reason', () => {
  const r = play(EMPTY, [issue('fran', 0), issue('fran', 10), issue('fran', 11, 'feed|moon'), issue('bot[bot]', 12)]);
  const [fed, cool, bad, bot] = r.results;
  assert.match(reply(fed), /devoured \*\*1 star\*\*/);
  assert.match(reply(cool), /after \*\*11:00 UTC\*\*/);
  assert.match(reply(bad), /`feed\|star`/);
  assert.equal(reply(bot), null);
  assert.deepEqual([fed, cool, bad, bot].map((x) => closeReason(x.verdict)), ['completed', 'not_planned', 'not_planned', null]);
  assert.equal(reply({ verdict: 'duplicate' }), null);
});

test('feedUrl opens a prefilled feed|star issue on the profile repo', () => {
  const url = new URL(feedUrl('Someone'));
  assert.equal(url.pathname, '/Someone/Someone/issues/new');
  assert.equal(url.searchParams.get('title'), 'feed|star');
  assert.match(url.href, /title=feed%7Cstar&body=/);
});
