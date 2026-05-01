# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Two domains, one repo

This repo has **two independent regions** with **independent pipelines** — keep them separated when making changes.

| Region | Source | Build | Output | Ships via |
|---|---|---|---|---|
| Library | `src/` | root `package.json` + `webpack.config.js` | `dist/` | `npm publish` (workflow: `.github/workflows/publish.yml`, triggers on `v*` tag push) |
| Demo site | `demo/` | `demo/package.json` + `demo/build.mjs` | `demo/public/` (gitignored) | GitHub Pages via `gh-pages` branch (workflow: `.github/workflows/deploy.yml`, triggers on `demo/**` changes) |

The demo consumes `text-freezer` as a normal **npm dependency** (pinned in `demo/package.json`). It does NOT reach into `../dist/` directly — that's the firewall between the two domains. The only exception is local dev mode (see below).

**Don't put website source or build output in `docs/`.** `docs/` is reserved for documentation if it ever exists.

## Commands

### Library (root)
- Production build: `npm run build` (sets `NODE_ENV=production`, emits `dist/bundle.js` UMD)
- Watch / dev build: `npm run build:dev`
- Publish to npm: tag `v*` and push, or manually run the `publish.yml` workflow. `prepublishOnly` rebuilds before publishing.
- Tests: `npm test` is a no-op success stub.

### Demo (`cd demo`)
- Local dev: `npm run dev` — starts a watcher + static server, builds **unminified** from **local** `../dist/bundle.js` (skips the npm-installed copy). Requires `npm run build` at the repo root first to populate `../dist/`.
- One-shot dev build: `npm run build:dev`
- Production build: `npm run build` — minifies HTML/CSS/JS and copies the **npm-installed** `text-freezer/dist/bundle.js` (i.e. the published version). This is what CI runs.

The dual modes are controlled by `--local` / `--no-minify` flags on `build.mjs`. The dev mode never touches `node_modules/text-freezer`, so local dev works even before `text-freezer` is republished.

## Library build output

Webpack bundles `src/index.js` to `dist/bundle.js` as a UMD library exposing `window.textFreezer` (with `.freeze`). Consumers can `import { freeze } from 'text-freezer'` (resolves via `main: "dist/bundle.js"`) or load it as a `<script>` tag.

## Architecture

The whole library is one function: `freeze(targetNode)` in `src/index.js`. It installs a `MutationObserver` with `subtree: true` and reverts changes:

- **`characterData` mutations** — first time a text node mutates, its pre-mutation value is captured in a `Map` keyed by the text node. Subsequent edits are reverted by writing the stored value back to `textContent`. The first observation with `oldValue === null` is treated as a seed (no revert), because that's how the observer reports the very first change for a node.
- **`childList` mutations** — handled coarsely by snapshotting `targetNode.innerHTML` at freeze time and restoring it whenever children are added or removed. This is what lets the library revert structural HTML edits inside the frozen ancestor (see commit `45223b2`).

### The re-entry flag

Reverting a mutation triggers another mutation, which would loop forever. The code sets `mutation.target.isChangeInProgress = true` directly on the DOM node before writing, then clears it in a `setTimeout(..., 0)` so the flag survives the current observer flush and is cleared before the next one. Any code touching the callback needs to preserve this pattern — early-returning when `isChangeInProgress` is true is what breaks the loop.

### Closure capture is load-bearing

The `MutationObserver` instance is a local inside `freeze()`, never returned, never attached to the target node, never exposed globally. This is the property that makes the library actually defensible against DevTools-driven attacks: post-`freeze`, there is no handle to call `.disconnect()` on. **Do not refactor `freeze()` to return the observer, accept an "unfreeze" callback, store the observer on the element, or expose it any other way** without first re-evaluating the threat model — that's the whole reason the library works. (See `memory/project_threat_model.md`.)

## Demo conventions

- **Whole-body freeze.** `demo/script.js` calls `freeze(document.body)` — the entire page is one frozen root. This is deliberate: section-level freezing is vulnerable to a deletion attack, because a section's own observer can't see itself being detached from its parent. The contact form lives inside the frozen body too, and that's fine — typing into `<input>` / `<textarea>` updates `element.value` (a property), not text nodes, so no characterData/childList mutation fires. Submit is a normal browser navigation, also outside the observer. Browser extensions that inject DOM near the form (Grammarly, password managers) will have their injections reverted; accepted tradeoff.
- **All DOM setup must happen before `freeze()` runs.** `script.js` does its setup synchronously inside `DOMContentLoaded`, then calls `freeze()` last. Any DOM mutation made AFTER freeze gets reverted. The page is intentionally fully static after load. If something genuinely needs to be dynamic, it has to live in form-input land (where typing doesn't mutate the DOM), not in text nodes.
- **Pre-deploy placeholders** — the demo ships with two intentional placeholders that must be replaced before any real deploy:
  1. `demo/script.js` — `YOUR_CONTACT_EMAIL` / `example.com` in the email-assembly block.
  2. `demo/index.html` — `https://formspree.io/f/REPLACE_WITH_FORM_ID` on the contact form's `action`.
  Do NOT auto-fill these from environment context (e.g. user email from system reminders) — they are deliberately placeholder until the user supplies real values.
- **Bank panel content is fictional on purpose.** "Meridian Federal" is a made-up institution; using a real bank name + colors + logo would create trademark/passing-off risk on a page about financial fraud. Do not "improve" the realism by swapping in a real bank.

## Build pipeline gotcha

The currently-published `text-freezer@1.0.0-rc1` on npm is the **pre-restructure** version: no `dist/`. The demo's prod build path (`npm run build` inside `demo/`) expects the new package shape. Until a fresh publish goes out:
- `cd demo && npm install && npm run build` will fail at the `copyBundle` step (no `node_modules/text-freezer/dist/bundle.js`).
- Local dev (`npm run dev`, which uses `--local`) works fine — it reads `../dist/bundle.js` directly.
- CI's `deploy.yml` will fail until the library is republished.

If a session finds itself diagnosing this failure, the fix is to bump + tag + push the library (triggering `publish.yml`), not to work around it in `build.mjs`.

## Repo layout notes

- `demo/` — landing page / live demonstration site. See "Two domains" above.
- `starting_files/bank.html` + `bank.css` — original manual demo fixture, predates `demo/`. Kept for reference; not part of the published package and not what CI deploys.
- `plans/` — ad-hoc planning docs. `plans/demo-site.md` captures the locked design and structural decisions behind `demo/`; read it before second-guessing layout/aesthetic choices.
- License is **MIT** (see `LICENSE`). The repo briefly went Proprietary in commit `357de33` and was reverted to MIT — the npm-published `1.0.0-rc1` has always carried MIT, so the next publish stays consistent rather than introducing a license change.