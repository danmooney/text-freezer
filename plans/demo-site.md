# scamfreezer.com — locked plan

Snapshot of the design + structural decisions behind the `demo/` directory (which is the scamfreezer.com landing page). Captures intent so future passes don't re-litigate settled questions. Originally written 2026-05-01.

## Brand structure

- **Scamfreezer** — umbrella brand (scamfreezer.com domain, GitHub org `scamfreezer`, npm org `@scamfreezer`). The marketing-facing identity used on the site itself, in cold outreach DMs, and in any future product additions.
- **textfreezer** — the everyday/prose name of the library. The first Scamfreezer product. Named after its mechanism (freezing text).
- **`@scamfreezer/textfreezer`** — the canonical npm identifier. Used in install snippets and `package.json`. Scoped from the start so future products (`@scamfreezer/linkfreezer`, `@scamfreezer/voicefreezer`, etc.) sit naturally alongside.
- Bridge: site footer reads *"textfreezer is a Scamfreezer project."*
- Old name `text-freezer` (hyphenated, unscoped) sits at `1.0.0-rc1` on npm and gets deprecated in favor of `@scamfreezer/textfreezer`.

The split is deliberate: outcome-named brand (Scamfreezer) does the cold-outreach work; mechanism-named library (textfreezer) lives where developers operate. Cold-outreach visitors only see "Scamfreezer"; the library name surfaces only for developers.

## Audience and objective

Cold-outreach landing page targeting **scambaiting creators** (Kitboga, Pleasant Green, Jim Browning, Scammer Payback, Trilogy Media, Atomic Shrimp, etc.). Single goal: trigger a eureka moment that the "scammer edits the bank HTML" step in refund scams is actually preventable. Secondary audience: institutions (banks, brokerages) who might deploy the library after a creator amplifies it. Library is MIT — no transactional licensing; the ask of institutions is just "ship it on your customer-facing pages."

This is a **stall** in the fight, not a panacea. Tone is pragmatic confidence — never self-deprecating ("doesn't cure cancer" was a tone direction, never literal copy). Limitations are tucked into a `<details>` disclosure, not led with.

## Final structural decisions

| Decision | Choice | Rationale |
|---|---|---|
| Bank scenario | Yes — fictional **Meridian Federal**, single panel below the fold | Mirrors the canonical refund-scam frame without trademark risk |
| Eureka mechanic | Self-demoing entire page — `freeze(document.body)` runs once on load | Demo speaks for itself — no guided walkthrough. Whole-body freeze (vs. per-section) closes a deletion attack: a section-level observer can't see its own detachment from the parent. Form inputs stay editable because typing updates `.value`, not text nodes — no observer mutations fire. |
| Aesthetic | Hybrid: editorial hero (Fraunces + Newsreader, paper-cream + ink) + hostile-fintech bank panel (cardinal red, IBM Plex, gold hairlines) | Two registers in one page; bank panel needs realism for editing it to feel meaningful, hero needs voice |
| Headline | "Every second wasted on a scammer is a potential victim saved." | User-supplied; reframes the imperfection objection before it's raised |
| Topbar mark | `SCAMFREEZER` (full word, all-caps, letter-spaced) | Brand should be readable, not cute-compressed. The brand IS the joke. |
| Sidebar/footer creator shoutout | **Cut** — would feel like fishing for endorsements | Keep the recipient list private in the outreach spreadsheet |
| URL personalization (`?for=`) | **Cut** — out of scope for v1 | Could revisit later |
| Edit-attempts counter | **Cut** — needs a backend, contradicts static hosting | — |
| CTA | Primary: GitHub repo. Secondary: contact-the-author anchor → contact form. | — |
| Author byline | **Cut** — anonymous behind the brand on the page itself | Email `dan@scamfreezer.com` appears in the contact box; no name attached on the page |
| Contact form | Static, **honeypot field** (`name="website"`) + **JS-rendered email** + Formspree submit | Cleaner than Turnstile for expected volume; swap to Turnstile later if spam appears |
| Hosting | GitHub Pages from `gh-pages` branch with CNAME `scamfreezer.com` | Mirrors dict2json pattern |
| Domain split (CI) | Library publish and site deploy are **two completely independent pipelines** | User explicit requirement |
| Site dependency | `@scamfreezer/textfreezer` from **npm** (caret pin in `demo/package.json`) — never reaches into `../dist/` in prod | Prod build is exactly what an external consumer would experience |
| Local dev exception | `--local` flag on `build.mjs` reads `../dist/bundle.js` directly | Avoids needing a republish for every iteration |
| Build tool | **Zero bundler.** Node script + three minifiers (terser, lightningcss, html-minifier-terser) | User picked zero-build but wanted minification |

## Repo layout

```
textfreezer/                  ← local dir; GitHub repo will be scamfreezer/textfreezer
├── src/                      ← LIBRARY source
│   └── index.js              (the freeze() function)
├── dist/                     ← LIBRARY build output (regenerated at publish time)
├── webpack.config.js
├── package.json              ← LIBRARY (published as `@scamfreezer/textfreezer` on npm)
│
├── demo/                     ← SITE source (scamfreezer.com)
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   ├── build.mjs             (assembly + minification)
│   ├── package.json          ← SITE (private, depends on `@scamfreezer/textfreezer` from npm)
│   └── public/               ← SITE build output (gitignored)
│
├── .github/workflows/
│   ├── publish.yml           ← LIBRARY: tag push or dispatch → npm publish
│   └── deploy.yml            ← SITE:    push to demo/** → gh-pages (cname: scamfreezer.com)
│
├── starting_files/           (legacy bank.html demo, kept for reference)
├── plans/                    (this file)
├── README.md
└── CLAUDE.md
```

## What's left before live

1. **Create `scamfreezer` GitHub org** and transfer the repo into it (renaming to `textfreezer` if needed).
2. **DNS:** point `scamfreezer.com` at GitHub Pages (A records `185.199.108-111.153`; CNAME for `www` → `scamfreezer.github.io`).
3. **Pages settings:** Source = `gh-pages` branch.
4. **Publish `@scamfreezer/textfreezer@1.0.0`** to npm via `git tag v1.0.0 && git push --tags` → `publish.yml`. Confirm `NPM_TOKEN` has publish rights on the `@scamfreezer` scope (granular tokens may need explicit scope grant in npmjs.com settings).
5. **Deprecate the old name:** `npm deprecate text-freezer@"<99.0" "Renamed to @scamfreezer/textfreezer"`.
6. **Replace the Formspree placeholder** in `demo/index.html` (`https://formspree.io/f/REPLACE_WITH_FORM_ID` → real form ID) before relying on the contact form.
7. Optionally swap the honeypot for **Cloudflare Turnstile** if/when spam materializes — ~10 lines.

## Things explicitly NOT in v1

- Per-recipient personalization
- Global edit-attempts counter
- Side-by-side frozen vs. unfrozen comparison
- Guided "Step 1 / Step 2" DevTools walkthrough
- Public creator name list anywhere on the page
- Author name visible on the page (only the dan@scamfreezer.com address)
