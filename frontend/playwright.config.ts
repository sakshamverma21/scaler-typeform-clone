import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

const python =
  process.env.PYTHON_EXECUTABLE ??
  resolve(
    process.platform === "win32"
      ? "../backend/.venv/Scripts/python.exe"
      : "../backend/.venv/bin/python",
  );
const backendCommand = `"${python}" -m uvicorn app.main:app --host 127.0.0.1 --port 18080`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://localhost:13000", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: backendCommand,
      cwd: "../backend",
      url: "http://127.0.0.1:18080/api/v1/health/ready",
      reuseExistingServer: false,
      env: {
        TYPEFORM_ENVIRONMENT: "test",
        TYPEFORM_DATABASE_PATH: resolve(".cache/e2e/foundation.sqlite3"),
        TYPEFORM_ALLOWED_ORIGINS: '["http://localhost:13000"]',
        TYPEFORM_FOUNDATION_PROBE_ENABLED: "true",
      },
    },
    {
      command: `"${process.execPath}" scripts/start-production.mjs`,
      url: "http://localhost:13000/forms",
      reuseExistingServer: false,
      env: {
        API_BACKEND_URL: "http://127.0.0.1:18080",
        NEXT_PUBLIC_FOUNDATION_PROBE_ENABLED: "true",
        PORT: "13000",
      },
      timeout: 120_000,
    },
  ],
});
