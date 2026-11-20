import { defineConfig, devices } from '@playwright/test'

const appPort = Number(process.env.E2E_APP_PORT ?? 3000)
const apiPort = Number(process.env.E2E_API_PORT ?? 3100)

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: `http://127.0.0.1:${appPort}`,
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node tests/e2e/fixture-server.mjs',
      url: `http://127.0.0.1:${apiPort}/health`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npm run dev -- --port ${appPort}`,
      url: `http://127.0.0.1:${appPort}`,
      reuseExistingServer: !process.env.CI,
      env: {
        ...process.env,
        DEADLOCK_API_BASE_URL: `http://127.0.0.1:${apiPort}`,
        E2E_API_PORT: String(apiPort),
        PUBLIC_ORIGIN: `http://127.0.0.1:${appPort}`,
      },
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
})
