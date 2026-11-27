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
const { localJudge } = new Function("P", src.slice(a, b) + "\nreturn{localJudge,looseLocal};")(window.KRILLION_DATA);

// název odpovědi i se všemi jejími variantami (Arabská káva = Arabská = Káva po arabsku)
const variants = (q, name) => {
  const row = window.KRILLION_DATA.find((r) => r[1] === q);
  const e = row && row[2].split(",").map((x) => x.split("|")).find((v) => v.includes(name));
  return e || [name];
};

const Q = {
  kava: "Jmenuj druh kávy",
  caj: "Jmenuj druh čaje",
  zvire: "Jmenuj jakékoli zvíře",
  pes: "Jmenuj psí plemeno",
  stat: "Jmenuj jakýkoli stát světa",
  evropa: "Jmenuj jakýkoli evropský stát",
  mesto: "Jmenuj jakékoli české město",
  hokej: "Jmenuj českého hokejistu (i bývalého)",
  herec: "Jmenuj hollywoodského herce nebo herečku",
  ovoce: "Jmenuj jakékoli ovoce",
  napoj: "Jmenuj jakýkoli nápoj",
  povolani: "Jmenuj jakékoli povolání",
  zpevak: "Jmenuj zahraničního zpěváka, zpěvačku nebo kapelu",
  hrad: "Jmenuj hrad, zámek nebo zříceninu v Česku",
};

// [zadání, odpověď hráče, očekávaný název (nebo true = jen platí)]
const MUST = [
  // nová logika: vynechané slovo ze zadání
  [Q.kava, "arabská", "Arabská káva"],
  [Q.kava, "Arabska", "Arabská káva"],
  [Q.kava, "etiopská", "Etiopská káva"],
  [Q.kava, "kolumbijska", "Kolumbijská káva"],
  [Q.kava, "brazilská", "Brazilská káva"],
  [Q.kava, "keňská", "Keňská káva"],
  [Q.kava, "vídeňská", "Vídeňská káva"],
  [Q.kava, "irská", "Irská káva"],
  [Q.kava, "turecká", "Turecká káva"],
  [Q.kava, "ledová", "Ledová káva"],
  [Q.caj, "černý", "Černý čaj"],
  [Q.caj, "zeleny", "Zelený čaj"],
  [Q.caj, "bílý", "Bílý čaj"],
  [Q.caj, "ovocný", "Ovocný čaj"],
  // nová logika: přídavné jméno bez podstatného jména
  [Q.zvire, "lední", "Lední medvěd"],
  [Q.zvire, "ledni", "Lední medvěd"],
  [Q.pes, "francouzský", "Francouzský buldoček"],
  [Q.pes, "francouzsky", "Francouzský buldoček"],
  [Q.pes, "francouzská", "Francouzský buldoček"],
  [Q.evropa, "česká", "Česká republika"],
  [Q.mesto, "karlovy", "Karlovy Vary"],
  [Q.mesto, "mariánské", "Mariánské Lázně"],
  // nové druhy kávy
  [Q.kava, "arabica", "Arabica"],
  [Q.kava, "arabika", "Arabica"],
  [Q.kava, "robusta", "Robusta"],
  [Q.kava, "kopi luwak", "Kopi Luwak"],
  [Q.kava, "luwak", "Kopi Luwak"],
  [Q.kava, "arabská káva", "Arabská káva"],
  // dosavadní chování musí zůstat
  [Q.kava, "espresso", "Espresso"],
  [Q.kava, "kapucino", true],
  [Q.kava, "cappucino", true],
  [Q.zvire, "medvěd", "Medvěd"],
  [Q.zvire, "lední medvěd", "Lední medvěd"],
  [Q.zvire, "tygři", true],
  [Q.pes, "buldoček", true],
  [Q.pes, "labrador", true],
  [Q.hokej, "Jágr", true],
  [Q.hokej, "jaromir jagr", true],
  [Q.ovoce, "jablko", "Jablko"],
  [Q.ovoce, "pomerac", true],
  [Q.napoj, "káva", "Káva"],
  [Q.napoj, "minerální", "Minerálka"],
  [Q.povolani, "automechanik", true],
  [Q.stat, "Česko", true],
  // nahlášené chyby: tvary a odvozeniny, chybějící odpovědi
  ["Jmenuj českého herce nebo herečku", "Štěpán Kozub", "Štěpán Kozub"],
  ["Jmenuj českého herce nebo herečku", "kozub", "Štěpán Kozub"],
  ["Jmenuj příchuť zmrzliny", "šmoulová", "Šmoulí"],
  ["Jmenuj příchuť zmrzliny", "šmoulí", "Šmoulí"],
  ["Jmenuj příchuť zmrzliny", "šmoula", "Šmoulí"],
  ["Jmenuj příchuť zmrzliny", "čokoláda", "Čokoládová"],
  ["Jmenuj příchuť zmrzliny", "čokoládová", "Čokoládová"],
  ["Jmenuj příchuť zmrzliny", "vanilka", "Vanilková"],
  ["Jmenuj příchuť zmrzliny", "vanilkova", "Vanilková"],
  ["Jmenuj příchuť zmrzliny", "pistáciová", "Pistáciová"],
  ["Jmenuj příchuť zmrzliny", "pistácie", "Pistáciová"],
  ["Jmenuj příchuť zmrzliny", "jahodovou", "Jahodová"],
  ["Jmenuj sportovní vybavení nebo pomůcku", "obruč", true],
  ["Jmenuj sportovní vybavení nebo pomůcku", "obruc", true],
  ["Jmenuj druh čaje", "mátový", true],
  ["Jmenuj druh čaje", "máta", true],
  ["Jmenuj mléčný výrobek", "jogurtová", "Jogurt"],
  // nová témata
  ["Jmenuj šelmu (masožravého savce)", "lední", "Lední medvěd"],
  ["Jmenuj stát, kde se platí eurem", "bulharsko", "Bulharsko"],
  ["Jmenuj druh salátu (jídla)", "řecký", "Řecký salát"],
  ["Jmenuj model auta (kterékoli značky)", "octavia", true],
];

