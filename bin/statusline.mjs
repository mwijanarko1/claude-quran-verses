#!/usr/bin/env node
/**
 * Status-line adapter for Claude Code and Cursor CLI.
 * Drains session JSON on stdin, prints one Quran verse.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

if (!process.stdin.isTTY) {
  process.stdin.resume();
  process.stdin.on("data", () => {});
  await new Promise((resolve) => process.stdin.on("end", resolve));
}

const verseBin = join(dirname(fileURLToPath(import.meta.url)), "quran-verse.mjs");
const result = spawnSync(process.execPath, [verseBin], {
  encoding: "utf8",
  timeout: 1500,
});
if (result.status !== 0) {
  process.stderr.write(result.stderr || "quran-verse failed\n");
  process.exit(result.status || 1);
}
process.stdout.write(result.stdout);
