# claude-quran-verses

Show a complete-sentence Quran verse in your agent status line while you work.

**Primary target:** Claude Code  
**Also wired:** Cursor CLI  
**Best-effort:** Codex TUI status line (if supported by your build)

This is the same *concept* as [pi-quran-verses](https://github.com/mwijanarko1/pi-quran-verses) (a verse while the agent is busy), adapted to each tool’s real UI surface: a **status line**, not Pi’s working spinner.

Only complete-sentence verses are used (same curated pool as `pi-quran-verses`).

## Install

```bash
# from a local clone
node /Users/mikhail/claude-quran-verses/bin/install.mjs

# or after publish
npx claude-quran-verses
```

Then restart Claude Code / Cursor Agent / Codex.

The installer writes:

| Agent | Config |
|---|---|
| Claude Code | `~/.claude/settings.json` → `statusLine` (event-driven, no timer) |
| Cursor CLI | `~/.cursor/cli-config.json` → `statusLine` (event-driven) |
| Codex | `~/.codex/config.toml` → `[tui].status_line` (if not already set) |

## Usage

After install, verses appear in the status line automatically.

Pick a translation:

```bash
node bin/quran-verse.mjs --list
node bin/quran-verse.mjs --set-edition en.saheeh
node bin/quran-verse.mjs --set-edition en.haleem
```

Settings file:

```text
~/.claude-quran-verses.json
```

```json
{
  "editionId": "en.saheeh"
}
```

## Test without an agent

```bash
node bin/quran-verse.mjs
echo '{}' | node bin/statusline.mjs
```

## Languages

Same editions as `pi-quran-verses` (Arabic, English, Spanish, German, French, Urdu, Indonesian). Default: Saheeh International.

## Notes

- UI-only for Claude/Cursor: does not inject verses into the model context.
- Codex support depends on whether your Codex build honors `[tui].status_line`.
- Devin and Grok Build have no status-line/spinner API, so they are not wired.

## Package layout

```text
claude-quran-verses/
├── bin/
│   ├── install.mjs      # wire Claude + Cursor (+ Codex probe)
│   ├── statusline.mjs   # status-line entry (stdin JSON → verse)
│   └── quran-verse.mjs  # pick/print a verse
├── data/
│   └── editions.json    # bundled verse pools
├── package.json
└── README.md
```
