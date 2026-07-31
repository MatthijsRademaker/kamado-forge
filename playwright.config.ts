import { defineConfig, type PlaywrightTestConfig } from "@playwright/test";

export function createPlaywrightConfig(environment: Record<string, string | undefined>): PlaywrightTestConfig {
  const baseURL = environment.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

  return {
    testDir: "./e2e",
    fullyParallel: false,
    use: {
      baseURL,
      trace: "retain-on-failure",
    },
    ...(environment.PLAYWRIGHT_BASE_URL
      ? {}
      : {
          webServer: {
            command: "node_modules/.bin/vite frontend --host 0.0.0.0 --port 4173",
            url: baseURL,
            reuseExistingServer: false,
          },
        }),
  };
}

export default defineConfig(createPlaywrightConfig(process.env));
