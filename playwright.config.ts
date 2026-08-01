import { defineConfig, type PlaywrightTestConfig } from "@playwright/test";

const developmentURL = "http://127.0.0.1:4173";
const previewURL = "http://127.0.0.1:4174";

export function createPlaywrightConfig(environment: Record<string, string | undefined>): PlaywrightTestConfig {
  const externalBaseURL = environment.PLAYWRIGHT_BASE_URL;
  const sharedConfig: PlaywrightTestConfig = {
    testDir: "./e2e",
    fullyParallel: false,
    use: {
      trace: "retain-on-failure",
    },
  };

  if (externalBaseURL) {
    return {
      ...sharedConfig,
      use: {
        ...sharedConfig.use,
        baseURL: externalBaseURL,
      },
    };
  }

  return {
    ...sharedConfig,
    projects: [
      { name: "vite-development", use: { baseURL: developmentURL } },
      { name: "vite-preview", use: { baseURL: previewURL } },
    ],
    webServer: [
      {
        command: "node_modules/.bin/vite frontend --host 0.0.0.0 --port 4173",
        url: developmentURL,
        reuseExistingServer: false,
      },
      {
        command:
          "node_modules/.bin/vite build frontend && node_modules/.bin/vite preview frontend --host 0.0.0.0 --port 4174",
        url: previewURL,
        reuseExistingServer: false,
      },
    ],
  };
}

export default defineConfig(createPlaywrightConfig(process.env));
