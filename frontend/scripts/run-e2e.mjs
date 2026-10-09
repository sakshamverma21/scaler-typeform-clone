import { spawnSync } from "node:child_process";

// Build the real rewrite for dedicated test ports, keeping developer servers separate.
const environment = {
  ...process.env,
  API_BACKEND_URL: "http://127.0.0.1:18080",
  NEXT_PUBLIC_FOUNDATION_PROBE_ENABLED: "true",
  NEXT_TELEMETRY_DISABLED: "1",
};
for (const arguments_ of [
  ["node_modules/next/dist/bin/next", "build"],
  ["node_modules/@playwright/test/cli.js", "test", ...process.argv.slice(2)],
]) {
  const result = spawnSync(process.execPath, arguments_, {
    env: environment,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
