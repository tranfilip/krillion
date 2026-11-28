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
const M = new Function("window", src.slice(a, b) + "\nreturn{parseNum,estScore,estDiff,fmtNum,fmtU,fmtHL,loadModes,saveModes,pickPair,pickEst,hlLvl,pairLevel,hlPoints,streakBonus,HLI,HLV,HLX,ESTQ};")(window);

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

// 2) hodnocení odhadu: plynulá křivka podle r = max(tip/skutečnost, skutečnost/tip)
//    r ≤ 1,05 → maximum, r = 2 → asi polovina, 10 → 40–60 m, 100 → 15–25 m, 1 000 → asi 5 m, víc → 0
const S = (g, t) => M.estScore(g, t);
const TABLE = [ // [tip, skutečnost, nejméně m, nejvýš m, nadpis]
  [206, 206, 1000, 1000, 0], [100, 105, 1000, 1000, 0], [104, 100, 1000, 1000, 0], [95.5, 100, 1000, 1000, 0],
  [120, 100, 800, 950, 1], [80, 100, 800, 950, 1], [150, 100, 550, 750, 2], [2, 1, 480, 520, 2], [5e5, 1e6, 480, 520, 2],
  [300, 100, 200, 400, 3], [10, 1, 40, 60, 3], [1e6, 1e5, 40, 60, 3], [8.2e8, 8.2e9, 40, 60, 3],
  [30, 1000, 20, 40, 4], [1, 100, 15, 25, 4], [1e4, 5.5e6, 3, 12, 4], [1, 1000, 4, 6, 4], [20, 2e7, 0, 0, 4], [1e7, 1, 0, 0, 4],
];
for (const [g, t, lo, hi, k] of TABLE) { const r = S(g, t); check(r.m >= lo && r.m <= hi && r.k === k, `tip ${g} u ${t}: ${r.m} m, nadpis ${r.k} (čekáno ${lo}–${hi} m, nadpis ${k})`); }
check(S(1e4, 5.5e6).m > 0, "tip 550× vedle musí dát aspoň pár metrů");
check(S(NaN, 100).m === 0 && S(NaN, 100).k === 5, "bez tipu = 0 m");
check(S(2e6, 1e6).m === S(5e5, 1e6).m, "2× víc a 2× míň musí dát stejně (logaritmicky)");
check(S(8.2e9 * 1.3, 8.2e9).m === S(4.24 * 1.3, 4.24).m, "stejná relativní chyba = stejně metrů u malých i obřích čísel");
let prev = 1e9; for (let r = 1; r <= 1200; r *= 1.07) { const m = S(100 * r, 100).m; check(m <= prev, `metry musí s chybou klesat (r ${r.toFixed(2)})`); prev = m; }
console.log("Křivka odhadu: " + [1.05, 1.25, 2, 10, 100, 550, 1000, 1001].map((r) => `${r}× → ${S(r, 1).m} m`).join(", "));
check(M.estDiff(206, 206) === "přesně" && M.estDiff(110, 100) === "o 10 % víc" && M.estDiff(90, 100) === "o 10 % míň" && M.estDiff(300, 100) === "3× víc" && M.estDiff(25, 100) === "4× míň", "texty chyby: " + [M.estDiff(110, 100), M.estDiff(90, 100), M.estDiff(300, 100), M.estDiff(25, 100)].join(" | "));

// 3) zobrazení hodnot
const F = [[1384000, "1,384 mil."], [8.2e9, "8,2 mld."], [17098246, "17 098 246"], [63.5, "63,5"], [42.195, "42,195"], [206, "206"], [0.49, "0,49"], [2073600, "2 073 600"]];
for (const [v, t] of F) check(M.fmtNum(v).replace(/\s/g, " ") === t, `fmtNum(${v}) = „${M.fmtNum(v)}“, čekáno „${t}“`);
check(M.fmtU(0.171, "kg").replace(/\s/g, " ") === "171 g" && M.fmtU(8850000, "m").replace(/\s/g, " ") === "8 850 km" && M.fmtU(3, "let") === "3 roky", "jednotky: g / km / roky");

