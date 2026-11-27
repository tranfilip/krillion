// Testy režimů „Vyšší, nebo nižší?“ a „Odhad“. Spuštění: npm test
// Z src/game.js vyřízne blok „režimy: čísla, hodnocení a výběr“ (po značku „konec režimů“),
// takže testuje přesně ten kód, který běží ve hře.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const window = {};
for (const f of ["data/higher-lower.js", "data/estimates.js"]) new Function("window", readFileSync(root + f, "utf8"))(window);
const src = readFileSync(root + "src/game.js", "utf8");
const a = src.indexOf("/* ---------- režimy: čísla"), b = src.indexOf("/* ---------- konec režimů");
if (a < 0 || b < 0) throw new Error("V src/game.js chybí blok režimů");
const M = new Function("window", src.slice(a, b) + "\nreturn{parseNum,estScore,estDiff,fmtNum,fmtU,fmtHL,loadModes,saveModes,pickPair,pickEst,hlTarget,hlPoints,HLI,HLV,ESTQ};")(window);

let fail = 0;
const check = (ok, msg) => { if (!ok) { fail++; console.log("✗ " + msg); } };
const fakeLS = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) }; };
let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// 1) čísla od hráče
const NUM = [
  ["206", 206], [" 206 ", 206], ["1 500", 1500], ["1 500 000", 1500000], ["1 500", 1500], ["1,5", 1.5], ["63,5", 63.5],
  ["0,3", 0.3], ["1.5", 1.5], ["1.500", 1500], ["1.500.000", 1500000], ["1,500,000", 1500000], ["1.234,5", 1234.5],
  ["1,234.5", 1234.5], ["1,5 mil", 1.5e6], ["1,5 mil.", 1.5e6], ["1,5mil", 1.5e6], ["1,5 milionu", 1.5e6], ["3 miliony", 3e6],
  ["2 tis", 2000], ["2 tis.", 2000], ["2 tisíce", 2000], ["2tisíc", 2000], ["3k", 3000], ["3 k", 3000], ["2,5 mld", 2.5e9],
  ["8 miliard", 8e9], ["2 miliardy", 2e9], ["1 bilion", 1e12], ["milion", 1e6], ["tisíc", 1000], ["206 kostí", 206],
  ["330 m", 330], ["330m", 330], ["5 km", 5], ["12 kg", 12], ["~500", 500], ["asi 500", 500], ["cca 40", 40], ["1e6", 1e6],
  ["100,", 100], ["13,8 mld.", 13.8e9],
];
for (const [s, v] of NUM) { const r = M.parseNum(s); check(Math.abs(r - v) <= 1e-9 * v, `parseNum(„${s}“) = ${r}, čekáno ${v}`); }
for (const s of ["", "   ", "abc", "-5", "0", "1,2,3", "1.2.3", "km", "−3"]) check(Number.isNaN(M.parseNum(s)), `parseNum(„${s}“) má být neplatné, je ${M.parseNum(s)}`);

// 2) hodnocení odhadu: ±5 % maximum, do ±25 % hodně, do 2× trochu, dál nic; souměrně v logaritmu
const S = (g, t) => M.estScore(g, t);
check(S(206, 206).m === 1000 && S(206, 206).k === 0, "přesný tip musí dát maximum");
for (const g of [95, 96, 100, 104, 105]) check(S(g, 100).m === 1000, `tip ${g} u 100 (±5 %) musí dát maximum, dal ${S(g, 100).m}`);
for (const g of [80, 75.1, 120, 125]) check(S(g, 100).k === 1 && S(g, 100).m >= 450 && S(g, 100).m <= 800, `tip ${g} u 100 (do ±25 %) = „hodně“, dal ${JSON.stringify(S(g, 100))}`);
for (const g of [55, 60, 150, 199]) check(S(g, 100).k === 2 && S(g, 100).m >= 100 && S(g, 100).m <= 400, `tip ${g} u 100 (do 2×) = „trochu“, dal ${JSON.stringify(S(g, 100))}`);
for (const g of [49, 30, 201, 1000]) check(S(g, 100).m === 0 && S(g, 100).k === 3, `tip ${g} u 100 (víc než 2×) = nic, dal ${S(g, 100).m}`);
check(S(NaN, 100).m === 0 && S(NaN, 100).k === 4, "bez tipu = 0 m");
check(S(2e6, 1e6).m === S(5e5, 1e6).m, "2× víc a 2× míň musí dát stejně (logaritmicky)");
check(S(8.2e9 * 1.1, 8.2e9).m === S(4.24 * 1.1, 4.24).m, "stejná relativní chyba = stejně metrů u malých i obřích čísel");
let prev = 1e9; for (let g = 100; g <= 260; g += 2) { const m = S(g, 100).m; check(m <= prev, `metry musí s chybou klesat (tip ${g})`); prev = m; }
check(M.estDiff(206, 206) === "přesně" && M.estDiff(110, 100) === "o 10 % víc" && M.estDiff(90, 100) === "o 10 % míň" && M.estDiff(300, 100) === "3× víc" && M.estDiff(25, 100) === "4× míň", "texty chyby: " + [M.estDiff(110, 100), M.estDiff(90, 100), M.estDiff(300, 100), M.estDiff(25, 100)].join(" | "));

// 3) zobrazení hodnot
const F = [[1384000, "1,384 mil."], [8.2e9, "8,2 mld."], [17098246, "17 098 246"], [63.5, "63,5"], [42.195, "42,195"], [206, "206"], [0.49, "0,49"], [2073600, "2 073 600"]];
for (const [v, t] of F) check(M.fmtNum(v).replace(/\s/g, " ") === t, `fmtNum(${v}) = „${M.fmtNum(v)}“, čekáno „${t}“`);
check(M.fmtU(0.171, "kg").replace(/\s/g, " ") === "171 g" && M.fmtU(8850000, "m").replace(/\s/g, " ") === "8 850 km" && M.fmtU(3, "let") === "3 roky", "jednotky: g / km / roky");

