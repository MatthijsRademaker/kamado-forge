import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export function resolveApiProxyTarget(environment: Record<string, string | undefined>): string {
  return environment.API_PROXY_TARGET ?? "http://localhost:3000";
}

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    allowedHosts: ["frontend"],
    proxy: {
      "/api": resolveApiProxyTarget(process.env),
    },
  },
});
