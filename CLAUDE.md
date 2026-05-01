# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Brand layout

This repo houses a **single-product company structure**:

- **Scamfreezer** — the umbrella brand and domain (scamfreezer.com). The marketing-facing identity. The `demo/` directory IS the scamfreezer.com landing page.
- **textfreezer** — the library. The first (currently only) Scamfreezer product. Published on npm as `textfreezer`.

Bridge line on the page: *"textfreezer is a Scamfreezer project."* Most copy on the public site refers to "Scamfreezer"; library/install snippets refer to `textfreezer`. Don't conflate them — Scamfreezer is the company-shaped umbrella, `textfreezer` is the npm-shaped product.

The library was previously named `text-freezer` (hyphenated). The hyphenated name still exists on npm at `1.0.0-rc1` from before the rename and should be deprecated by Dan with a pointer to `textfreezer`.

## Two domains, one repo

This repo has **two independent regions** with **independent pipelines** — keep them separated when making changes.

| Region | Source | Build | Output | Ships via |
|---|---|---|---|---|
| Library (`textfreezer`) | `src/` | root `package.json` + `webpack.config.js` | `dist/` | `npm publish` (workflow: `.github/workflows/publish.yml`, triggers on `v*` tag push) |
| Site (scamfreezer.com) | `demo/` | `demo/package.json` + `demo/build.mjs` | `demo/public/` (gitignored) | GitHub Pages via `gh-pages` branch with CNAME `scamfreezer.com` (workflow: `.github/workflows/deploy.yml`, triggers on `demo/**` changes) |

The site consumes `textfreezer` as a normal **npm dependency** (pinned in `demo/package.json`). It does NOT reach into `../dist/` directly — that's the firewall between the two domains. The only exception is local dev mode (see below).

**Don't put website source or build output in `docs/`.** `docs/` is reserved for documentation if it ever exists.

## Commands

### Library (root)
- Production build: `npm run build` (sets `NODE_ENV=production`, emits `dist/bundle.js` UMD)
- Watch / dev build: `npm run build:dev`
- Publish to npm: tag `v*` and push, or manually run the `publish.yml` workflow. `prepublishOnly` rebuilds before publishing.
- Tests: `npm test` is a no-op success stub.

### Site (`cd demo`)
- Local dev: `npm run dev` — starts a watcher + static server, builds **unminified** from **local** `../dist/bundle.js` (skips the npm-installed copy). Requires `npm run build` at the repo root first to populate `../dist/`.
- One-shot dev build: `npm run build:dev`
- Production build: `npm run build` — minifies HTML/CSS/JS and copies the **npm-installed** `textfreezer/dist/bundle.js` (i.e. the published version). This is what CI runs.

The dual modes are controlled by `--local` / `--no-minify` flags on `build.mjs`. The dev mode never touches `node_modules/textfreezer`, so local dev works even before `textfreezer` is published.

## Library build output

Webpack bundles `src/index.js` to `dist/bundle.js` as a UMD library exposing `window.textfreezer` (with `.freeze`). Consumers can `import { freeze } from 'textfreezer'` (resolves via `main: "dist/bundle.js"`) or load it as a `<script>` tag.

## Architecture

The whole library is one function: `freeze(targetNode)` in `src/index.js`. It installs a `MutationObserver` with `subtree: true` and reverts changes:

- **`characterData` mutations** — first time a text node mutates, its pre-mutation value is captured in a `Map` keyed by the text node. Subsequent edits are reverted by writing the stored value back to `textContent`. The first observation with `oldValue === null` is treated as a seed (no revert), because that's how the observer reports the very first change for a node.
- **`childList` mutations** — handled coarsely by snapshotting `targetNode.innerHTML` at freeze time and restoring it whenever children are added or removed. This is what lets the library revert structural HTML edits inside the frozen ancestor (see commit `45223b2`).

### The re-entry flag

