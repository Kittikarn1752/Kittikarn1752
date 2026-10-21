#!/usr/bin/env node
// GitHub-safety validator for the profile README and the generated SVG assets.
//   CLI   node tools/check.mjs [--publish] [--root <dir>]
//         Prints every finding; exits 1 when there are errors.
//   Hook  node tools/check.mjs --hook
//         PostToolUse hook: reads the tool call JSON from stdin and checks only the edited
//         file. Errors go to stderr with exit 2 (Claude sees them); otherwise exits 0 silently.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const value = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};

const ROOT = resolve(value('--root') ?? join(dirname(fileURLToPath(import.meta.url)), '..'));
const rel = (p) => relative(ROOT, p).split(sep).join('/');

const BUDGET = { svgKB: 300, heroKB: 700, readmeTotalKB: 3000, ...readTokens().budget };

// Hosted image services that rate-limit or go down; this project generates its own images.
const HOTLINK = /github-readme-stats|readme-typing-svg|streak-stats|github-profile-trophy|capsule-render|komarev\.com|herokuapp\.com|vercel\.app\/api/i;
// Mustache-style {{ var }} only: plain "}}" is everywhere in SVG CSS (@keyframes a{to{…}}).
const PLACEHOLDER = /\{\{\s*[\w.$-]+\s*\}\}|\bTODO\b|\bTBD\b|lorem ipsum|←\s*FILL/i;
const SECRET = /gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{50,}|-----BEGIN [A-Z ]*PRIVATE KEY-----/;
const SKIP_DIRS = new Set(['node_modules', '.git', 'site', '.cache', 'tmp', 'preview']);

function readTokens() {
  try {
    return JSON.parse(readFileSync(join(ROOT, 'design', 'tokens.json'), 'utf8'));
  } catch {
    return {};
  }
}

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

function safeDecode(url) {
  try {
    return decodeURI(url);
  } catch {
    return url;
  }
}

