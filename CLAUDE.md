# Krillion – poznámky pro Claude Code

Česká trivia hra bez frameworku a bez build kroku: čisté HTML/CSS/JS, nasazení na Vercel.

## Jak to funguje
- `index.html` – jen kostra stránky; načítá `styles.css` a skripty v pořadí `src/shim.js` → `data/questions.js` → `src/game.js`. CSS ani JS sem zpátky nevkládej.
- `styles.css` – vzhled (tekuté sklo, HUD, karty). Na dotykových zařízeních `@media(pointer:coarse)` vypíná `backdrop-filter`.
- `src/game.js` – jeden IIFE blok. Části: rozpoznávání odpovědí (`norm`, `lev`, `strong`, `weak`, `part`, `localJudge`, `looseLocal`), stav a paměť (`st`, `save`, localStorage), napojení na Clauda (`askAI`, `gen`, `aiJudge`), vykreslování oceánu na canvas (`draw`, `creature`, `diver`), herní smyčka (`start`, `ask`, `submit`, `win`, `lose`, `end`).
- `data/questions.js` – `window.KRILLION_DATA`: `[obtížnost 1–4, zadání, "odp1|alias,odp2,..."]`, odpovědi seřazené od nejčastější po nejvzácnější (pořadí = vzácnost 1–5). V odpovědi nesmí být čárka.
- `part` (neúplná víceslovná odpověď) uzná „arabská“ → Arabská káva, jen když je vynechané slovo v zadání, nebo když hráč napsal jasné přídavné jméno (-ský, -cký, -ový, -ní…, ≥ 5 písmen, ne obecné ze seznamu `GEN`, ne křestní jméno). Shoda musí být jednoznačná.
- `tests/` – `judge.test.js` testuje `localJudge` nad skutečnými daty (vyřízne blok z `game.js` od `const norm=` po `const tierFromPct` – tyhle značky nepřejmenovávej), `data.test.js` kontroluje data.
- `src/shim.js` – emuluje `window.claude.use("sample")` z claude.ai přes `fetch("/api/ai")`. `db` a `user` vrací null → stav jen v localStorage.
- `api/ai.js` – Vercel serverless funkce, volá Anthropic Messages API. Klíč `ANTHROPIC_API_KEY` jen v env. Přijímá pouze prompty začínající prefixy hry (`ALLOWED_PREFIXES`) – když měníš text promptů v `game.js`, ponech začátek stejný nebo uprav prefixy.

## Pravidla
- UI texty jsou česky.
- Výkon na iPhonu je priorita: žádný `backdrop-filter` na mobilu, žádný `shadowBlur` na mobilu (řeší se přes `SBK`), cachované gradienty a sprity, adaptivní kvalita `Q`.
- Hodnoty od Clauda nebo z dat vkládej přes `esc()` / `textContent`, nikdy jako HTML.
- Nová témata: zadání jednoznačné s jasným rozsahem, nikdy jediná správná odpověď, žádné obměny existujících témat, aspoň 25 odpovědí, správná čeština s diakritikou.
- Po změně ověř: `npm test`, `node -e "new Function(require('fs').readFileSync('src/game.js','utf8'))"` a otevři hru přes `npm run dev`.
