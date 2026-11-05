const canonicalOrigin = "https://ondevice.fun";

const pageDirectories = new Set([
  "/", "/tr/", "/zh/", "/support/", "/privacy/",
  "/token-ai/", "/local-ai-studio/", "/iphone-local-api/",
  "/guides/run-local-llm-on-iphone/",
]);

const legacyPages = new Map([
  ["/ondevice.html", "/iphone-local-api/"],
  ["/studio", "/local-ai-studio/"],
  ["/las", "/iphone-local-api/"],
  ["/showcase", "/token-ai/"],
  ["/requirements", "/#install"],
  ["/security", "/#security"],
  ["/max", "/token-ai/"],
  ["/core", "/local-ai-studio/"],
  ["/image", "/#create"],
]);

function canonicalPath(pathname) {
  const legacy = legacyPages.get(pathname.replace(/\/$/, ""));
  if (legacy) return legacy;

  const directory = pathname.endsWith("/index.html")
    ? pathname.slice(0, -"index.html".length)
    : `${pathname}/`;
  return pageDirectories.has(directory) ? directory : pathname;
}

export default {
  fetch(request, env) {
    const url = new URL(request.url);
    const path = canonicalPath(url.pathname);
    const hasAlternateOrigin = url.hostname === "www.ondevice.fun"
      || (url.hostname === "ondevice.fun" && url.protocol === "http:");

    if (!hasAlternateOrigin && path === url.pathname) return env.ASSETS.fetch(request);

    // Use a fixed origin and keep the original query. Legacy fragments stay on their targets.
    const target = new URL(canonicalOrigin);
    const [pathname, hash] = path.split("#");
    target.pathname = pathname;
    target.hash = hash ?? "";
    target.search = url.search;
    return Response.redirect(target.href, 308);
  },
};
