# textfreezer

> Stop in-browser HTML edits used in refund scams. A [Scamfreezer](https://scamfreezer.com) project.

![textfreezer_demo](https://user-images.githubusercontent.com/960790/211227322-17dd9942-70ee-4955-aee4-b8e1bf91e3d9.gif)

A tiny library (~60 lines) that installs a `MutationObserver` on a target element and reverts any in-browser edits to its text content or DOM structure. Built to close the *"the scammer then edits the HTML…"* step that shows up in nearly every refund-scam takedown video.

Live demo: [scamfreezer.com](https://scamfreezer.com).

## Install

```sh
npm install @scamfreezer/textfreezer
```

Or load the UMD bundle directly from a CDN:

```html
<script src="https://unpkg.com/@scamfreezer/textfreezer/dist/bundle.js"></script>
```

## Usage

```js
import { freeze } from '@scamfreezer/textfreezer';
freeze(document.querySelector('#elementToFreeze'));
```

Or via the UMD global (after the `<script>` tag above):

```html
<script>window.textfreezer.freeze(document.querySelector('#protected'));</script>
```

After the call, any attempt to edit the element's text content (typing in DevTools, scripted `textContent` changes, child node insertions/removals) is immediately reverted. The observer is captured in the function's closure — there is no exposed handle to switch it off after the fact.

Useful for any page where a number must not be doctored on screen: bank dashboards, broker statements, insurance quotes, refund confirmations.

## Repository structure

This repo contains **two independent regions** with **two independent CI pipelines**:

| Region | Where | Ships via |
|---|---|---|
| **Library** (`@scamfreezer/textfreezer`) | `src/` → `dist/` (webpack UMD bundle) | `npm publish` — workflow: `.github/workflows/publish.yml` (triggers on `v*` tag push or manual dispatch) |
| **Site** (scamfreezer.com) | `demo/` → `demo/public/` (zero-bundler, minified static files) | GitHub Pages via `gh-pages` branch — workflow: `.github/workflows/deploy.yml` (triggers on `demo/**` changes) |

The site consumes `@scamfreezer/textfreezer` as a normal **npm dependency** (caret-pinned in `demo/package.json`). The two domains never reach across each other in production — pushing a new library version doesn't redeploy the site, and pushing a site change doesn't republish the library.

## Develop the library

```sh
npm install
npm run build         # production: NODE_ENV=production webpack → dist/bundle.js
npm run build:dev     # watch mode (re-bundles on change)
```

`npm run build` is what `publish.yml` runs (and what `prepublishOnly` enforces locally).

## Develop the site

First time only — make sure the library bundle exists, install site deps:

```sh
npm install && npm run build      # at the repo root: produces dist/bundle.js
cd demo
npm install
```

Then to run the live-reloading site:

```sh
npm run dev                       # watches demo/, serves demo/public/, reloads on save
```

Open **http://localhost:3000**.

`npm run dev` builds in `--local --no-minify` mode: it pulls the bundle from `../dist/bundle.js` (i.e. *your* working library, not npm), skips minification for readable DevTools, and rebuilds + reloads on every save.

> **404 on `bundle.js`?** You're loading `demo/index.html` from the wrong place — open the URL above (which serves `demo/public/`), not the source file directly. The bundle only exists in `demo/public/` after the watcher runs.

For a one-shot production build identical to what CI emits:

```sh
cd demo
npm run build                     # minified, sources @scamfreezer/textfreezer from node_modules (i.e. npm)
```

The `build.mjs` script accepts `--local` (use `../dist/bundle.js`), `--no-minify` (raw output), and `--watch` flags.

## Publish a new library version

1. Bump `version` in the root `package.json`.
2. `git tag v1.2.3 && git push --tags`
3. `publish.yml` runs `npm install`, `npm run build`, then `npm publish` using the `NPM_TOKEN` repository secret.

The site redeploys **only** when files under `demo/**` change. To roll the site onto a newly-published library version, bump the caret range in `demo/package.json` (or just push a no-op change) and let `deploy.yml` rebuild against the latest npm registry.

## Contributing

Issues and PRs welcome at <https://github.com/scamfreezer/textfreezer>.

## License

[MIT](./LICENSE) © Dan Mooney. Use it, fork it, ship it. If it stalls a single scammer, it's earned its keep.
