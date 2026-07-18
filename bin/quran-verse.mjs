#!/usr/bin/env node
/**
 * Print one random complete-sentence Quran verse.
 *
 *   quran-verse                 # random verse (active edition)
 *   quran-verse --edition ID
 *   quran-verse --list
 *   quran-verse --set-edition ID
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = join(packageDir, "data/editions.json");
const settingsPath = join(homedir(), ".claude-quran-verses.json");
const lastPath = join(homedir(), ".claude-quran-verses.last");
/** Hold the same verse this long so hosts that poll/event-fire don't thrash. */
const ROTATE_MS = Number(process.env.QURAN_VERSE_ROTATE_MS || 10_000);

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));

function loadSettings() {
  try {
    if (existsSync(settingsPath)) {
      const parsed = JSON.parse(readFileSync(settingsPath, "utf8"));
      if (parsed.editionId && catalog.editions.some((e) => e.id === parsed.editionId)) {
        return { editionId: parsed.editionId };
      }
    }
  } catch {
    // fall through
  }
  return { editionId: catalog.defaultEditionId };
}

function saveSettings(settings) {
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
}

function getEdition(id) {
  return catalog.editions.find((e) => e.id === id) ?? catalog.editions[0];
}

function pickVerse(edition, previous = "") {
  const verses = edition.verses;
  if (!verses.length) return "";
  if (verses.length === 1) return verses[0];
  let verse = verses[Math.floor(Math.random() * verses.length)];
  for (let i = 0; i < 8 && verse === previous; i++) {
    verse = verses[Math.floor(Math.random() * verses.length)];
  }
  return verse;
}

const args = process.argv.slice(2);

if (args.includes("--list")) {
  for (const e of catalog.editions) {
    console.log(`${e.id}\t${e.language} · ${e.translator}\t${e.verses.length}`);
  }
  process.exit(0);
}

const setIdx = args.indexOf("--set-edition");
if (setIdx !== -1) {
  const id = args[setIdx + 1];
  if (!id || !catalog.editions.some((e) => e.id === id)) {
    console.error("Unknown edition. Use --list.");
    process.exit(1);
  }
  saveSettings({ editionId: id });
  const e = getEdition(id);
  console.log(`edition: ${e.id} (${e.language} · ${e.translator})`);
  process.exit(0);
}

let editionId = loadSettings().editionId;
const edIdx = args.indexOf("--edition");
if (edIdx !== -1 && args[edIdx + 1]) editionId = args[edIdx + 1];

const edition = getEdition(editionId);
let previous = "";
let previousAt = 0;
try {
  if (existsSync(lastPath)) {
    const raw = readFileSync(lastPath, "utf8").trim();
    // format: "<verse>\n@<epochMs>" or legacy plain verse
    const at = raw.lastIndexOf("\n@");
    if (at !== -1 && /^\d+$/.test(raw.slice(at + 2))) {
      previous = raw.slice(0, at).trim();
      previousAt = Number(raw.slice(at + 2));
    } else {
      previous = raw;
    }
  }
} catch {
  // ignore
}

const now = Date.now();
let verse = previous;
if (!verse || !previousAt || now - previousAt >= ROTATE_MS) {
  verse = pickVerse(edition, previous);
  try {
    writeFileSync(lastPath, `${verse}\n@${now}\n`);
  } catch {
    // ignore
  }
}
process.stdout.write(verse + "\n");
