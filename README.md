# ondevice.fun

Product site for the **OnDevice** line, served by a Cloudflare Worker with static
assets. One page per locale covering the two builds that ship from
[`Mesutcydev/ios-local-llm`](https://github.com/Mesutcydev/ios-local-llm):

| Build | What it is |
| --- | --- |
| **OnDevice LLM** | The studio — assistant, lens, voice, model control, opt-in local API |
| **On Device: LAS** | The server — same runtime reduced to a bearer-authenticated local API |

Locales: English (`/`), Turkish (`/tr/`), Simplified Chinese (`/zh/`).

## Page architecture

Product-first, engineering one layer deeper:

1. **Hero** — proposition + a stable device frame with a Studio/Server switch
   (crossfade inside one frame; the frame, selector and outer height never move).
2. **Editions** — decision cards: who it's for → benefit → preview → three
   differentiators → platform/release summary → download + *How to install* →
   *Technical details* disclosure (bundle id, artifact, entitlements, checksum).
   Below: a deliberate full-width **Core** panel, a 3-row decision table, and an
   expandable full comparison.
3. **Showcase** — guided demonstrations: one selected screen, one heading, one
   explanation, per surface. Frames open an accessible screenshot viewer.
4. **Install** — three stages + the honest entitlements note.
5. **Developers** — endpoints, one example at a time (curl / aider / Anthropic SDK
   tabs with copy buttons), a labelled simulated terminal, and the full model
   requirements table inside a disclosure.
6. **Boundaries + FAQ**, then a calm **Get OnDevice** return to the choice.

## Layout

```
public/
  index.html         English
  tr/index.html      Turkish
  zh/index.html      Simplified Chinese
  404.html           not-found page
  _headers           cache + security headers
  _redirects         legacy paths → current anchors
  assets/
    icon-128.png     grey-eye brand mark
    favicon.png / apple-touch-icon.png
    og-en/tr/zh.png  monochrome OG cards per locale
    previews/        studio screenshots (620px)
    shots/           LAS screenshots
  shell/
    site.css         design system: tokens, layout, motion, theming
    site.js          tabs, disclosures, viewer, copy, reveals, terminal
wrangler.jsonc       Worker config: assets dir + custom domains
```

No bundler, no `package.json`. Wrangler runs through `npx` in Workers Builds.

## Design system

Tokens (starting specs, tuned against the rendered page): content width 1200px;
gutters 20px mobile / 32–48px desktop; section spacing 64–80px mobile /
104–128px desktop; grid gaps 24px; card radius 24px, controls 12–14px; buttons
46px; body 16–17px / 1.6; measure ~62ch. Three surface levels (`--bg`,
`--surface`, `--surface-2`). Mono reserved for code, identifiers, versions.
Body text targets ≥4.5:1 contrast in both schemes.

## Motion

One non-bouncy easing family; different energy per interaction. Hero 8px rise
(460ms); section reveals 12px once (420ms, 50ms stagger, capped at 6); card hover
3px lift (180ms, hover-capable pointers only); press `scale(.985)` (100ms);
Studio/Server switch crossfade + 8px directional movement in a stable frame
(250ms); disclosures natural-height with chevron rotation (250ms); viewer backdrop
fade + slight scale (200ms). No scroll hijacking, no pinned sequences. Under
`prefers-reduced-motion` everything collapses to static or minimal fades, and the
terminal renders its final state.

## Accessibility

- Tabs follow the W3C APG pattern: roving tabindex, arrow/Home/End keys,
  `aria-selected`, associated `role="tabpanel"` panels.
- Screenshot viewer is a modal dialog: Escape closes, focus is trapped and
  returned to the trigger, backdrop click closes.
- Content is visible without JavaScript: the `.js` class gates all entrance
  animation, disclosures render open, and nav links remain reachable.
- Touch targets ≥36–46px; the simulated terminal is labelled as a simulation.

## Theming

`data-theme` on `<html>`: `dark`, `light`, `system` (default). An inline boot
script reads `localStorage['ondevice-theme']` before first paint (no flash) and
adds the `.js` class. The nav toggle writes the preference.

## Locales

Full standalone pages, not machine translation: protocol terms stay English where
developers keep them (`tool calling`, `entitlement`, `KV cache`), numbers follow
local convention (`65.536` in Turkish), terminal scenes localised via
`window.ONDEVICE_SCENES`. `hreflang` alternates, `og:locale`, canonicals and a
sitemap with `xhtml:link` keep the three in sync.

## Deploy

Push to `main` → Workers Build runs `npx wrangler deploy`. Custom domains
`ondevice.fun` + `www.ondevice.fun` are declared in `wrangler.jsonc` routes;
Cloudflare creates DNS records and certificates (needs DNS Edit on the zone).

## Facts

Versions, build numbers, IPA sizes, bundle ids, checksums, entitlements, endpoints
and the model requirements table come from the source repo's `README.md`,
`ON_DEVICE_LAS.md`, `altstore/source.json` and release assets. When a build ships,
update in **all three locales**: hero strip is unaffected, but the edition cards
(summary + technical details), the `#get` buttons, and the footer checksums.
