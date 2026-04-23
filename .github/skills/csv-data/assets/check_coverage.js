/**
 * check_coverage.js
 * Generic coverage checker for any lat/lon column pair in a CSV.
 *
 * Usage:
 *   node check_coverage.js --lat lat_estudou --lon lon_estudou \
 *        --context "educated at" "onde estudou" \
 *        [--csv path/to/file.csv]
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_CSV = resolve(__dirname, '../../../../source/resultado_geolocalizado.csv');

function parseArgs(argv) {
  const args = { lat: null, lon: null, context: [], csv: DEFAULT_CSV };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--lat') args.lat = argv[++i];
    else if (a === '--lon') args.lon = argv[++i];
    else if (a === '--csv') args.csv = argv[++i];
    else if (a === '--context') {
      while (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
        args.context.push(argv[++i]);
      }
    }
  }
  return args;
}

function parseLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function parseCSV(text) {
  const clean = text.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/);
  const headers = parseLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });
    rows.push(row);
  }
  return { headers, rows };
}

function hasValue(v) {
  return v && v.trim() !== '';
}

function hasCoord(v) {
  return hasValue(v) && !isNaN(parseFloat(v));
}

const args = parseArgs(process.argv.slice(2));
if (!args.lat || !args.lon) {
  console.error('ERRO: --lat e --lon são obrigatórios');
  console.error('Uso: node check_coverage.js --lat <col> --lon <col> [--context <col1> <col2>...] [--csv <path>]');
  process.exit(1);
}

const raw = readFileSync(args.csv, 'utf8');
const { headers, rows } = parseCSV(raw);

if (!headers.includes(args.lat)) {
  console.error(`ERRO: coluna "${args.lat}" não encontrada no CSV`);
  console.error(`Colunas disponíveis: ${headers.join(', ')}`);
  process.exit(1);
}
if (!headers.includes(args.lon)) {
  console.error(`ERRO: coluna "${args.lon}" não encontrada no CSV`);
  process.exit(1);
}
for (const c of args.context) {
  if (!headers.includes(c)) {
    console.error(`AVISO: coluna de contexto "${c}" não encontrada — ignorando`);
  }
}

const total = rows.length;
const validContext = args.context.filter(c => headers.includes(c));

const withCoord = rows.filter(r => hasCoord(r[args.lat]) && hasCoord(r[args.lon]));
const withContext = validContext.length
  ? rows.filter(r => validContext.some(c => hasValue(r[c])))
  : [];

const gaps = withContext.filter(r => !hasCoord(r[args.lat]) || !hasCoord(r[args.lon]));
const orphans = validContext.length
  ? withCoord.filter(r => !validContext.some(c => hasValue(r[c])))
  : [];

const pct = (n) => `${((n / total) * 100).toFixed(1)}%`;

console.log(`=== Cobertura: ${args.lat} / ${args.lon} ===`);
console.log(`CSV                          : ${args.csv}`);
console.log(`Total de linhas              : ${total}`);
console.log(`Com coordenada               : ${withCoord.length} (${pct(withCoord.length)})`);
if (validContext.length) {
  console.log(`Com contexto preenchido      : ${withContext.length} (${pct(withContext.length)})`);
  console.log(`Contexto SEM coordenada (gap): ${gaps.length}`);
  console.log(`Coordenada SEM contexto      : ${orphans.length}`);
}

if (gaps.length > 0 && gaps.length <= 100) {
  console.log(`\n--- Gaps (contexto preenchido, sem coordenada) ---`);
  gaps.forEach(r => {
    const name = (r['creator'] ?? '(sem creator)').padEnd(40);
    const ctx = validContext.map(c => r[c]).filter(Boolean).join(' | ');
    console.log(`  ${name} | ${ctx}`);
  });
} else if (gaps.length > 100) {
  console.log(`\n(${gaps.length} gaps — lista omitida; rode com filtro adicional para inspecionar)`);
}
