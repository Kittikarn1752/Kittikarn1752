// Build: profile.yaml + design/tokens.json → assets/**/*.svg + README.md.
//   npm run build                       full build
//   npm run build -- --only hero,cards  only these components (README is always rebuilt)
// Components are pure; this file does all the I/O, runs SVGO and reports each
// file against its budget.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadProfile } from './lib/profile.mjs';
import { loadFonts } from './lib/text.mjs';
import { countAnimated, optimizeSvg } from './lib/optimize.mjs';
import { renderReadme } from './readme/render.mjs';
import hero from './components/hero.mjs';
import orbit from './components/orbit.mjs';
import cards from './components/cards.mjs';
import stack from './components/stack.mjs';
import headers from './components/headers.mjs';
import buttons from './components/buttons.mjs';
import footer from './components/footer.mjs';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const COMPONENTS = { hero, orbit, cards, stack, headers, buttons, footer };

export function context() {
  const tokens = JSON.parse(readFileSync(join(ROOT, 'design/tokens.json'), 'utf8'));
  const profile = loadProfile(join(ROOT, 'profile.yaml'), tokens);
  const fonts = loadFonts(join(ROOT, 'design/fonts'));
  const data = { year: new Date().getUTCFullYear() };
  return { profile, tokens, fonts, data };
}

// Renders and optimizes; returns [{ path, svg, kb, animated, budgetKB }].
export function renderComponents(ctx, names = Object.keys(COMPONENTS), variant = {}) {
  const out = [];
  for (const name of names) {
    const component = COMPONENTS[name];
    if (!component) throw new Error(`unknown component "${name}" (have: ${Object.keys(COMPONENTS).join(', ')})`);
    for (const file of component({ ...ctx, variant: variant[name] }).files) {
      const svg = optimizeSvg(file.svg);
      if (/NaN|undefined/.test(svg)) throw new Error(`${file.path}: generated SVG contains NaN/undefined`);
      out.push({
        path: file.path,
        svg,
        kb: Buffer.byteLength(svg) / 1024,
        animated: countAnimated(svg),
        budgetKB: file.path.includes('/hero/') ? ctx.tokens.budget.heroKB : ctx.tokens.budget.svgKB,
      });
    }
  }
  return out;
}

function writeIfChanged(path, content) {
  if (existsSync(path) && readFileSync(path, 'utf8') === content) return false;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  return true;
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

function main(args) {
  const onlyIdx = args.indexOf('--only');
  const names = onlyIdx >= 0 ? args[onlyIdx + 1].split(',').map((s) => s.trim()) : Object.keys(COMPONENTS);
  const ctx = context();
  const files = renderComponents(ctx, names);
  const maxAnimated = ctx.tokens.budget.animatedNodesPerSvg;
  let problems = 0;

  for (const f of files) {
    const changed = writeIfChanged(join(ROOT, f.path), f.svg);
    const over = f.kb > f.budgetKB || f.animated > maxAnimated;
    if (over) problems++;
    console.log(`${over ? '✗' : '✓'} ${f.path.padEnd(34)} ${f.kb.toFixed(1).padStart(6)} / ${f.budgetKB} KB  anim ${String(f.animated).padStart(2)} / ${maxAnimated}${changed ? '' : '  (unchanged)'}`);
  }

  // Generated assets that no component produced any more (full builds only).
  if (onlyIdx < 0 && existsSync(join(ROOT, 'assets'))) {
    const produced = new Set(files.map((f) => f.path));
    for (const p of walk(join(ROOT, 'assets'))) {
      const rel = relative(ROOT, p).split(sep).join('/');
      if (!produced.has(rel)) console.log(`! stray file not produced by this build: ${rel}`);
    }
  }

  const template = join(ROOT, 'src/readme/template.md');
  if (existsSync(template)) {
    const readme = renderReadme({ template: readFileSync(template, 'utf8'), ...ctx });
    const changed = writeIfChanged(join(ROOT, 'README.md'), readme);
    console.log(`✓ README.md${changed ? '' : '  (unchanged)'}`);
  }
  if (problems) {
    console.error(`build: ${problems} file(s) over budget`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2));