Reverting a mutation triggers another mutation, which would loop forever. The code sets `mutation.target.isChangeInProgress = true` directly on the DOM node before writing, then clears it in a `setTimeout(..., 0)` so the flag survives the current observer flush and is cleared before the next one. Any code touching the callback needs to preserve this pattern — early-returning when `isChangeInProgress` is true is what breaks the loop.

### Closure capture is load-bearing

The `MutationObserver` instance is a local inside `freeze()`, never returned, never attached to the target node, never exposed globally. This is the property that makes the library actually defensible against DevTools-driven attacks: post-`freeze`, there is no handle to call `.disconnect()` on. **Do not refactor `freeze()` to return the observer, accept an "unfreeze" callback, store the observer on the element, or expose it any other way** without first re-evaluating the threat model — that's the whole reason the library works. (See `memory/project_threat_model.md`.)

## Site conventions

- **Whole-body freeze.** `demo/script.js` calls `freeze(document.body)` — the entire page is one frozen root. This is deliberate: section-level freezing is vulnerable to a deletion attack, because a section's own observer can't see itself being detached from its parent. The contact form lives inside the frozen body too, and that's fine — typing into `<input>` / `<textarea>` updates `element.value` (a property), not text nodes, so no characterData/childList mutation fires. Submit is a normal browser navigation, also outside the observer. Browser extensions that inject DOM near the form (Grammarly, password managers) will have their injections reverted; accepted tradeoff.
- **All DOM setup must happen before `freeze()` runs.** `script.js` does its setup synchronously inside `DOMContentLoaded`, then calls `freeze()` last. Any DOM mutation made AFTER freeze gets reverted. The page is intentionally fully static after load. If something genuinely needs to be dynamic, it has to live in form-input land (where typing doesn't mutate the DOM), not in text nodes.
- **Bank panel content is fictional on purpose.** "Meridian Federal" is a made-up institution; using a real bank name + colors + logo would create trademark/passing-off risk on a page about financial fraud. Do not "improve" the realism by swapping in a real bank.

## Pre-launch checklist (Dan tasks, not Claude tasks)

Several manual steps must happen before scamfreezer.com goes live. Local dev (`npm run dev`, which uses `--local`) works without any of them; CI/prod paths require all of them.

1. **Create `scamfreezer` GitHub org** and transfer this repo into it (renaming if needed; the local directory is already `textfreezer/` but the GitHub repo is currently `danmooney/text-freezer`).
2. **DNS for `scamfreezer.com`** — A records to `185.199.108.153`, `.109.153`, `.110.153`, `.111.153`; CNAME for `www` → `scamfreezer.github.io`.
3. **Pages settings** in the GitHub repo: Source = `gh-pages` branch.
4. **Publish `textfreezer@1.0.0` to npm.** The package is renamed from `text-freezer` (which sits at `1.0.0-rc1`); first publish under the new name goes via tag push (`git tag v1.0.0 && git push --tags`) → `publish.yml`.
5. **Deprecate the old name** once `textfreezer` is up: `npm deprecate text-freezer@"<99.0" "Renamed to textfreezer; install textfreezer instead"`.
6. **Replace the Formspree placeholder** in `demo/index.html` (`https://formspree.io/f/REPLACE_WITH_FORM_ID` → real form ID) before the deploy is useful.

If a session is diagnosing a deploy failure due to `npm install` not finding `textfreezer`, the fix is "step 4 hasn't happened yet," not a workaround in `build.mjs`.

## Repo layout notes

- `demo/` — scamfreezer.com landing page / live demonstration. See "Two domains" above. (Keeping the directory name `demo/` rather than `site/` because that's the role for ad-hoc development; the published artifact is the site.)
- `starting_files/bank.html` + `bank.css` — original manual demo fixture, predates `demo/`. Kept for reference; not part of the published package and not what CI deploys.
- `plans/` — ad-hoc planning docs. `plans/demo-site.md` captures the locked design and structural decisions behind `demo/`; read it before second-guessing layout/aesthetic choices.
- License is **MIT** (see `LICENSE`). The repo briefly went Proprietary in commit `357de33` and was reverted; the new `textfreezer` package publishes under MIT.