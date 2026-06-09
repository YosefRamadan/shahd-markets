export type CloudflareRuntimeEnv = Record<string, string | undefined>;

declare global {
  // Set once per Cloudflare Worker/Pages Function request by src/server.ts.
  // This avoids Node-only environment globals access and keeps secrets in runtime bindings.
  // eslint-disable-next-line no-var
  var __SHAHD_CLOUDFLARE_ENV__: CloudflareRuntimeEnv | undefined;
}

export function setCloudflareRuntimeEnv(env: unknown) {
  if (env && typeof env === "object") {
    globalThis.__SHAHD_CLOUDFLARE_ENV__ = env as CloudflareRuntimeEnv;
  }
}

export function getRuntimeEnv(name: string): string | undefined {
  const runtimeValue = globalThis.__SHAHD_CLOUDFLARE_ENV__?.[name];
  if (runtimeValue) return runtimeValue;

  const viteEnv = import.meta.env as Record<string, string | undefined>;
  return viteEnv[name];
}

export function getRequiredRuntimeEnv(name: string): string {
  const value = getRuntimeEnv(name);
  if (!value) {
    throw new Error(
      `Missing required Cloudflare environment variable: ${name}. Configure it in Cloudflare Pages before deploying.`,
    );
  }
  return value;
}

export function getPublicRuntimeEnv(name: string): string | undefined {
  return getRuntimeEnv(`VITE_${name}`) ?? getRuntimeEnv(name);
}

export function getRequiredPublicRuntimeEnv(name: string): string {
  const value = getPublicRuntimeEnv(name);
  if (!value) {
    throw new Error(
      `Missing required public environment variable: VITE_${name} (or runtime binding ${name}).`,
    );
  }
  return value;
}
