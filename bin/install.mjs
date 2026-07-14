#!/usr/bin/env node
/**
 * Wire Quran verses into local agent status lines.
 * Primary: Claude Code. Also: Cursor CLI. Best-effort: Codex.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const home = homedir();
const here = dirname(fileURLToPath(import.meta.url));
const statusline = join(here, "statusline.mjs");
const verseBin = join(here, "quran-verse.mjs");
const cmd = `node ${JSON.stringify(statusline)}`;

for (const p of [statusline, verseBin, fileURLToPath(import.meta.url)]) {
  try {
    chmodSync(p, 0o755);
  } catch {
    // ignore
  }
}

function readJson(path, fallback = {}) {
  try {
    if (existsSync(path)) return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    // fall through
  }
  return structuredClone(fallback);
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

// --- Claude Code (primary) ---
const claudeSettings = join(home, ".claude/settings.json");
const claude = readJson(claudeSettings, {});
// Refresh every 10s so the verse rotates on a countdown, not only on activity.
claude.statusLine = {
  type: "command",
  command: cmd,
  refreshInterval: 10,
};
writeJson(claudeSettings, claude);
console.log(`Claude Code  statusLine → ${claudeSettings}`);

// --- Cursor CLI ---
const cursorConfig = join(home, ".cursor/cli-config.json");
const cursor = readJson(cursorConfig, {});
// Event-driven: Cursor re-runs on conversation updates (no forced timer).
cursor.statusLine = {
  type: "command",
  command: cmd,
  timeoutMs: 2000,
};
writeJson(cursorConfig, cursor);
console.log(`Cursor CLI   statusLine → ${cursorConfig}`);

// --- Codex (best-effort; no-op if unsupported) ---
const codexConfig = join(home, ".codex/config.toml");
if (existsSync(codexConfig)) {
  let toml = readFileSync(codexConfig, "utf8");
  if (/\bstatus_line\b/.test(toml)) {
    console.log("Codex        status_line already set — left unchanged");
  } else {
    const keys =
      `status_line = ["node", ${JSON.stringify(statusline)}]\n` +
      `status_line_timeout_ms = 800\n`;
    if (/^\[tui\]/m.test(toml)) {
      toml = toml.replace(/^(\[tui\][^\[]*)/m, (block) => {
        if (/\bstatus_line\b/.test(block)) return block;
        return block.replace(/\s*$/, "\n" + keys + "\n");
      });
    } else {
      toml =
        toml.replace(/\s*$/, "") +
        "\n\n# Quran verses in TUI status (ignored if this Codex build has no status_line)\n" +
        "[tui]\n" +
        keys;
    }
    writeFileSync(codexConfig, toml.endsWith("\n") ? toml : toml + "\n");
    console.log(`Codex        [tui].status_line → ${codexConfig} (verify in TUI)`);
  }
} else {
  console.log("Codex        no ~/.codex/config.toml — skipped");
}

console.log("");
console.log("Devin / Grok Build: no status-line API — not wired.");
console.log("");
console.log("Edition:");
console.log(`  node ${JSON.stringify(verseBin)} --list`);
console.log(`  node ${JSON.stringify(verseBin)} --set-edition en.saheeh`);
console.log("Test:");
console.log(`  node ${JSON.stringify(verseBin)}`);
console.log(`  echo '{}' | node ${JSON.stringify(statusline)}`);
