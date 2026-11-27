# Krillion – poznámky pro Claude Code

Česká trivia hra bez frameworku a bez build kroku: čisté HTML/CSS/JS, nasazení na Vercel.

## Jak to funguje
- `index.html` – jen kostra stránky; načítá `styles.css` a skripty v pořadí `src/shim.js` → `data/questions.js` → `src/game.js`. CSS ani JS sem zpátky nevkládej.
- `styles.css` – vzhled (tekuté sklo, HUD, karty). Na dotykových zařízeních `@media(pointer:coarse)` vypíná `backdrop-filter`.
- `src/game.js` – jeden IIFE blok. Části: rozpoznávání odpovědí (`norm`, `lev`, `stem`, `strong`, `weak`, `part`, `localJudge`, `looseLocal`), paměť a výběr témat (`loadState`, `saveState`, `pickTopic`, `tooSimilar`, localStorage), napojení na Clauda (`askAI`, `gen`, `aiJudge`), vykreslování oceánu na canvas (`draw`, `creature`, `diver` – kostra s klouby, parametr P posadí/schoulí potápěče), scéna u hladiny a seskok z lodi (`sceneStep`, `boat`, `rollStep`, `surfStep`), herní smyčka (`start`, `ask`, `submit`, `win`, `lose`, `end`).
- `data/questions.js` – `window.KRILLION_DATA`: `[obtížnost 1–4, zadání, "odp1|alias,odp2,..."]`, odpovědi seřazené od nejčastější po nejvzácnější (pořadí = vzácnost 1–5). V odpovědi nesmí být čárka. `window.KRILLION_NAMES` = česká křestní jména pro `isName`.
- `part` (neúplná víceslovná odpověď) uzná „arabská“ → Arabská káva, jen když je vynechané slovo v zadání, nebo když hráč napsal jasné přídavné jméno (-ský, -cký, -ový, -ní…, ≥ 5 písmen, ne obecné ze seznamu `GEN`, ne křestní jméno). Shoda musí být jednoznačná.
- `stem` porovnává kmeny slov (šmoulí/šmoulová/šmoula, čokoláda/čokoládová) – jen celé tokeny ≥ 5 písmen a shodný kmen ≥ 4 písmena.
- Výběr témat (`pickTopic`): téma se zopakuje až po vystřídání všech ostatních (`st.cnt` = kolikrát padlo, pak nejbližší obtížnost, pak nejdéle nepoužité). Zadání od Clauda se zahodí, když je obměnou vestavěného tématu (`tooSimilar`).
- Scéna u hladiny (objekt `S`, `sceneStep`, `surfaceLayer`, `boat`, `rollStep`, `surfStep`): na úvodní i koncové obrazovce je kamera nad hladinou (obloha, slunce a mraky ze spritů, loď se houpe na vlnách, potápěč sedí na zádi). „Ponořit se“ → `beginRoll` (S.m="roll", ~2,75 s): převal zády, šplouchnutí, kamera (posun `S.co`) sjede pod hladinu, potápěč přejde do plavání (Hermitova křivka navazuje na rychlost pádu). Konec hry → `beginAscent` (S.m="asc") vystoupá z hloubky, pak "surf" vyleze na loď. Tapnutí seskok zrychlí (`S.sp`). Karta s inputem se vytvoří hned při tapnutí a input dostane focus v rámci tapnutí (jinak iOS neotevře klávesnici); karta je skrytá třídou `.stage.intro`.
- `tests/` – `judge.test.js` testuje `localJudge` nad skutečnými daty (vyřízne blok z `game.js` od `const norm=` po `const tierFromPct`), `select.test.js` simuluje desítky her s reloadem (blok `/* ---------- paměť a výběr témat` … `/* ---------- konec výběru`) – tyhle značky nepřejmenovávej; `data.test.js` kontroluje data.
- `src/shim.js` – emuluje `window.claude.use("sample")` z claude.ai přes `fetch("/api/ai")`. `db` a `user` vrací null → stav jen v localStorage.
- `api/ai.js` – Vercel serverless funkce, volá Anthropic Messages API. Klíč `ANTHROPIC_API_KEY` jen v env. Přijímá pouze prompty začínající prefixy hry (`ALLOWED_PREFIXES`) – když měníš text promptů v `game.js`, ponech začátek stejný nebo uprav prefixy.

## Pravidla
- UI texty jsou česky.
- Výkon na iPhonu je priorita: žádný `backdrop-filter` na mobilu, žádný `shadowBlur` na mobilu (řeší se přes `SBK`), cachované gradienty a sprity, adaptivní kvalita `Q`.
- Hodnoty od Clauda nebo z dat vkládej přes `esc()` / `textContent`, nikdy jako HTML.
- Témata jen jako UZAVŘENÉ množiny, které jdou vyjmenovat celé (státy, hlavní města, kraje a regiony, sousední státy, měsíce planet, týmy konkrétní ligy, vítězové konkrétní soutěže, panovníci jedné země, díla jednoho autora…), nebo slovníkové kategorie, kde jde seznam udělat opravdu kompletní (ovoce, zelenina, barvy, sporty, psí plemena). Žádné „slavný/známý…“, herci, zpěváci, filmy, videohry, povolání, vlastnosti, věci v místnosti. Zadání jednoznačné s jasným rozsahem („i bývalý“, „od roku 1993“), nikdy jediná správná odpověď, žádné obměny existujících témat, aspoň 8 odpovědí, správná čeština s diakritikou, varianty (české názvy, zkratky, hovorové tvary) přes `|`.
- Po změně ověř: `npm test`, `node -e "new Function(require('fs').readFileSync('src/game.js','utf8'))"` a otevři hru přes `npm run dev`.
