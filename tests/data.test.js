// Kontrola dat: data/questions.js (žádná prázdná ani zdvojená zadání a odpovědi),
// data/higher-lower.js a data/estimates.js (formát, kladné hodnoty, žádné duplicity, minimální počty).
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

// ---------- Vyšší, nebo nižší? (data/higher-lower.js) ----------
new Function("window", readFileSync(root + "data/higher-lower.js", "utf8"))(window);
const HL = window.KRILLION_HL;
let hlN = 0;
if (!HL || typeof HL.V !== "object" || !Array.isArray(HL.G)) errs.push("KRILLION_HL chybí nebo má špatný formát");
else {
  for (const [k, d] of Object.entries(HL.V))
    if (!Array.isArray(d) || typeof d[0] !== "string" || !d[0].endsWith("?") || typeof d[1] !== "string") errs.push(`HL veličina ${k}: špatná otázka nebo jednotka`);
  const names = new Map(), perV = new Map();
  HL.G.forEach((g, gi) => {
    const at = `HL skupina ${gi} (${g.v})`;
    if (!HL.V[g.v]) errs.push(`${at}: neznámá veličina`);
    if (typeof g.c !== "string" || !g.c) errs.push(`${at}: chybí kategorie`);
    if (g.min !== undefined && !(g.min >= 1.05)) errs.push(`${at}: min musí být aspoň 1,05 (rozdíl 5 %)`);
    if (!Array.isArray(g.i) || !g.i.length) { errs.push(`${at}: žádné položky`); return; }
    for (const it of g.i) {
      const [n, v, note] = it;
      if (typeof n !== "string" || !n || n !== n.trim()) errs.push(`${at}: špatný název „${n}“`);
      if (typeof v !== "number" || !Number.isFinite(v) || (!g.y && !(v > 0))) errs.push(`${at}: ${n} má špatnou hodnotu ${v}`);
      if (g.y && !(Number.isInteger(v) && v < new Date().getFullYear())) errs.push(`${at}: ${n} – rok vzniku ${v} není v minulosti`);
      if (note !== undefined && (typeof note !== "string" || !note)) errs.push(`${at}: ${n} – poznámka musí být text`);
      if (!g.s && note === undefined && g.v !== "pocet") errs.push(`${at}: ${n} – chybí zdroj nebo poznámka`);
      const key = g.v + ":" + norm(n);
      if (names.has(key)) errs.push(`HL ${g.v}: „${n}“ je dvakrát`);
      names.set(key, 1); hlN++;
      perV.set(g.v, (perV.get(g.v) || 0) + 1);
    }
  });
  HL.G.forEach((g, gi) => {
    if (![1, 2, 3].includes(g.f)) errs.push(`HL skupina ${gi} (${g.v}): známost f musí být 1–3`);
    for (const n of [...(g.k || []), ...(g.h || [])]) if (!g.i.some((x) => x[0] === n)) errs.push(`HL skupina ${gi} (${g.v}): „${n}“ v k/h není mezi položkami`);
  });
  // překvapivá srovnání
  const X = HL.X || [], seenX = new Set(), Y = new Date().getFullYear();
  X.forEach((row, n) => {
    const [q, u, A, B, fact, o = {}] = row, at = `překvapení ${n} (${q})`;
    if (typeof q !== "string" || !q.endsWith("?")) errs.push(`${at}: otázka musí končit otazníkem`);
    if (typeof u !== "string") errs.push(`${at}: jednotka musí být text`);
    if (typeof fact !== "string" || fact.length < 15 || !/[.!?]$/.test(fact)) errs.push(`${at}: chybí zajímavost (jedna věta)`);
    for (const P of [A, B]) if (!Array.isArray(P) || typeof P[0] !== "string" || typeof P[1] !== "number" || !Number.isFinite(P[1])) errs.push(`${at}: špatná položka ${JSON.stringify(P)}`);
    const va = o.y ? Y - A[1] : A[1], vb = o.y ? Y - B[1] : B[1];
    if (!(va > 0 && vb > 0)) errs.push(`${at}: hodnoty musí být kladné`);
    else if (Math.max(va, vb) / Math.min(va, vb) < 1.05) errs.push(`${at}: rozdíl ${A[0]} × ${B[0]} je pod 5 %`);
    const key = norm(q + A[0] + B[0]); if (seenX.has(key)) errs.push(`${at}: je dvakrát`); seenX.add(key);
  });
  if (X.length < 150) errs.push(`HL: jen ${X.length} překvapivých srovnání, cíl je aspoň 150`);
  for (const k of Object.keys(HL.V)) if ((perV.get(k) || 0) < 3) errs.push(`HL veličina ${k}: méně než 3 položky`);
  if (hlN < 400) errs.push(`HL: jen ${hlN} položek, cíl je aspoň 400`);
}

// ---------- Odhad (data/estimates.js) ----------
new Function("window", readFileSync(root + "data/estimates.js", "utf8"))(window);
const E = window.KRILLION_EST;
if (!Array.isArray(E)) errs.push("KRILLION_EST chybí");
else {
  const seenQ = new Set();
  E.forEach((row, n) => {
    const [c, q, v, u, note] = row;
    if (row.length < 4 || row.length > 5) { errs.push(`odhad ${n}: špatný formát`); return; }
    if (typeof c !== "string" || !c) errs.push(`${q}: chybí kategorie`);
    if (typeof q !== "string" || !q.endsWith("?") || q !== q.trim()) errs.push(`odhad ${n}: otázka „${q}“ musí končit otazníkem`);
    if (!(typeof v === "number" && Number.isFinite(v) && v > 0)) errs.push(`${q}: hodnota musí být kladné číslo (je ${v})`);
    if (typeof u !== "string") errs.push(`${q}: jednotka musí být text`);
    if (note !== undefined && (typeof note !== "string" || !note)) errs.push(`${q}: poznámka musí být text`);
    if (seenQ.has(norm(q))) errs.push(`${q}: otázka je dvakrát`);
    seenQ.add(norm(q));
  });
  if (E.length < 300) errs.push(`Odhad: jen ${E.length} otázek, cíl je aspoň 300`);
}

const total = P.reduce((s, r) => s + r[2].split(",").length, 0);
if (errs.length) { console.log(errs.map((e) => "✗ " + e).join("\n")); console.log(`\n${errs.length} chyb`); process.exit(1); }
console.log(`Data v pořádku: ${P.length} témat, ${total} odpovědí · vyšší/nižší ${hlN} položek a ${(HL.X || []).length} překvapení · odhad ${E.length} otázek`);