// 4) vyšší/nižší: 40 her s reloadem mezi hrami
{
  const ls = fakeLS(); const seen = new Set(); let asked = 0, repeat = null, bad = null, crossV = null;
  const ratioAt = {};
  for (let g = 1; g <= 40; g++) {
    const ms = M.loadModes(ls); const run = { n: 0, items: new Set(), vc: {}, lastV: [] }; const len = 5 + Math.floor(rnd() * 40);
    for (let i = 1; i <= len; i++) {
      run.n = i; const p = M.pickPair(ms, run, rnd); asked++;
      if (!p) { bad = bad || `hra ${g}: nenašel se pár`; break; }
      const [x, y] = p.side, r = Math.max(x.val, y.val) / Math.min(x.val, y.val);
      if (x.v !== y.v || x.v !== p.v) crossV = crossV || `${x.n} (${x.v}) × ${y.n} (${y.v})`;
      if (!(r >= 1.05 - 1e-12) || r < Math.max(x.min, y.min) - 1e-12) bad = bad || `${x.n} × ${y.n}: poměr ${r.toFixed(3)} je pod limitem`;
      if (x.id === y.id) bad = bad || `${x.n} sám se sebou`;
      const k = [x.id, y.id].sort().join("|"); if (seen.has(k)) repeat = repeat || `hra ${g}: pár ${k} se opakoval`; seen.add(k);
      (ratioAt[i] = ratioAt[i] || []).push(Math.log(r));
    }
    M.saveModes(ls, ms);
  }
  check(!crossV, "pár musí mít stejnou veličinu: " + crossV);
  check(!bad, "chybný pár: " + bad);
  check(!repeat, "pár se mezi hrami nesmí opakovat: " + repeat);
  const avg = (n) => { const a = ratioAt[n] || []; return Math.exp(a.reduce((s, x) => s + x, 0) / a.length); };
  check(avg(1) > avg(10) && avg(10) > avg(25), `hra musí přitvrzovat: poměr v otázce 1 ≈ ${avg(1).toFixed(2)}, 10 ≈ ${avg(10).toFixed(2)}, 25 ≈ ${avg(25).toFixed(2)}`);
  console.log(`Vyšší/nižší: 40 her, ${asked} otázek, ${seen.size} různých párů, průměrný poměr #1 ${avg(1).toFixed(2)}× → #10 ${avg(10).toFixed(2)}× → #25 ${avg(25).toFixed(2)}×`);
}

// 5) v jednom ponoru se položka neopakuje a veličiny se střídají
{
  const ms = M.loadModes(fakeLS()); const run = { n: 0, items: new Set(), vc: {}, lastV: [] }; const used = new Set(); let lastV = null, same = 0;
  for (let i = 1; i <= 80; i++) { run.n = i; const p = M.pickPair(ms, run, rnd); for (const x of p.side) { check(!used.has(x.id), `položka ${x.n} padla v ponoru dvakrát`); used.add(x.id); } if (p.v === lastV) same++; lastV = p.v; }
  check(same <= 2, `veličina se v ponoru zopakovala hned po sobě ${same}×`);
}

// 6) odhad: otázka se zopakuje až po vystřídání všech (i přes reloady), v ponoru 10 různých
{
  const ls = fakeLS(); const cnt = new Map(M.ESTQ.map((q) => [q.q, 0])); let bad = null, inRun = null;
  for (let g = 1; g <= 80; g++) {
    const ms = M.loadModes(ls); const run = { qs: new Set(), cats: [] }; const qs = new Set();
    for (let i = 0; i < 10; i++) {
      const p = M.pickEst(ms, run, rnd); const c = cnt.get(p.q), min = Math.min(...cnt.values());
      if (c > min) bad = bad || `hra ${g}: „${p.q}“ podruhé, ale jiná otázka má jen ${min}×`;
      if (qs.has(p.q)) inRun = `hra ${g}: „${p.q}“ dvakrát v jednom ponoru`;
      qs.add(p.q); cnt.set(p.q, c + 1);
    }
    M.saveModes(ls, ms);
  }
  check(!bad, "odhad – opakování: " + bad); check(!inRun, inRun);
  const v = [...cnt.values()]; console.log(`Odhad: 80 her, každá otázka ${Math.min(...v)}–${Math.max(...v)}×`);
}

// 7) rekordy a poškozené uložení
{
  const ls = fakeLS(); const ms = M.loadModes(ls); ms.hl.best = 1230; ms.est.best = 7400; M.saveModes(ls, ms);
  const m2 = M.loadModes(ls); check(m2.hl.best === 1230 && m2.est.best === 7400, "rekordy se po reloadu musí načíst");
  ls.setItem("krillion-rezimy1", "{rozbité"); check(M.loadModes(ls).hl.best === 0, "rozbité uložení = čistý stav");
  ls.setItem("krillion-rezimy1", JSON.stringify({ hl: { pairs: "x", it: [], best: "12" }, est: { cnt: [], last: 5 } }));
  const m3 = M.loadModes(ls); check(Array.isArray(m3.hl.pairs) && !Array.isArray(m3.hl.it) && m3.hl.best === 12 && !Array.isArray(m3.est.cnt) && typeof m3.est.last === "object", "špatné typy v uložení se musí opravit");
}

console.log(fail ? `\n${fail} testů režimů selhalo` : "Testy režimů prošly");
process.exit(fail ? 1 : 0);
