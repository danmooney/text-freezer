// Zero-bundler build for the scamfreezer.com landing page.
//
// Modes (combine flags as needed):
//   --local        Use ../dist/bundle.js (the local library build) instead of
//                  the npm-installed textfreezer. Required for development
//                  before the package is published, or when iterating on the
//                  library and site together.
//   --no-minify    Skip HTML/CSS/JS minification — emits raw source for fast
//                  iteration and readable DevTools output.
//   --watch        Rebuild on source-file change.
//
// Default (no flags) is the production build used by CI: pulls the bundle from
// node_modules/textfreezer (i.e. the npm registry version pinned in
// package.json) and minifies everything into ./public.

import { readFile, writeFile, mkdir, copyFile, rm } from 'node:fs/promises';
import { existsSync, watch } from 'node:fs';

const args = new Set(process.argv.slice(2));
const useLocal = args.has('--local');
const noMinify = args.has('--no-minify');
const isWatch = args.has('--watch');

const SOURCES = ['index.html', 'styles.css', 'script.js'];
const OUT = 'public';

function bundleSource() {
  return useLocal
    ? '../dist/bundle.js'
    : 'node_modules/textfreezer/dist/bundle.js';
}

async function copyBundle() {
  const src = bundleSource();
  if (!existsSync(src)) {
    const hint = useLocal
      ? 'Run `npm run build` at the repo root to produce ../dist/bundle.js.'
      : 'Run `npm install` in demo/ to fetch textfreezer from npm.';
    throw new Error(`Library bundle not found at ${src}. ${hint}`);
  }
  await copyFile(src, `${OUT}/bundle.js`);
}

async function buildHTML() {
  const src = await readFile('index.html', 'utf8');
  if (noMinify) return writeFile(`${OUT}/index.html`, src);
  const { minify } = await import('html-minifier-terser');
  const out = await minify(src, {
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: true,
    decodeEntities: false,
  });
  await writeFile(`${OUT}/index.html`, out);
}

async function buildCSS() {
  const src = await readFile('styles.css');
  if (noMinify) return writeFile(`${OUT}/styles.css`, src);
  const { transform } = await import('lightningcss');
  const out = transform({
    filename: 'styles.css',
    code: src,
    minify: true,
  });
  await writeFile(`${OUT}/styles.css`, out.code);
}

async function buildJS() {
  const src = await readFile('script.js', 'utf8');
  if (noMinify) return writeFile(`${OUT}/script.js`, src);
  const { minify } = await import('terser');
  const out = await minify(src, { compress: true, mangle: true });
  await writeFile(`${OUT}/script.js`, out.code);
}

async function build() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  await Promise.all([copyBundle(), buildHTML(), buildCSS(), buildJS()]);
  const tag = `${noMinify ? 'dev' : 'prod'} · ${useLocal ? 'local-lib' : 'npm-lib'}`;
  console.log(`[build] ${tag} → ${OUT}/`);
}

await build();

if (isWatch) {
  console.log('[watch] watching:', SOURCES.join(', '));
  for (const f of SOURCES) {
    watch(f, () =>
      build().catch((e) => console.error('[build] error:', e.message)),
    );
  }
}
