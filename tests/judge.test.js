// Testy rozpoznávání odpovědí (localJudge). Spuštění: npm test
// Načte data/questions.js a z src/game.js vyřízne část od `const norm=` po `const tierFromPct`,
// takže testuje přesně ten kód, který běží ve hře.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const window = {};
new Function("window", readFileSync(root + "data/questions.js", "utf8"))(window);
const src = readFileSync(root + "src/game.js", "utf8");
const a = src.indexOf("const norm="), b = src.indexOf("const tierFromPct");
if (a < 0 || b < 0) throw new Error("V src/game.js nejde najít blok rozpoznávání");
const { localJudge } = new Function("P", "window", src.slice(a, b) + "\nreturn{localJudge,looseLocal};")(window.KRILLION_DATA, window);

// název odpovědi i se všemi jejími variantami (Arabská káva = Arabská = Káva po arabsku)
const variants = (q, name) => {
  const row = window.KRILLION_DATA.find((r) => r[1] === q);
  const e = row && row[2].split(",").map((x) => x.split("|")).find((v) => v.includes(name));
  return e || [name];
};

const Q = {
  pes: "Jmenuj psí plemeno",
  stat: "Jmenuj jakýkoli stát světa",
  evropa: "Jmenuj jakýkoli evropský stát",
  okres: "Jmenuj okresní město v Česku",
  kraj: "Jmenuj kraj České republiky",
  barva: "Jmenuj jakoukoli barvu",
  ovoce: "Jmenuj jakékoli ovoce",
  sport: "Jmenuj jakýkoli sport",
  tucnak: "Jmenuj druh tučňáka",
  kost: "Jmenuj kost v lidském těle",
  zverokruh: "Jmenuj znamení zvěrokruhu",
  hp: "Jmenuj postavu z Harryho Pottera",
  usa: "Jmenuj prezidenta USA (i bývalého)",
  f1: "Jmenuj mistra světa Formule 1",
  wimb: "Jmenuj vítěze nebo vítězku dvouhry ve Wimbledonu (od roku 1968)",
  poke: "Jmenuj Pokémona 1. generace",
  disney: "Jmenuj celovečerní animovaný film studia Walt Disney nebo Pixar",
  prvek: "Jmenuj jakýkoli chemický prvek",
  mesic: "Jmenuj měsíc v roce",
  ryba: "Jmenuj sladkovodní rybu žijící v Česku",
  papez: "Jmenuj papeže (i bývalého)",
};

