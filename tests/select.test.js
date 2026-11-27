// Testy paměti a výběru témat. Spuštění: npm test
// Z src/game.js vyřízne rozpoznávání (DB, norm…) a blok „paměť a výběr témat“, takže testuje skutečný kód hry.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const window = {};
new Function("window", readFileSync(root + "data/questions.js", "utf8"))(window);
const P = window.KRILLION_DATA;
const src = readFileSync(root + "src/game.js", "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b); if (i < 0 || j < 0) throw new Error(`V src/game.js chybí ${a} nebo ${b}`); return src.slice(i, j); };
const code = cut("const norm=", "const tierFromPct") + cut("/* ---------- paměť a výběr témat", "/* ---------- konec výběru");
const { loadState, saveState, pickTopic, tooSimilar } = new Function("P", code + "\nreturn{loadState,saveState,pickTopic,tooSimilar};")(P);

// localStorage, který jako prohlížeč ukládá jen text
const fakeLS = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), _m: m }; };
const lvlFor = (n) => (n <= 3 ? 1 : n <= 7 ? 2 : n <= 12 ? 3 : 4); // stejně jako ve hře
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

let fail = 0;
const check = (ok, msg) => { if (!ok) { fail++; console.log("✗ " + msg); } };

// 1) 30 her po sobě, mezi hrami „reload“: uložit → zahodit stav → znovu načíst
{
  const ls = fakeLS(); const seen = new Map(); let asked = 0, firstRepeat = null;
  let prev = null;
  for (let g = 1; g <= 30; g++) {
    const st = loadState(ls); // reload stránky
    if (prev) check(st.seq === prev.seq && st.used.length === prev.used && Object.keys(st.fam).length === prev.fam, `hra ${g}: po reloadu se ztratila paměť (seq ${st.seq} ≠ ${prev.seq})`);
    const run = { asked: new Set(), fams: new Set() };
    const n = 5 + Math.floor(rnd() * 14); // délka ponoru 5–18 otázek
    for (let i = 1; i <= n; i++) {
      const p = pickTopic(st, run, lvlFor(i), rnd); asked++;
      if (seen.has(p.fam) && seen.size < P.length && !firstRepeat) firstRepeat = `hra ${g}, otázka ${i}: „${p.fam}“ (padlo ${seen.size} z ${P.length})`;
      seen.set(p.fam, (seen.get(p.fam) || 0) + 1);
      check(saveState(ls, st), "stav se neuložil");
    }
    prev = { seq: st.seq, used: st.used.length, fam: Object.keys(st.fam).length };
  }
  check(!firstRepeat, "téma se zopakovalo dřív, než padla všechna: " + firstRepeat);
  console.log(`30 her: ${asked} otázek, ${seen.size} různých témat, opakování: ${firstRepeat ? "ANO" : "žádné"}`);
}

// 2) dlouhodobě: každé téma padne k-tý krát až poté, co všechna padla (k−1)krát (i přes reloady)
{
  const ls = fakeLS(); const cnt = new Map(P.map((r) => [r[1], 0])); let bad = null;
  for (let g = 1; g <= 150 && !bad; g++) {
    const st = loadState(ls); const run = { asked: new Set(), fams: new Set() };
    const n = 5 + Math.floor(rnd() * 14);
    for (let i = 1; i <= n; i++) {
      const p = pickTopic(st, run, lvlFor(i), rnd);
      const c = cnt.get(p.fam); const min = Math.min(...cnt.values());
      if (c > min && !bad) bad = `hra ${g}: „${p.fam}“ potřetí/počtvrté, ale jiné téma má jen ${min}×`;
      cnt.set(p.fam, c + 1);
    }
    saveState(ls, st);
  }
  check(!bad, "rozložení opakování: " + bad);
  const v = [...cnt.values()];
  console.log(`150 her: každé téma ${Math.min(...v)}–${Math.max(...v)}×`);
}

// 3) uložený stav přežije reload beze ztráty
{
  const ls = fakeLS(); const st = loadState(ls); const run = { asked: new Set(), fams: new Set() };
  for (let i = 1; i <= 10; i++) pickTopic(st, run, lvlFor(i), rnd);
  st.best = 1234; st.runs = 3; saveState(ls, st);
  const st2 = loadState(ls);
  check(JSON.stringify(st2) === JSON.stringify(st), "po reloadu se stav liší");
  check(Object.keys(st2.fam).length === 10 && Object.keys(st2.cnt).length === 10 && st2.seq === 10 && st2.used.length === 10, "po reloadu chybí paměť témat");
}

// 4) starší uložení (bez počítadla cnt) a poškozená data
{
  const ls = fakeLS();
  const old = P.slice(0, 50).map((r) => r[1]);
  ls.setItem("krillion5", JSON.stringify({ best: 500, runs: 9, used: old, fam: Object.fromEntries(old.map((q, i) => [q, i + 1])), seq: 50 }));
  const st = loadState(ls); const run = { asked: new Set(), fams: new Set() };
  const picks = Array.from({ length: 20 }, (_, i) => pickTopic(st, run, lvlFor(i + 1), rnd).fam);
  check(picks.every((q) => !old.includes(q)), "po přechodu ze staršího uložení padlo už použité téma");
  check(st.best === 500 && st.runs === 9, "starší uložení ztratilo rekord");
  const ls2 = fakeLS(); ls2.setItem("krillion5", "{rozbité");
  check(loadState(ls2).seq === 0, "poškozený záznam musí dát čistý stav");
  ls2.setItem("krillion5", JSON.stringify({ fam: [], cnt: "x", used: {} }));
  const s3 = loadState(ls2); check(Array.isArray(s3.used) && typeof s3.fam === "object" && !Array.isArray(s3.fam), "špatné typy v uložení se musí opravit");
}

// 5) zadání od Clauda nesmí být obměnou vestavěného tématu
{
  const base = P.map((r) => r[1]);
  for (const q of ["Jmenuj předsedu vlády ČR", "Jmenuj rybu", "Jmenuj jakoukoli rybu žijící v Česku", "Jmenuj prezidenta USA", "Jmenuj psí plemeno"])
    check(tooSimilar(q, base), `„${q}“ mělo být odmítnuto jako obměna`);
  for (const q of ["Jmenuj slavný most", "Jmenuj karetní termín z pokeru", "Jmenuj druh lodi"])
    check(!tooSimilar(q, base), `„${q}“ je nové téma, nemělo být odmítnuto`);
}

console.log(fail ? `\n${fail} testů výběru selhalo` : "Testy výběru témat prošly");
process.exit(fail ? 1 : 0);
