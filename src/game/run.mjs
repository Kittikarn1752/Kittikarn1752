// Feed the Black Hole, the GitHub side (SPEC §5). Rules live in feed.mjs.
//   node src/game/run.mjs                        CI: play every open feed| issue (oldest first), update
//                                                data/blackhole.json + avatars, rebuild, save the replies
//   node src/game/run.mjs --reply                CI: post the saved replies (comment, label, close)
//   node src/game/run.mjs --dry-run --issues f   local: play issues from a JSON file, print, write nothing
// Every run sweeps all open game issues, so one that a cancelled run missed is
// picked up by the next. Issue titles and bodies never reach a shell; logins
// are checked against GitHub's login format before they are used anywhere.
// Env (CI): GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_EVENT_PATH, RUNNER_TEMP, GITHUB_OUTPUT.
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { AVATAR_DIR, loadGame } from '../lib/data.mjs';
import { STATE_FILE, closeReason, isGameTitle, play, reply, travelers } from './feed.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const API = 'https://api.github.com';
const TOKEN = process.env.GITHUB_TOKEN || '';
const REPO = process.env.GITHUB_REPOSITORY || '';
const TEMP = process.env.RUNNER_TEMP || join(ROOT, 'tmp');
const REPLIES = join(TEMP, 'feed-replies.json');
const MESSAGE = join(TEMP, 'feed-message.txt');
const LABEL = 'blackhole';

async function api(method, path, body) {
  const res = await fetch(`${API}/${path}`, {
    method,
    headers: { authorization: `bearer ${TOKEN}`, accept: 'application/vnd.github+json', 'user-agent': 'event-horizon-game', ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path.split('?')[0]}: HTTP ${res.status}`);
  return res.status === 204 ? null : res.json();
}

const toIssue = (i) => ({ number: i.number, title: i.title, createdAt: i.created_at, user: { login: i.user?.login ?? '', id: i.user?.id ?? 0, type: i.user?.type ?? '' } });

// Open game issues, plus the one that triggered this run (the list can lag behind).
async function openIssues() {
  const found = new Map();
  for (let page = 1; page <= 10; page++) {
    const batch = await api('GET', `repos/${REPO}/issues?state=open&sort=created&direction=asc&per_page=100&page=${page}`);
    for (const i of batch) if (!i.pull_request && isGameTitle(i.title)) found.set(i.number, toIssue(i));
    if (batch.length < 100) break;
  }
  const event = process.env.GITHUB_EVENT_PATH && existsSync(process.env.GITHUB_EVENT_PATH) ? JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')) : {};
  const own = event.issue;
  if (own && own.state === 'open' && !own.pull_request && isGameTitle(own.title) && !found.has(own.number)) found.set(own.number, toIssue(own));
  return [...found.values()];
}

const EXT = [
  ['png', [0x89, 0x50, 0x4e, 0x47]],
  ['jpg', [0xff, 0xd8, 0xff]],
  ['gif', [0x47, 0x49, 0x46]],
  ['webp', [0x52, 0x49, 0x46, 0x46]],
];

// Cache the travelers' avatars (public, no token sent) and drop everyone else's.
async function syncAvatars(state, px) {
  const dir = join(ROOT, AVATAR_DIR);
  mkdirSync(dir, { recursive: true });
  const keep = new Set(travelers(state).map((e) => String(e.id)));
  const have = new Set();
  for (const name of readdirSync(dir)) {
    const id = name.split('.')[0];
    if (keep.has(id)) have.add(id);
    else unlinkSync(join(dir, name));
  }
  for (const id of keep) {
    if (have.has(id)) continue;
    try {
      const res = await fetch(`https://avatars.githubusercontent.com/u/${id}?s=${px}&v=4`, { headers: { 'user-agent': 'event-horizon-game' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 64 * 1024) throw new Error(`${buf.length} bytes`);
      const ext = EXT.find(([, sig]) => sig.every((b, i) => buf[i] === b))?.[0];
      if (!ext) throw new Error('unknown image type');
      writeFileSync(join(dir, `${id}.${ext}`), buf);
    } catch (e) {
      console.log(`! avatar ${id}: ${e.message}; the panel shows an initial instead`);
    }
  }
}

function summary(results) {
  for (const r of results) console.log(`#${r.number} @${r.login || '?'} → ${r.verdict}${r.retryAt ? ` (retry ${r.retryAt})` : ''}`);
}

async function main(args) {
  const tokens = JSON.parse(readFileSync(join(ROOT, 'design/tokens.json'), 'utf8'));
  const { state } = loadGame(ROOT);

  if (args.includes('--dry-run')) {
    const file = args[args.indexOf('--issues') + 1];
    const out = play(state, JSON.parse(readFileSync(file, 'utf8')));
    summary(out.results);
    console.log(`mass ${state.mass} → ${out.state.mass} (dry run, nothing written)`);
    return;
  }
  if (!TOKEN || !REPO) throw new Error('GITHUB_TOKEN and GITHUB_REPOSITORY are required (use --dry-run locally)');

  if (args.includes('--reply')) {
    let failed = 0;
    for (const r of existsSync(REPLIES) ? JSON.parse(readFileSync(REPLIES, 'utf8')) : []) {
      try {
        if (r.body) await api('POST', `repos/${REPO}/issues/${r.number}/comments`, { body: r.body });
        await api('POST', `repos/${REPO}/issues/${r.number}/labels`, { labels: [LABEL] });
        await api('PATCH', `repos/${REPO}/issues/${r.number}`, { state: 'closed', state_reason: r.reason });
        console.log(`✓ #${r.number} ${r.reason}`);
      } catch (e) {
        failed++;
        console.log(`✗ #${r.number}: ${e.message}`);
      }
    }
    if (failed) throw new Error(`${failed} issue(s) not answered; the next run sweeps them again`);
    return;
  }

  const out = play(state, await openIssues());
  summary(out.results);
  mkdirSync(TEMP, { recursive: true });
  const replies = out.results.filter((r) => closeReason(r.verdict)).map((r) => ({ number: r.number, body: reply(r), reason: closeReason(r.verdict) }));
  writeFileSync(REPLIES, JSON.stringify(replies));

  const changed = out.state !== state;
  if (changed) {
    const path = join(ROOT, STATE_FILE);
    writeFileSync(`${path}.tmp`, `${JSON.stringify(out.state, null, 2)}\n`);
    renameSync(`${path}.tmp`, path);
    await syncAvatars(out.state, tokens.game.avatarPx);
    if (spawnSync(process.execPath, [join(ROOT, 'src/build.mjs')], { stdio: 'inherit' }).status !== 0) throw new Error('build failed');
    const fed = [...new Set(out.results.filter((r) => r.verdict === 'fed').map((r) => `@${r.login}`))];
    writeFileSync(MESSAGE, `chore(game): fed by ${fed.join(', ')} · mass ${out.state.mass} [skip ci]\n`);
  }
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
  console.log(`mass ${state.mass} → ${out.state.mass} · ${replies.length} repl${replies.length === 1 ? 'y' : 'ies'} queued`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((e) => {
    console.error(`game: ${e.message}`);
    process.exit(1);
  });
}
