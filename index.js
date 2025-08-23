import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const distServerPath = resolve(process.cwd(), "dist/server/node-build.mjs");

if (!existsSync(distServerPath)) {
  console.log("dist not found. Building client and server...");
  const result = spawnSync("npm", ["run", "build"], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    console.error("Build failed. Exiting.");
    process.exit(result.status || 1);
  }
}

await import(pathToFileURL(distServerPath).href);