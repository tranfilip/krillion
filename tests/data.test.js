// Kontrola data/questions.js: soubor jde načíst, žádná prázdná ani zdvojená zadání a odpovědi.
// Spuštění: npm test
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const window = {};
new Function("window", readFileSync(root + "data/questions.js", "utf8"))(window);
const P = window.KRILLION_DATA;
const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

const errs = [];
if (!Array.isArray(P) || !P.length) errs.push("KRILLION_DATA chybí nebo je prázdné");
const qs = new Map();
P.forEach((row, n) => {
  const [lvl, q, a] = row;
  if (row.length !== 3 || typeof q !== "string" || typeof a !== "string") { errs.push(`řádek ${n}: špatný formát`); return; }
  if (![1, 2, 3, 4].includes(lvl)) errs.push(`${q}: obtížnost ${lvl}`);
  if (!q.startsWith("Jmenuj ")) errs.push(`${q}: zadání nezačíná „Jmenuj“`);
  if (qs.has(norm(q))) errs.push(`${q}: zadání je dvakrát`);
  qs.set(norm(q), n);
  const ents = a.split(",");
  if (ents.length < 7) errs.push(`${q}: jen ${ents.length} odpovědí`);
  for (const e of ents) for (const v of e.split("|"))
    if (!v || v !== v.trim() || !norm(v)) errs.push(`${q}: prázdná nebo neočištěná odpověď „${e}“`);
});
// Žádná odpověď nesmí být v jednom tématu dvakrát (po normalizaci: bez diakritiky, velikosti písmen a interpunkce).
P.forEach(([, q, a]) => {
  const seen = new Map();
  a.split(",").forEach((e, i) => e.split("|").forEach((v) => {
    const k = norm(v);
    if (seen.has(k) && seen.get(k) !== i) errs.push(`${q}: odpověď „${v}“ je dvakrát`);
    seen.set(k, i);
  }));
});
// Témata, kam se dá napsat cokoli, do hry nepatří.
for (const [, q] of P) if (/^Jmenuj (věc|něco)\b/.test(q)) errs.push(`${q}: neohraničené téma`);

const total = P.reduce((s, r) => s + r[2].split(",").length, 0);
if (errs.length) { console.log(errs.map((e) => "✗ " + e).join("\n")); console.log(`\n${errs.length} chyb`); process.exit(1); }
console.log(`Data v pořádku: ${P.length} témat, ${total} odpovědí`);
