#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";

const ROOT = process.cwd();
const DIRS = ["src", "server", "shared"];
const EXTENSIONS = new Set([".ts", ".tsx"]);

// Any of these byte sequences in Turkish source means an encoding accident.
const MARKERS = [
  { label: "UTF-8 ikinci bayt (Ã)", value: "\u00c3" },
  { label: "UTF-8 ikinci bayt (Å)", value: "\u00c5" },
  { label: "replacement character", value: "\u00ef\u00bf\u00bd" },
];

function collectFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
    } else if (entry.isFile() && EXTENSIONS.has(extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = [];
for (const dir of DIRS) {
  try {
    files.push(...collectFiles(join(ROOT, dir)));
  } catch (error) {
    console.error(`[check:copy] ${dir}/ taranamadı: ${error.message}`);
    process.exit(1);
  }
}
files.sort();

const hits = [];
for (const file of files) {
  const lines = readFileSync(file, "utf8").split(/\r?\n/u);
  lines.forEach((line, lineIndex) => {
    for (const marker of MARKERS) {
      let column = line.indexOf(marker.value);
      while (column !== -1) {
        hits.push({
          file: relative(ROOT, file),
          line: lineIndex + 1,
          column: column + 1,
          marker: marker.label,
        });
        column = line.indexOf(marker.value, column + 1);
      }
    }
  });
}

if (hits.length > 0) {
  const MAX_PRINTED = 50;
  console.error(`[check:copy] ${hits.length} mojibake bulgusu:`);
  for (const hit of hits.slice(0, MAX_PRINTED)) {
    console.error(`  ${hit.file}:${hit.line}:${hit.column} -> "${hit.marker}"`);
  }
  if (hits.length > MAX_PRINTED) {
    console.error(`  ... ve ${hits.length - MAX_PRINTED} tane daha`);
  }
  process.exit(1);
}

console.log(`[check:copy] ${files.length} dosya temiz; mojibake yok.`);
