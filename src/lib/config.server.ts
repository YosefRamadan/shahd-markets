import { getRuntimeEnv } from "@/lib/cloudflare-env";

// Server-only config. The .server.ts suffix prevents Vite from bundling
// this file into the client — values here never reach the browser.
//
// Cloudflare Pages exposes bindings at request time through the Worker env
// object. src/server.ts stores those bindings for the active runtime so server
// functions can read them without using Node-only environment globals.

export function getServerConfig() {
  return {
    nodeEnv: getRuntimeEnv("NODE_ENV") ?? import.meta.env.MODE,
  };
}
