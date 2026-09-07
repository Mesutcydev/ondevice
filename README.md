# ondevice.fun

Promotional site for the **OnDevice** open-source project — an editorial
software launch page, not a SaaS template. One page per locale:
English (`/`), Turkish (`/tr/`), Simplified Chinese (`/zh/`).

The promoted software ships from
[`Mesutcydev/ios-local-llm`](https://github.com/Mesutcydev/ios-local-llm):

| Product | What it is |
| --- | --- |
| **OnDevice LLM** | The workbench — assistant, camera/OCR, voice, model library |
| **On Device: LAS** | The local API server — OpenAI/Anthropic/Ollama-compatible, bearer-authenticated |
| **OnDevice Core** | Specialized iOS 27+ variant on Apple Core AI (secondary row, not a flagship) |

## Page structure

1. **Hero** — "Your iPhone can run the model." Oversized Inter headline beside a
   complete, full-brightness model-library screenshot. The OnDevice signature: a
   magnified crop of the *same* screenshot's `Loaded` row, joined to a marker on its
   source column by one thin rule. Primary action is GitHub; "Get the app" leads to
   the edition decision.
2. **Product story** — "Use the app. Or connect your tools." One coordinated
   showcase with a W3C-tabs selector switching a stable media frame. The tools view
   shows a labelled example request with placeholders and keeps the operational
   boundaries beside it.
3. **Editions** (`#editions`) — open rows separated by thin rules: name, purpose,
   status, platform, size, and only the actions that exist (Download IPA /
   Installation guide / Source). Sideload-not-App-Store stated in the open.
   Checksums, bundle ids and entitlements live in a technical disclosure.
4. **Install** — three honest stages; entitlement survival called out.
5. **Source** — "Use it. Inspect it. Build on it." with repository, contributing,
   architecture, agent-integration and security links. Star invitation appears only
   after the product is demonstrated.
6. **Boundaries** — what it will not do, as a plain ruled list.
7. **End** — quiet return to the source action.

No card grids, no bento, no badges-as-decoration, no fake terminals, no ambient glow.

## Layout

```
public/
  index.html         English
  tr/index.html      Turkish
  zh/index.html      Simplified Chinese
  404.html           not-found page
  _headers           cache + security headers
  _redirects         legacy paths/anchors → current sections
  assets/
    hero-models.png      complete model-library capture (source aspect)
    inspect-loaded.png   magnified crop of the same capture's Loaded row
    story-app.png        assistant conversation capture
    story-tools.png      LAS server homepage capture
    og-en/tr/zh.png      share cards: brand + Inter + real product crop
    fonts/               self-hosted Inter (OFL), woff2 latin + latin-ext
    icon-128.png / favicon.png / apple-touch-icon.png
  shell/
    site.css         editorial design system (tokens, type scale, motion)
    site.js          tabs, viewer, menu, copy, disclosures
wrangler.jsonc       Worker config: assets dir + custom domains
```

No bundler, no `package.json`, no animation library. Wrangler runs through `npx` in
Workers Builds; pushing to `main` deploys. Custom domains `ondevice.fun` and
`www.ondevice.fun` are declared in `wrangler.jsonc` routes.

## Design system

Dark neutral ground `#0C0D0F`, silver type `#F1F0EC`, secondary `#ADB0B7`, hairline
`#30333A`, restrained accent `#86DDC8`; light scheme mirrors it. Body text verified
≥4.5:1 in both. Inter (SIL OFL) self-hosted as variable woff2 subsets; monospace only
for commands, exact values and small release details. 1200px content cap, 48px desktop
gutters, 20px mobile, 4px-based spacing scale. Type scale: hero 42–104px, sections
36–56px, body 17px/1.6, metadata 12–13px. Buttons 46px tall, 8px radius.

## Motion

One easing family `cubic-bezier(0.22, 1, 0.36, 1)`; transform and opacity only.
Button 120–160ms, selection 160–200ms, showcase 220–280ms, viewer ~210ms, hero media
460ms. Hero copy and actions never wait for media. No scroll hijacking, no pinned
sequences, no perpetual motion. `prefers-reduced-motion` removes spatial entrances and
switches views with a minimal fade while keeping all feedback. Content is fully visible
without JavaScript (both story panels present; JS hides the inactive one).

## Facts

Versions, sizes, bundle ids, checksums, entitlements and platform requirements come
from the source repository's README, release assets and docs — never from screenshots.
When a build ships, update in **all three locales**: the edition rows, the technical
disclosure, and the footer checksum line.

## Verified

Builds green on every push; live checks at 360/390/768/1024/1440/1920 (no horizontal
overflow, no clipped headings, ≥44px targets); direct `#editions` arrival shows the
section heading below the sticky masthead; keyboard tab navigation with roving
tabindex; viewer opens with focus on Close, Escape closes, focus returns; legacy
anchors and paths redirect. Not verified: real-device install, conversion metrics.
