# ondevice.fun

Marketing site for the **OnDevice** product line, served by a Cloudflare Worker with
static assets. One page covering both builds that ship from
[`Mesutcydev/ios-local-llm`](https://github.com/Mesutcydev/ios-local-llm):

| Build | What it is |
| --- | --- |
| **OnDevice LLM** | The studio — assistant, lens, voice, model control, opt-in local API |
| **On Device: LAS** | The server — same runtime reduced to a bearer-authenticated local API |

Available in three locales: English (`/`), Turkish (`/tr/`), Simplified Chinese (`/zh/`).

## Layout

```
public/
  index.html         English page
  tr/index.html      Turkish page
  zh/index.html      Simplified Chinese page
  404.html           not-found page (assets.not_found_handling = "404-page")
  _headers           cache + security headers
  _redirects         old GitHub Pages paths → anchors on the new page
  assets/
    site.css         shared design system: tokens, layout, motion, theming
    site.js          theme control, scroll reveal, nav shadow, terminal scenes
    icon-128.png     grey-eye brand mark (nav + edition cards)
    favicon.png / apple-touch-icon.png
    og-en/tr/zh.png  monochrome Open Graph cards, one per locale
    previews/        studio screenshots (620px wide)
    shots/           LAS screenshots
wrangler.jsonc       Worker config: assets dir + custom domains
```

No bundler, no `package.json`. Wrangler runs through `npx` in Workers Builds, so the
deploy has nothing to install.

## Theming

`data-theme` on `<html>` is `dark`, `light`, or `system` (default). An inline boot
script in `<head>` reads `localStorage['ondevice-theme']` before first paint, so there
is no flash of the wrong scheme. The nav toggle writes the preference; `system` follows
`prefers-color-scheme`. All colours come from CSS custom properties, so both schemes
stay in sync automatically.

## Locales

Each locale is a full standalone page (no runtime i18n) sharing `site.css` / `site.js`.
Translations are written natively, not machine-translated: technical terms that
developers keep in English stay in English (`tool calling`, `entitlement`, `KV cache`),
and numbers follow local convention (Turkish uses `65.536`, Chinese keeps `65,536`).
The terminal scenes are localised per page via `window.ONDEVICE_SCENES`, set before
`site.js` loads. `hreflang` links, `og:locale`, canonicals, and the sitemap with
`xhtml:link` alternates keep the three in sync for search engines.

## Motion

- Hero: staggered masked rise (`clip-path` + translate), 60–360ms offsets.
- Sections: `data-reveal` scroll reveals via IntersectionObserver, staggered per
  container (60ms steps, capped at 6).
- Terminal: token-by-token streaming; tab switches blur-fade (140ms) so the two scenes
  never visibly overlap.
- Buttons: `scale(.97)` on press; cards and shots lift 2–3px on hover (hover-capable
  pointers only).
- Nav gains a shadow once scrolled.
- Everything collapses to static under `prefers-reduced-motion: reduce`.

## Local preview

```sh
npx wrangler dev
```

Requires a Cloudflare login: `npx wrangler login`. Custom domains are not attached
during local dev — use the printed `localhost` URL.

## Deploy

Pushing to `main` triggers a Workers Build that runs `npx wrangler deploy`. To deploy
manually: `npx wrangler deploy`.

### Domain

`routes` in `wrangler.jsonc` declares `ondevice.fun` and `www.ondevice.fun` as
**custom domains**. Cloudflare creates the DNS records and issues the certificates on
deploy, which needs the deploy token to have **DNS Edit** on the zone.

## Assets

Screenshots and icons are vendored from the `gh-pages` branch and release assets of
`ios-local-llm`, downscaled with `sips`. Nothing hotlinks GitHub Pages. The brand mark
is the grey-eye icon pinned by `altstore/source.json` for OnDevice LLM (byte-identical
to the OnDevice Core release icon). OG cards are generated with `PIL` from
`/tmp/gen_og.py` — monochrome, matching the site palette; regenerate after any
headline or locale change.

## Facts on this page

Version numbers, build numbers, IPA sizes, bundle identifiers, checksums, entitlement
names, endpoints, and the model requirements table are taken from the source
repository's `README.md`, `ON_DEVICE_LAS.md`, `altstore/source.json`, and the release
assets. When a new build ships, update in **all three locales**:

- the two hero download buttons
- the `#editions` cards (`Version`, `Artifact`, hash filename)
- the SHA-256 lines in the footer
