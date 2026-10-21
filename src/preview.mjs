// GitHub-like preview of README.md at http://localhost:4173.
// Renders through GitHub's Markdown API (`gh api -X POST /markdown`, render only)
// so sanitization matches github.com, and falls back to marked when offline.
// Other files under the repo (assets/, tmp/) are served as-is.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';
import { marked } from 'marked';
import { ROOT } from './build.mjs';

const PORT = 4173;
const TYPES = { '.svg': 'image/svg+xml', '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.css': 'text/css', '.json': 'application/json', '.md': 'text/plain; charset=utf-8' };
const user = readFileSync(join(ROOT, 'profile.yaml'), 'utf8').match(/^\s*github_username:\s*["']?([A-Za-z0-9-]+)/m)?.[1] ?? '';
const css = readFileSync(join(ROOT, 'node_modules/github-markdown-css/github-markdown.css'), 'utf8');

let cache = { mtime: 0, html: '', source: '' };

function render() {
  const file = join(ROOT, 'README.md');
  if (!existsSync(file)) return { html: '<p>README.md is not built yet. Run <code>npm run build</code>.</p>', source: 'none' };
  const mtime = statSync(file).mtimeMs;
  if (cache.mtime === mtime) return cache;
  let html;
  let source;
  try {
    html = execFileSync('gh', ['api', '-X', 'POST', '/markdown', '-f', 'mode=gfm', '-f', `context=${user}/${user}`, '-F', 'text=@README.md'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    source = 'GitHub Markdown API';
  } catch {
    html = marked.parse(readFileSync(file, 'utf8'));
    source = 'offline (marked, not sanitized like GitHub)';
  }
  // Absolute repo URLs back to local paths, so the preview shows the working tree.
  html = html.replace(new RegExp(`https://github\\.com/${user}/${user}/(?:raw|blob)/[^/"]+/`, 'gi'), '/');
  cache = { mtime, html, source };
  return cache;
}

function page({ html, source }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>README preview · ${user}</title>
<style>${css}
body{margin:0;background:#fff;color:#1f2328}
.wrap{box-sizing:border-box;max-width:928px;margin:0 auto;padding:24px 16px}
.box{border:1px solid #d0d7de;border-radius:6px}
.bar{padding:8px 16px;border-bottom:1px solid #d0d7de;font:12px ui-monospace,monospace;color:#59636e}
.markdown-body{padding:24px}
.src{font:12px system-ui;color:#59636e}
@media (max-width:544px){.markdown-body{padding:16px}}
@media (prefers-color-scheme:dark){body{background:#0d1117;color:#f0f6fc}.box,.bar{border-color:#3d444d}.bar,.src{color:#9198a1}}
</style></head><body><div class="wrap"><div class="box"><div class="bar">${user} / README.md</div><article class="markdown-body">${html}</article></div><p class="src">Rendered via ${source}.</p></div></body></html>`;
}

createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname === '/') {
    res.writeHead(200, { 'content-type': TYPES['.html'], 'cache-control': 'no-store' });
    return res.end(page(render()));
  }
  const path = normalize(join(ROOT, decodeURIComponent(url.pathname)));
  const inside = path.startsWith(ROOT + sep) && !path.slice(ROOT.length).split(sep).some((part) => part.startsWith('.') || part === 'node_modules');
  if (!inside || !existsSync(path) || statSync(path).isDirectory()) {
    res.writeHead(404);
    return res.end('not found');
  }
  res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(readFileSync(path));
}).listen(PORT, '127.0.0.1', () => console.log(`preview: http://localhost:${PORT}`));
