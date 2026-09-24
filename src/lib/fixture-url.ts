/** Origin Playwright can open from inside this process (works on Render's ephemeral container). */
export function loopbackOrigin() {
  const port = process.env.PORT?.trim() || "3000";
  return `http://127.0.0.1:${port}`;
}

export function fixturePageUrl(page: string) {
  const file = page.replace(/^\//, "");
  return `${loopbackOrigin()}/fixtures/demo-site/${file}`;
}

/**
 * Bundled fixture pages are served by this app. Always fetch them over loopback so a
 * scan does not depend on the public hostname or on a persistent disk.
 */
export function rewriteFixtureUrl(raw: string) {
  try {
    const url = new URL(raw);
    if (!url.pathname.startsWith("/fixtures/")) return raw;
    return `${loopbackOrigin()}${url.pathname}${url.search}`;
  } catch {
    return raw;
  }
}
