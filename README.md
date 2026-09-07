# ondevice.fun

Marketing site for the **OnDevice** product line, served by a Cloudflare Worker with
static assets. One page covering both builds that ship from
[`Mesutcydev/ios-local-llm`](https://github.com/Mesutcydev/ios-local-llm):

| Build | What it is |
| --- | --- |
| **OnDevice LLM** | The studio — assistant, lens, voice, model control, opt-in local API |
| **On Device: LAS** | The server — same runtime reduced to a bearer-authenticated local API |

## Layout

```
public/            static site, served directly by Workers assets
  index.html       the whole site — self-contained CSS + JS, no build step
  404.html         not-found page (assets.not_found_handling = "404-page")
  _headers         cache + security headers
  _redirects       old GitHub Pages paths → anchors on the new page
  assets/          vendored screenshots, app icons, favicon, OG image
wrangler.jsonc     Worker config: assets dir + custom domains
```

There is no bundler and no `package.json`. Wrangler is run through `npx` by Workers
Builds, so the deploy has nothing to install.

## Local preview

```sh
npx wrangler dev
```

Requires a Cloudflare login: `npx wrangler login`. Custom domains are not attached
during local dev — use the printed `localhost` URL.

## Deploy

Pushing to `main` triggers a Workers Build that runs `npx wrangler deploy`. To deploy
manually:

```sh
npx wrangler deploy
```

### Domain

`routes` in `wrangler.jsonc` declares `ondevice.fun` and `www.ondevice.fun` as
**custom domains**. Cloudflare creates the DNS records and issues the certificates on
deploy, which needs the deploy token to have **DNS Edit** on the zone. If a deploy
fails with a DNS permission error, either grant that permission or add the two custom
domains once in the dashboard under **Workers & Pages → ondevice → Settings →
Domains & Routes**.

## Assets

Screenshots and icons are vendored from the `gh-pages` branch and the release assets
of `ios-local-llm`, then downscaled with `sips` so the phone captures are 620px wide.
Nothing hotlinks GitHub Pages. To refresh a capture, replace the file in
`public/assets/` — filenames are stable and `_headers` caches them for a day with
`stale-while-revalidate`, so no cache-busting query string is needed.

## Facts on this page

Version numbers, build numbers, IPA sizes, bundle identifiers, checksums, entitlement
names, endpoints, and the model requirements table are taken from the source
repository's `README.md`, `ON_DEVICE_LAS.md`, `altstore/source.json`, and the release
assets. When a new build ships, update:

- the two hero download buttons
- the `#editions` cards (`Version`, `Artifact`, hash filename)
- the SHA-256 lines in the footer
