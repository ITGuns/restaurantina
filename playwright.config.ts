import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end suite. Runs against a dev server on :3200 (reused if already up)
 * and the database in DATABASE_URL. Tests create clearly-labelled "QA" records
 * and remove them afterwards; point DATABASE_URL at a staging database when
 * the production data must not be touched.
 */
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3200";
const REMOTE = Boolean(process.env.PLAYWRIGHT_BASE_URL);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "tests/report" }]],
  use: {
    baseURL: BASE_URL,
    actionTimeout: 20_000,
    navigationTimeout: 90_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    { name: "public", testMatch: /public\/.*\.spec\.ts/, dependencies: ["setup"], use: { ...devices["Desktop Chrome"], viewport: { width: 1360, height: 900 } } },
    { name: "mobile", testMatch: /mobile\.spec\.ts/, dependencies: ["setup"], use: { ...devices["Pixel 7"] } },
    { name: "admin", testMatch: /admin\/.*\.spec\.ts/, dependencies: ["setup"], use: { ...devices["Desktop Chrome"], viewport: { width: 1360, height: 900 }, storageState: "tests/.auth/admin.json" } },
  ],
  webServer: REMOTE
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3200/robots.txt",
        reuseExistingServer: true,
        timeout: 180_000,
      },
});
