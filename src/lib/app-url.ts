function readEnv(name: string) {
  const value = process.env[name];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Public URL for redirects and links.
 * Dynamic env access so Next.js does not inline a build-time localhost value.
 * On Render, scripts/start.mjs copies RENDER_EXTERNAL_URL into AUTH_URL and APP_URL.
 */
export function appBaseUrl() {
  const value =
    readEnv("APP_URL") ||
    readEnv("RENDER_EXTERNAL_URL") ||
    readEnv("AUTH_URL") ||
    readEnv("NEXT_PUBLIC_APP_URL") ||
    "http://localhost:3000";
  return value.replace(/\/$/, "");
}