const MUST_NOT = [
  [Q.kava, "káva"],          // samotné slovo ze zadání
  [Q.kava, "kafe dobre"],
  [Q.kava, "arab"],          // krátké
  [Q.kava, "voda"],
  [Q.caj, "čaj"],
  [Q.zvire, "lední hokej"],
  [Q.zvire, "hnědý"],        // obecné slovo (barva)
  [Q.zvire, "velký"],
  [Q.zvire, "bílý"],
  [Q.zvire, "domácí"],
  [Q.zvire, "polo"],
  [Q.pes, "anglický"],       // nejednoznačné: buldok, kokršpaněl, setr…
  [Q.pes, "český"],          // fousek, teriér
  [Q.pes, "malý"],
  [Q.pes, "německý"],     // ovčák, doga, ohař…
  [Q.pes, "pes"],
  [Q.stat, "severní"],       // Korea / Makedonie
  [Q.stat, "nový"],
  [Q.stat, "republika"],    // Česká, Dominikánská, Středoafrická…
  [Q.mesto, "nové"],
  [Q.mesto, "ústí"],
  [Q.mesto, "hradec"],
  [Q.mesto, "český"],
  [Q.hokej, "Jaromír"],      // samotné křestní jméno
  [Q.hokej, "Tomáš"],
  [Q.herec, "Johnny"],
  [Q.herec, "Tom"],
  [Q.zpevak, "Taylor"],
  [Q.hrad, "hrad"],
  [Q.ovoce, "černý"],
  [Q.ovoce, "auto"],
  [Q.napoj, "sycený"],
  [Q.kava, ""],
  ["Jmenuj model auta (kterékoli značky)", "ford"],   // značka, ne model
  ["Jmenuj druh salátu (jídla)", "salát"],
  // kmeny slov nesmí splývat s jinými slovy
  ["Jmenuj ptáka", "slabika"],
  ["Jmenuj jakýkoli chemický prvek", "Francie"],
  ["Jmenuj českého herce nebo herečku", "Bohdan"],
  ["Jmenuj jakoukoli květinu", "mušketa"],
  ["Jmenuj příchuť zmrzliny", "šmudla"],
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