function checkSvg(file, out) {
  const src = readFileSync(file, 'utf8');
  const name = rel(file);
  const err = (msg) => out.push(['E', name, msg]);
  const warn = (msg) => out.push(['W', name, msg]);

  if (/<script\b/i.test(src)) err('<script> is blocked in SVG images');
  if (/<[^>]*\son[a-z]+\s*=/i.test(src)) err('event-handler attribute (on*=) is not allowed');
  if (/javascript:/i.test(src)) err('javascript: URL');
  if (/(?:xlink:)?href\s*=\s*["']\s*(?:https?:)?\/\//i.test(src)) err('external href: inline it as a data: URI or remove it');
  if (/url\(\s*["']?\s*(?:https?:)?\/\//i.test(src)) err('external url(): fonts and images must be embedded');
  if (/@import\b/i.test(src)) err('@import: external CSS never loads in an <img> SVG');

  const kb = statSync(file).size / 1024;
  const limit = name.includes('/hero/') ? BUDGET.heroKB : BUDGET.svgKB;
  if (kb > limit) err(`${kb.toFixed(0)} KB is over the ${limit} KB budget`);

  if (!/\bviewBox\s*=/.test(src)) warn('missing viewBox, so it will not scale cleanly');
  if (!/<title[\s>]/i.test(src)) warn('missing <title> (accessibility)');
  if (/@keyframes|<animate|<set\b/i.test(src) && !/prefers-reduced-motion/i.test(src)) warn('animated without a prefers-reduced-motion rule');
  if (/<foreignObject/i.test(src)) warn('<foreignObject> renders inconsistently (Safari); prefer pure SVG');
  if (/<text\b/i.test(src) && !/@font-face/i.test(src)) warn('<text> without an embedded font: convert to paths or embed a subset');
  if (/<animate\b[^>]*attributeName\s*=\s*["'](?:baseFrequency|stdDeviation|scale)["']/i.test(src)) warn('animated filter parameter is CPU-heavy');
  if (PLACEHOLDER.test(src)) warn('placeholder-like text');
}

function checkReadme(file, out) {
  const name = rel(file);
  const err = (msg) => out.push(['E', name, msg]);
  const warn = (msg) => out.push(['W', name, msg]);
  // Comments hold markers like <!-- LOG:START -->, so leave them out of content checks.
  const body = readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');

  for (const tag of ['script', 'style', 'iframe', 'form']) {
    if (new RegExp(`<${tag}\\b`, 'i').test(body)) err(`<${tag}> is stripped by GitHub`);
  }
  if (/<[a-z][^>]*\sstyle\s*=/i.test(body)) warn('style= is stripped by GitHub');
  if (/<[a-z][^>]*\sclass\s*=/i.test(body)) warn('class= is stripped by GitHub');
  if (PLACEHOLDER.test(body)) err('placeholder text (TODO / {{…}} / FILL): omit empty data instead');

  for (const [tag] of body.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\salt\s*=/i.test(tag)) err(`<img> without alt: ${tag.slice(0, 90)}`);
    if (HOTLINK.test(tag)) warn(`hotlinked image service, self-host instead: ${tag.slice(0, 90)}`);
  }
  for (const [block] of body.matchAll(/<picture\b[\s\S]*?<\/picture>/gi)) {
    if (!/<img\b/i.test(block)) err('<picture> without an <img> fallback');
  }

  const urls = [
    ...[...body.matchAll(/\b(?:src|srcset)\s*=\s*["']([^"']+)["']/gi)].flatMap(([, v]) => v.split(',').map((s) => s.trim().split(/\s+/)[0])),
    ...[...body.matchAll(/!\[[^\]]*\]\(\s*([^)\s]+)/g)].map(([, v]) => v),
  ];
  const seen = new Set();
  let totalKB = 0;
  for (const url of urls) {
    if (!url || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url)) continue; // http(s):, data:, mailto:, anchors
    const path = resolve(dirname(file), safeDecode(url.split(/[?#]/)[0]));
    if (!existsSync(path)) {
      err(`missing local image: ${url}`);
    } else if (!seen.has(path)) {
      seen.add(path);
      totalKB += statSync(path).size / 1024;
    }
  }
  if (totalKB > BUDGET.readmeTotalKB) warn(`local images total ${totalKB.toFixed(0)} KB, over the ${BUDGET.readmeTotalKB} KB budget`);
}

function checkPublish(out) {
  if (!existsSync(join(ROOT, 'README.md'))) out.push(['E', 'README.md', 'missing: run the build first']);
  const yamlPath = join(ROOT, 'profile.yaml');
  if (!existsSync(yamlPath)) {
    out.push(['E', 'profile.yaml', 'missing']);
  } else {
    const login = readFileSync(yamlPath, 'utf8').match(/^\s*github_username:\s*["']?([A-Za-z0-9-]*)/m)?.[1];
    if (!login) out.push(['E', 'profile.yaml', 'identity.github_username is empty']);
  }
  for (const file of walk(ROOT)) {
    if (statSync(file).size > 2 * 1024 * 1024) continue;
    if (SECRET.test(readFileSync(file, 'utf8'))) out.push(['E', rel(file), 'looks like a token or private key: remove it before publishing']);
  }
}

async function runHook() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  let target;
  try {
    target = JSON.parse(input)?.tool_input?.file_path;
  } catch {
    return 0;
  }
  if (!target) return 0;
  const file = resolve(target);
  const name = rel(file);
  if (name.startsWith('..') || isAbsolute(name) || !existsSync(file)) return 0;

  const out = [];
  if (/\.svg$/i.test(name) && !name.startsWith('site/')) checkSvg(file, out);
  else if (name === 'README.md') checkReadme(file, out);
  else return 0;

  const errors = out.filter(([level]) => level === 'E');
  if (!errors.length) return 0;
  process.stderr.write(
    `check: ${errors.length} error(s) in ${name}\n` +
      errors.map(([, , msg]) => `- ${msg}`).join('\n') +
      '\nFix the generator in src/ (assets and README.md are generated), rebuild, then run `npm run check`.\n',
  );
  return 2;
}

if (has('--hook')) process.exit(await runHook());

const out = [];
const assets = join(ROOT, 'assets');
let svgCount = 0;
if (existsSync(assets)) {
  for (const file of walk(assets)) {
    if (!/\.svg$/i.test(file)) continue;
    svgCount++;
    checkSvg(file, out);
  }
}
const readme = join(ROOT, 'README.md');
const readmeExists = existsSync(readme);
if (readmeExists) checkReadme(readme, out);
if (has('--publish')) checkPublish(out);

for (const [level, name, msg] of out) console.log(`${level} ${name}: ${msg}`);
const errors = out.filter(([level]) => level === 'E').length;
console.log(`check: ${errors} error(s), ${out.length - errors} warning(s) · ${svgCount} SVG · README ${readmeExists ? 'checked' : 'not built yet'}`);
process.exit(errors ? 1 : 0);