// [zadání, odpověď hráče, očekávaný název (nebo true = jen platí)]
const MUST = [
  // neúplná odpověď: vynechané slovo je v zadání
  [Q.tucnak, "císařský", "Tučňák císařský"],
  [Q.tucnak, "cisarsky", "Tučňák císařský"],
  [Q.tucnak, "humboldtův", "Tučňák Humboldtův"],
  [Q.tucnak, "tučňák císařský", "Tučňák císařský"],
  [Q.kost, "stehenní", "Stehenní kost"],
  [Q.kost, "pažní", "Pažní kost"],
  [Q.kost, "klíční", "Klíční kost"],
  [Q.kraj, "Jihomoravský kraj", true],
  [Q.kraj, "jihomoravsky", "Jihomoravský"],
  [Q.kraj, "kraj vysočina", true],
  [Q.kraj, "jižní morava", "Jihomoravský"],
  // neúplná odpověď: jasné přídavné jméno bez podstatného jména
  [Q.pes, "francouzský", "Francouzský buldoček"],
  [Q.pes, "francouzsky", "Francouzský buldoček"],
  [Q.evropa, "česká", "Česká republika"],
  [Q.okres, "karlovy", "Karlovy Vary"],
  [Q.okres, "uherské", "Uherské Hradiště"],
  // tvary přídavných jmen a kmeny slov
  [Q.barva, "šmoulová", "Šmoulí"],
  [Q.barva, "šmoulí", "Šmoulí"],
  [Q.barva, "šmoula", "Šmoulí"],
  [Q.barva, "čokoláda", "Čokoládová"],
  [Q.barva, "čokoládovou", "Čokoládová"],
  [Q.barva, "modrý", "Modrá"],
  [Q.barva, "modrou", "Modrá"],
  [Q.barva, "zelený", "Zelená"],
  [Q.barva, "vanilka", "Vanilková"],
  [Q.barva, "pistácie", "Pistáciová"],
  [Q.barva, "jahoda", "Jahodová"],
  [Q.barva, "rudá", "Rudá"],
  [Q.zverokruh, "blíženec", "Blíženci"],
  [Q.zverokruh, "štír", "Štír"],
  // hovorové varianty, zkratky, cizí názvy, bez diakritiky
  [Q.sport, "kopaná", "Fotbal"],
  [Q.sport, "hokej", true],
  [Q.stat, "Česko", true],
  [Q.stat, "ČR", true],
  [Q.stat, "USA", true],
  [Q.okres, "Plzen", "Plzeň"],
  [Q.okres, "Budějovice", true],
  [Q.kost, "femur", "Stehenní kost"],
  [Q.kost, "lebka", "Lebka"],
  [Q.hp, "Hermiona", true],
  [Q.hp, "Hermione Granger", true],
  [Q.hp, "brumbal", true],
  [Q.usa, "Lincoln", true],
  [Q.f1, "schumacher", true],
  [Q.f1, "Senna", true],
  [Q.wimb, "Kvitová", true],
  [Q.wimb, "federer", true],
  [Q.poke, "pikachu", "Pikachu"],
  [Q.poke, "pikaču", "Pikachu"],
  [Q.disney, "Frozen", true],
  [Q.disney, "lví král", "Lví král"],
  [Q.prvek, "wolfram", true],
  [Q.prvek, "tungsten", true],
  [Q.mesic, "leden", "Leden"],
  [Q.ovoce, "jablko", "Jablko"],
  [Q.ovoce, "pomerac", true],
  [Q.ryba, "kapr", "Kapr"],
  [Q.papez, "Pius", true],
  [Q.papez, "Jan Pavel II.", true],
];

const MUST_NOT = [
  [Q.tucnak, "tučňák"],      // samotné slovo ze zadání
  [Q.kost, "kost"],
  [Q.kraj, "kraj"],
  [Q.pes, "anglický"],       // nejednoznačné: buldok, kokršpaněl, setr…
  [Q.pes, "český"],          // fousek, teriér
  [Q.pes, "malý"],
  [Q.pes, "německý"],
  [Q.pes, "pes"],
  [Q.stat, "severní"],       // Korea / Makedonie
  [Q.stat, "nový"],
  [Q.stat, "republika"],
  [Q.okres, "nové"],
  [Q.okres, "český"],        // Český Krumlov / Česká Lípa
  [Q.barva, "šmudla"],       // kmeny slov nesmí splývat s jinými slovy
  [Q.barva, "auto"],
  [Q.ovoce, "černý"],
  [Q.ovoce, "auto"],
  [Q.prvek, "Francie"],
  [Q.mesic, "pondělí"],
  [Q.poke, "Agumon"],
  [Q.usa, "Tomáš"],
  [Q.f1, "Petr"],
  [Q.kost, ""],
];

let fail = 0;
for (const [q, ans, exp] of MUST) {
  const r = localJudge(q, ans);
  if (!r) { fail++; console.log(`✗ neznámé zadání: ${q}`); continue; }
  const ok = r.valid && (exp === true || variants(q, exp).includes(r.name));
  if (!ok) { fail++; console.log(`✗ MÁ PLATIT   ${q} ← „${ans}“  (čekáno ${exp}, dostal ${r.valid ? r.name : "neplatí"})`); }
}
for (const [q, ans] of MUST_NOT) {
  const r = localJudge(q, ans);
  if (!r) { fail++; console.log(`✗ neznámé zadání: ${q}`); continue; }
  if (r.valid) { fail++; console.log(`✗ NEMÁ PLATIT ${q} ← „${ans}“  (uznáno jako ${r.name})`); }
}
const total = MUST.length + MUST_NOT.length;
console.log(fail ? `\n${fail} z ${total} testů selhalo` : `Všech ${total} testů prošlo`);
process.exit(fail ? 1 : 0);
