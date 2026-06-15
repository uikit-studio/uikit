/**
 * Cloudflare bindings for the web app. D1/R2/KV are added in Phase 4 and
 * declared in wrangler.jsonc; this type and accessor mirror that shape.
 */
export interface CloudflareEnv {
  APP_URL?: string;
}

export function getEnv(context?: unknown): CloudflareEnv {
  const cf = (context as { cloudflare?: { env: CloudflareEnv } } | undefined)?.cloudflare;
  if (cf?.env) return cf.env;
  return process.env as unknown as CloudflareEnv;
}