// 4) vyšší/nižší: 40 her s reloadem mezi hrami
{
  const ls = fakeLS(); const seen = new Set(); let asked = 0, repeat = null, bad = null, crossV = null;
  const ratioAt = {}, lvlAt = {}, sxCnt = new Map(); let surprises = 0;
  for (let g = 1; g <= 40; g++) {
    const ms = M.loadModes(ls); const run = { n: 0, items: new Set(), vc: {}, lastV: [] }; const len = 5 + Math.floor(rnd() * 40);
    for (let i = 1; i <= len; i++) {
      run.n = i; const p = M.pickPair(ms, run, rnd); asked++;
      if (!p) { bad = bad || `hra ${g}: nenašel se pár`; break; }
      const [x, y] = p.side, r = Math.max(x.val, y.val) / Math.min(x.val, y.val);
      if (x.v !== y.v || x.v !== p.v) crossV = crossV || `${x.n} (${x.v}) × ${y.n} (${y.v})`;
      if (!(r >= 1.05 - 1e-12) || r < Math.max(x.min, y.min) - 1e-12) bad = bad || `${x.n} × ${y.n}: poměr ${r.toFixed(3)} je pod limitem`;
      if (x.id === y.id) bad = bad || `${x.n} sám se sebou`;
      const k = [x.id, y.id].sort().join("|");
      if (p.fact) { // překvapení se smí zopakovat až po vystřídání všech
        const c = sxCnt.get(k) || 0, min = sxCnt.size < M.HLX.length ? 0 : Math.min(...sxCnt.values());
        if (c > min) repeat = repeat || `hra ${g}: překvapení ${k} podruhé dřív, než padla všechna`; sxCnt.set(k, c + 1);
      } else { if (seen.has(k)) repeat = repeat || `hra ${g}: pár ${k} se opakoval`; seen.add(k); }
      if (p.fact) surprises++; else (ratioAt[i] = ratioAt[i] || []).push(Math.log(r));
      (lvlAt[i] = lvlAt[i] || []).push(p.lvl);
      if (!(p.lvl >= 1 && p.lvl <= 4)) bad = bad || `obtížnost ${p.lvl}`;
      if (i <= 4 && !p.fact && Math.max(x.f, y.f) > 1 && r < 3) bad = bad || `lehká otázka ${i} s méně známou položkou: ${x.n} × ${y.n}`;
    }
    M.saveModes(ls, ms);
  }
  check(!crossV, "pár musí mít stejnou veličinu: " + crossV);
  check(!bad, "chybný pár: " + bad);
  check(!repeat, "pár se mezi hrami nesmí opakovat: " + repeat);
  const avg = (n) => { const a = ratioAt[n] || []; return Math.exp(a.reduce((s, x) => s + x, 0) / a.length); };
  check(avg(1) > avg(10) && avg(10) > avg(25), `hra musí přitvrzovat: poměr v otázce 1 ≈ ${avg(1).toFixed(2)}, 10 ≈ ${avg(10).toFixed(2)}, 25 ≈ ${avg(25).toFixed(2)}`);
  const lv = (a, b) => { const x = []; for (let n = a; n <= b; n++) x.push(...(lvlAt[n] || [])); return x.reduce((s, v) => s + v, 0) / x.length; };
  check(lv(1, 4) < 1.6 && lv(5, 9) > lv(1, 4) && lv(10, 15) > lv(5, 9) && lv(16, 40) > 3.2, `obtížnost musí růst: 1–4 ≈ ${lv(1, 4).toFixed(2)}, 5–9 ≈ ${lv(5, 9).toFixed(2)}, 10–15 ≈ ${lv(10, 15).toFixed(2)}, 16+ ≈ ${lv(16, 40).toFixed(2)}`);
  check(surprises > 50, `překvapivá srovnání musí padat (padlo ${surprises})`);
  console.log(`Obtížnost: otázky 1–4 ≈ ${lv(1, 4).toFixed(2)}, 5–9 ≈ ${lv(5, 9).toFixed(2)}, 10–15 ≈ ${lv(10, 15).toFixed(2)}, 16+ ≈ ${lv(16, 40).toFixed(2)} · překvapení ${surprises}×`);
  console.log(`Vyšší/nižší: 40 her, ${asked} otázek, ${seen.size} různých párů, průměrný poměr #1 ${avg(1).toFixed(2)}× → #10 ${avg(10).toFixed(2)}× → #25 ${avg(25).toFixed(2)}×`);
}

// 5) v jednom ponoru se položka neopakuje a veličiny se střídají
{
  const ms = M.loadModes(fakeLS()); const run = { n: 0, items: new Set(), vc: {}, lastV: [] }; const used = new Set(); let lastV = null, same = 0;
  for (let i = 1; i <= 80; i++) { run.n = i; const p = M.pickPair(ms, run, rnd); for (const x of p.side) { check(!used.has(x.id), `položka ${x.n} padla v ponoru dvakrát`); used.add(x.id); } if (p.v === lastV) same++; lastV = p.v; }
  check(same <= 2, `veličina se v ponoru zopakovala hned po sobě ${same}×`);
}

