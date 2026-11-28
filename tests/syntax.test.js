// Kontrola syntaxe všech skriptů hry (bez spuštění). Spuštění: npm test
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("..", import.meta.url));
// pořadí jako v index.html; dohromady musí jít přeložit jako jeden celek (sdílejí horní const/let)
const FILES = ["src/shim.js", "src/rozpoznavani.js", "src/data.js", "src/claude.js", "src/vykreslovani.js", "src/ui.js", "src/rezimy.js"];
const html = readFileSync(root + "index.html", "utf8");
let fail = 0;
for (const f of FILES) { try { new Function(readFileSync(root + f, "utf8")); } catch (e) { fail++; console.log(`✗ ${f}: ${e.message}`); } if (!html.includes(`src="${f}"`)) { fail++; console.log(`✗ ${f} chybí v index.html`); } }
try { new Function(FILES.slice(1).map((f) => readFileSync(root + f, "utf8")).join("\n")); } catch (e) { fail++; console.log("✗ skripty dohromady: " + e.message); }
const order = FILES.map((f) => html.indexOf(`src="${f}"`));
if (order.some((x, i) => i && x < order[i - 1])) { fail++; console.log("✗ pořadí skriptů v index.html neodpovídá"); }
console.log(fail ? `${fail} chyb syntaxe` : "Syntaxe skriptů v pořádku");
process.exit(fail ? 1 : 0);
