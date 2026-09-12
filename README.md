# ondevice.fun

Static promotional site for [OnDevice](https://github.com/Mesutcydev/ios-local-llm), with English (`/`), Turkish (`/tr/`), and Simplified Chinese (`/zh/`) pages.

## Develop

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory public
```

Open http://127.0.0.1:8765. No bundler or package install is required.

## Design

White and soft-gray surfaces, charcoal text, neutral product stages, and a restrained blue accent. Self-hosted Inter provides consistent typography across the site. The responsive hero keeps the main download and source actions beside a complete screenshot on desktop and above it on mobile.

Product imagery uses existing, unmodified simulator captures inside simple device frames. The mobile gallery scrolls horizontally; each image opens in a keyboard-accessible viewer. Product editions, installation steps, architecture, API examples, and source links share a consistent spacing and border system. Technical details remain expandable.

The header theme toggle supports light and dark modes. It follows the operating system until a choice is made, then remembers the choice in local storage across locales. A small script in the document head applies the saved theme before rendering. On narrow screens, language selection remains available in the mobile menu.

All three locales share `public/shell/site.css` and `public/shell/site.js`. Locale-specific content lives in each `index.html`. Keep release metadata and links synchronized across these pages when updating builds. Product facts are sourced from the software repository; this design refresh does not update releases or platform requirements.

## Structure

- `public/index.html`, `public/tr/index.html`, `public/zh/index.html`: localized pages
- `public/shell/`: shared styles and interactions
- `public/assets/`: screenshots, icons, share cards, self-hosted fonts
- `public/_headers`, `public/_redirects`: hosting configuration
- `wrangler.jsonc`: Cloudflare Worker assets and domain configuration

## Deployment

Workers Builds uses Wrangler through `npx`. Pushing to `main` deploys to the configured domains. Use a feature branch for design review before merging.

## Verification

Check all locales at narrow mobile, tablet, and desktop widths. Verify no document overflow, image loading, screenshot open/close and focus return, mobile navigation, API copy feedback, technical details, and reduced-motion behavior. The hidden viewer image intentionally has no source until opened.