// 5b) body podle obtížnosti a série
check([1, 2, 3, 4].map(M.hlPoints).join() === "100,150,200,300", "body: lehká ×1, střední ×1,5, těžká ×2, expert ×3 = " + [1, 2, 3, 4].map(M.hlPoints).join());
check(M.streakBonus(5) === 0 && M.streakBonus(6) === 300 && M.streakBonus(12) === 600 && M.streakBonus(18) === 900 && M.streakBonus(7) === 0, "bonus série 6/12/18 = 300/600/900 m");
check(M.hlLvl(1) === 1 && M.hlLvl(4) === 1 && M.hlLvl(5) === 2 && M.hlLvl(10) === 3 && M.hlLvl(16) === 4, "cílová obtížnost: 1–4, 5–9, 10–15, 16+");
check(M.pairLevel(Math.log(4), 1) === 1 && M.pairLevel(Math.log(1.1), 1) === 4 && M.pairLevel(Math.log(4), 3) === 3, "obtížnost páru z poměru a známosti");
check(M.HLX.length >= 150, `překvapivých srovnání je jen ${M.HLX.length}`);
for (const x of M.HLX) if (!(x.lr >= Math.log(1.05) - 1e-12)) check(false, `překvapení „${x.q}“ ${x.a.n} × ${x.b.n}: rozdíl pod 5 %`);

// 6) odhad: otázka se zopakuje až po vystřídání všech (i přes reloady), v ponoru 10 různých
{
  const ls = fakeLS(); const cnt = new Map(M.ESTQ.map((q) => [q.q, 0])); let bad = null, inRun = null, early = null;
  for (let g = 1; g <= 80; g++) {
    const ms = M.loadModes(ls); const run = { qs: new Set(), cats: [] }; const qs = new Set();
    for (let i = 0; i < 10; i++) {
      const p = M.pickEst(ms, run, rnd); const c = cnt.get(p.q), min = Math.min(...cnt.values());
      if (c > min) bad = bad || `hra ${g}: „${p.q}“ podruhé, ale jiná otázka má jen ${min}×`;
      if (qs.has(p.q)) inRun = `hra ${g}: „${p.q}“ dvakrát v jednom ponoru`;
      if (g <= 30 && c > 0) early = early || `hra ${g}: „${p.q}“ se zopakovala už během prvních 30 her`;
      qs.add(p.q); cnt.set(p.q, c + 1);
    }
    M.saveModes(ls, ms);
  }
  check(!bad, "odhad – opakování: " + bad); check(!inRun, inRun);
  check(!early, early); // 30 her × 10 otázek je méně než všech otázek → žádné opakování
  const v = [...cnt.values()]; console.log(`Odhad: 80 her, každá otázka ${Math.min(...v)}–${Math.max(...v)}×`);
}

// 7) rekordy a poškozené uložení
{
  const ls = fakeLS(); const ms = M.loadModes(ls); ms.hl.best = 1230; ms.est.best = 7400; M.saveModes(ls, ms);
  const m2 = M.loadModes(ls); check(m2.hl.best === 1230 && m2.est.best === 7400, "rekordy se po reloadu musí načíst");
  ls.setItem("krillion-rezimy1", "{rozbité"); check(M.loadModes(ls).hl.best === 0, "rozbité uložení = čistý stav");
  ls.setItem("krillion-rezimy1", JSON.stringify({ hl: { pairs: "x", it: [], best: "12" }, est: { cnt: [], last: 5 } }));
  const m3 = M.loadModes(ls); check(Array.isArray(m3.hl.pairs) && !Array.isArray(m3.hl.it) && m3.hl.best === 12 && !Array.isArray(m3.est.cnt) && typeof m3.est.last === "object", "špatné typy v uložení se musí opravit");
  ls.setItem("krillion-rezimy1", JSON.stringify({ hl: { scores: [100, "x", null, 250] }, est: { scores: "nic" } }));
  const m4 = M.loadModes(ls); check(m4.hl.scores.join() === "100,250" && Array.isArray(m4.est.scores) && !m4.est.scores.length, "výsledky posledních her: jen čísla, jinak prázdné pole");
}

console.log(fail ? `\n${fail} testů režimů selhalo` : "Testy režimů prošly");
process.exit(fail ? 1 : 0);
