# text-freezer demo site — locked plan

Snapshot of the design + structural decisions behind the `demo/` site, written 2026-05-01. Captures intent so future passes don't re-litigate settled questions.

## Audience and objective

Cold-outreach landing page targeting **scambaiting creators** (Kitboga, Pleasant Green, Jim Browning, Scammer Payback, Trilogy Media, Atomic Shrimp, etc.). Single goal: trigger a eureka moment that the "scammer edits the bank HTML" step in refund scams is actually preventable. Secondary audience: institutions (banks, brokerages) who might deploy the library after a creator amplifies it. Library is MIT-licensed — no transactional licensing model; the ask of institutions is just "ship it on your customer-facing pages."

This is a **stall** in the fight, not a panacea. Tone is pragmatic confidence — never self-deprecating ("doesn't cure cancer" was a tone direction, never literal copy). Limitations are tucked into a `<details>` disclosure, not led with.

## Final structural decisions

| Decision | Choice | Rationale |
|---|---|---|
| Bank scenario | Yes — fictional **Meridian Federal**, single panel below the fold | Mirrors the canonical refund-scam frame without trademark risk |
| Eureka mechanic | Self-demoing entire page (every `data-frozen-zone` section frozen on load) | Demo speaks for itself — no guided walkthrough |
| Aesthetic | Hybrid: editorial hero (Fraunces + Newsreader, paper-cream + ink) + hostile-fintech bank panel (cardinal red, IBM Plex, gold hairlines) | Two registers in one page; bank panel needs realism for editing it to feel meaningful, hero needs voice |
| Headline | "Every second wasted on a scammer is a potential victim saved." | User-supplied; reframes the imperfection objection before it's raised |
| Sidebar/footer creator shoutout | **Cut** — would feel like fishing for endorsements; piggybacks on creators without permission | Keep the recipient list private in the outreach spreadsheet |
| URL personalization (`?for=`) | **Cut** — out of scope for v1 | Could revisit later |
| Edit-attempts counter | **Cut** — needs a backend, contradicts "static GitHub Pages" + adds infra | — |
| CTA | Primary: GitHub repo. Secondary: contact-the-author anchor → contact form. | — |
| Author byline | **Cut** — anonymous behind `text-freezer` | User preference |
| Contact form | Static, **honeypot field** (`name="website"`) + **JS-rendered email** (no captcha widget) + Formspree submit | Cleaner than Turnstile widget for expected volume; can add Turnstile later if spam appears |
| Hosting | GitHub Pages via `gh-pages` branch (peaceiris action) | Mirrors dict2json pattern |
| Domain split | Library and demo are **two completely independent pipelines** in one repo | User explicit requirement |
| Demo dependency | `text-freezer` from **npm** (caret pin in `demo/package.json`) — never reaches into `../dist/` in prod | Prod runs are exactly what an external consumer would experience |
| Local dev exception | `--local` flag on `build.mjs` reads `../dist/bundle.js` directly | Avoids needing a republish for every iteration |
| Build tool for demo | **Zero bundler.** Node script + three minifiers (terser, lightningcss, html-minifier-terser) | User picked zero-build but wanted minification |

## Repo layout (post-restructure)

```
text-freezer/
├── src/                      ← LIBRARY source
│   └── index.js              (the freeze() function)
├── dist/                     ← LIBRARY build output (committed at publish time via prepublishOnly)
├── webpack.config.js
├── package.json              ← LIBRARY (published as text-freezer)
│
├── demo/                     ← DEMO source (this plan)
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   ├── build.mjs             (assembly + minification)
│   ├── package.json          ← DEMO (private, depends on text-freezer from npm)
│   └── public/               ← DEMO build output (gitignored)
│
├── .github/workflows/
│   ├── publish.yml           ← LIBRARY: tag push or dispatch → npm publish
│   └── deploy.yml            ← DEMO:    push to demo/** → gh-pages
│
├── starting_files/           (legacy bank.html demo, kept for reference)
├── plans/                    (this file)
├── README.md
└── CLAUDE.md
```

## What's left before live

1. **Bump library version** (currently `1.0.0-rc1`, already on npm with the old layout). Tag and push — `publish.yml` republishes with the new `dist/` layout under MIT.
2. **Swap two placeholders in `demo/`:**
   - `script.js` → `YOUR_CONTACT_EMAIL@example.com`
   - `index.html` → `https://formspree.io/f/REPLACE_WITH_FORM_ID` (after creating a Formspree form)
3. **Configure GitHub Pages** in repo settings → Source: deploy from `gh-pages` branch (created automatically by the first `deploy.yml` run).
4. Optionally swap the honeypot for **Cloudflare Turnstile** if/when spam materializes — ~10 lines.

## Things explicitly NOT in v1

- Per-recipient personalization
- Global edit-attempts counter
- Side-by-side frozen vs. unfrozen comparison
- Guided "Step 1 / Step 2" DevTools walkthrough
- Public creator name list anywhere on the page
- Author name/email visible on the page (anonymous behind the project name)
