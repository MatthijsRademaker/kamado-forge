import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node_modules/.bin/vite frontend --host 0.0.0.0 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
  },
});
