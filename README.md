# Krillion – nekonečný ponor

Česká trivia hra o ponoru do hlubin. Na úvodní obrazovce si vybereš jeden ze tří režimů – loď, moře, potápěč i seskok do vody jsou pro všechny stejné:

- **Vyšší, nebo nižší?** – dvě věci a otázka („Co má víc obyvatel – Brno, nebo Ostrava?“, „Co váží víc – plejtvák, nebo 10 slonů?“). Ťukneš na jednu z karet. Správně = hlouběji, chyba = −1 bublina kyslíku (máš 3). Hra je nekonečná a postupně přitvrzuje – od lehkých (velký rozdíl, známé věci) přes střední a těžké po expertní; za těžší otázku je víc metrů (×1 / ×1,5 / ×2 / ×3). Každých 6 správných v řadě dá bonusový ponor (série 6, 12, 18…). Občas padne překvapivé srovnání se zajímavostí. Po odpovědi uvidíš obě skutečné hodnoty i zdroj.
- **Odhad** – 10 otázek s číselnou odpovědí („Kolik kostí má dospělý člověk?“). Čím přesnější odhad, tím víc metrů: do ±5 % maximum (1 000 m), 2× vedle asi polovina, 10× vedle kolem 50 m, 100× kolem 20 m, 1 000× pár metrů, dál nic. Číslo můžeš psát i jako „1,5 mil“, „2 tis.“ nebo „3k“.
- **Krillion** – na každé zadání napiš jednu odpověď. Čím vzácnější (a správná), tím hlouběji se potápěč dostane. Chyba stojí bublinu kyslíku, odpověď „Jeden z krilionu“ ji vrací.

Každý režim má vlastní rekord a otázky se neopakují ani mezi hrami.

## Struktura

```
index.html          stránka hry
styles.css          vzhled (tekuté sklo, HUD, karty)
src/game.js         logika hry, vykreslování oceánu, potápěč, výběr otázek
src/audio.js        zvuky generované v prohlížeči (Web Audio), ve výchozím stavu vypnuté
src/shim.js         napojení na Clauda přes /api/ai (mimo claude.ai)
data/questions.js   témata a odpovědi režimu Krillion (209 témat s úplným výčtem odpovědí)
data/higher-lower.js položky režimu Vyšší, nebo nižší? (803 položek, 25 veličin, 179 překvapivých srovnání)
data/estimates.js   otázky režimu Odhad (373 otázek)
api/ai.js           serverová funkce pro Vercel – volá Anthropic API s tvým klíčem
tests/              testy rozpoznávání, výběru témat, režimů a kontrola dat (npm test)
```

### Formát otázek (`data/questions.js`)

```js
[2, "Jmenuj psí plemeno", "Labrador|Labradorský retrívr,Německý ovčák,Jezevčík,..."]
```

- první číslo je obtížnost 1–4 (1 = lehká, 4 = expert),
- odpovědi jsou oddělené čárkou a **seřazené od nejčastější po nejvzácnější** – podle pořadí se počítá vzácnost 1–5,
- `|` odděluje různé názvy jedné odpovědi (první se zobrazuje).

Hra sama snese překlepy, chybějící diakritiku i jiné tvary slova. Uzná i jiné tvary slova („šmoulová“ = Šmoulí, „čokoláda“ = Čokoládová) a u víceslovných odpovědí stačí napsat odlišující část („arabská“ → Arabská káva, „lední“ → Lední medvěd), pokud je jednoznačná.

- v odpovědi nesmí být čárka (odděluje odpovědi) – „Marečku, podejte mi pero“ zapiš bez čárky,
- nová témata: jen ta, u nichž existuje oficiální nebo všeobecně uznávaný úplný výčet (státy, kraje, týmy ligy, vítězové soutěže…), aspoň 8 odpovědí, jasný rozsah zadání („v Česku“, „i bývalého“, „od roku 1993“).

### Formát dat „Vyšší, nebo nižší?“ (`data/higher-lower.js`)

