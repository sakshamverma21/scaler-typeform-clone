import { cpSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Standalone builds omit static assets; package them just as the Dockerfile does.
const staticSource = new URL("../.next/static/", import.meta.url);
const staticDestination = new URL(
  "../.next/standalone/.next/static/",
  import.meta.url,
);
cpSync(fileURLToPath(staticSource), fileURLToPath(staticDestination), {
  recursive: true,
});
process.env.HOSTNAME = "0.0.0.0";
await import(new URL("../.next/standalone/server.js", import.meta.url).href);