```js
V: { obyv: ["Co má víc obyvatel?", "obyvatel"], ... },          // veličina: otázka a jednotka
G: [ { v: "obyv", c: "Česko", s: "ČSÚ, 2024", a: 1, min: 1.1,   // skupina položek
       i: [["Brno", 402000], ["Ostrava", 283000], ...] }, ... ]
```

- hra sama skládá páry ze všech položek **stejné veličiny** (i z různých skupin), takže z 803 položek vzniknou desítky tisíc otázek,
- `c` = kategorie, `s` = zdroj nebo poznámka (položka může mít vlastní jako třetí prvek), `a: 1` = přibližné hodnoty (ukáže se „~“),
- `min` = nejmenší poměr hodnot, při kterém se dvojice smí zeptat – vždy aspoň 1,05 (rozdíl 5 %), u odhadů víc, aby nevznikaly sporné otázky,
- `y: 1` = hodnota je rok vzniku a porovnává se stáří („Co je starší – iPhone, nebo YouTube?“),
- `f` = známost položek 1–3 (1 = zná každý), `k` / `h` = seznamy výjimek (známější / méně známé). Z poměru hodnot a známosti hra počítá obtížnost otázky,
- `X` = překvapivá srovnání: `["Co je starší?", "let", ["Oxfordská univerzita", 1096], ["Říše Aztéků", 1325], "Zajímavost v jedné větě.", {y: 1}]`.

### Formát otázek „Odhad“ (`data/estimates.js`)

```js
["Zvířata", "Kolik žiraf žije v Africe?", 117000, "žiraf", "odhad GCF, 2020"]
```

kategorie, otázka, skutečná hodnota (kladné číslo), jednotka ve správném tvaru pro tu hodnotu a nepovinná poznámka nebo zdroj, kterou hra ukáže po odpovědi. U odhadovaných čísel zdroj vždy uveď; když si hodnotou nejsi jistý, otázku nepřidávej.

## Spuštění na počítači

```bash
npm run dev          # jen hra, bez Clauda (vestavěné seznamy)
npm test             # testy rozpoznávání, výběru témat a kontrola dat
npm run dev:ai       # hra i s Claudem (potřebuje Vercel CLI a .env.local s klíčem)
```

Pak otevři adresu, kterou příkaz vypíše (obvykle http://localhost:3000).

## Nasazení na web (Vercel, zdarma)

1. Nahraj složku na GitHub (nový repozitář).
2. Na [vercel.com](https://vercel.com) se přihlas přes GitHub → **Add New → Project** → vyber repozitář → **Deploy**. Nic dalšího nastavovat nemusíš.
3. Hra běží na adrese typu `krillion.vercel.app` – tu pošli kamarádům.

### Zapnutí hodnocení Claudem (volitelné)

1. Vytvoř si API klíč na [console.anthropic.com](https://console.anthropic.com) a nabij kredit.
2. Ve Vercelu: projekt → **Settings → Environment Variables** → přidej `ANTHROPIC_API_KEY`.
3. **Redeploy**. Hra pak sama pozná, že Claude je k dispozici.

⚠️ Každé hodnocení a vymýšlení otázek se platí z tvého API kreditu. Server přijímá jen prompty hry a má limit 60 požadavků na IP za 10 minut, ale u veřejné hry si v konzoli Anthropic nastav i měsíční limit útraty.

Bez klíče hra normálně funguje, jen nerozpozná odpovědi, které nejsou v seznamech, a nevymýšlí nové otázky.

## Rozdíly oproti verzi na claude.ai

- Rekordy (zvlášť pro každý režim) a paměť odehraných otázek se ukládají v prohlížeči každého hráče (localStorage), ne k účtu. Témata se neopakují, dokud se nevystřídají všechna. Safari maže data webů, které týden neotevřeš – hra proto žádá o trvalé úložiště, ale zaručené to není.
- Claude běží přes tvůj vlastní API klíč, ne přes účet hráče.
