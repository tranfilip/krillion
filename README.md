# Krillion – nekonečný ponor

Česká trivia hra: na každé zadání napiš jednu odpověď. Čím vzácnější (a správná), tím hlouběji se potápěč dostane. Chyba stojí bublinu kyslíku, odpověď „Jeden z krilionu“ ji vrací.

## Struktura

```
index.html          stránka hry
styles.css          vzhled (tekuté sklo, HUD, karty)
src/game.js         logika hry, vykreslování oceánu, potápěč, výběr otázek
src/shim.js         napojení na Clauda přes /api/ai (mimo claude.ai)
data/questions.js   všechna témata a odpovědi (203 uzavřených témat, ~9 000 odpovědí)
api/ai.js           serverová funkce pro Vercel – volá Anthropic API s tvým klíčem
tests/              testy rozpoznávání, výběru témat a kontrola dat (npm test)
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
- nová témata: jen uzavřené množiny, které jdou vyjmenovat celé (státy, kraje, týmy ligy, vítězové soutěže…), aspoň 8 odpovědí, jasný rozsah zadání („v Česku“, „i bývalého“, „od roku 1993“).

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

- Rekord a paměť odehraných otázek se ukládají v prohlížeči každého hráče (localStorage), ne k účtu. Témata se neopakují, dokud se nevystřídají všechna. Safari maže data webů, které týden neotevřeš – hra proto žádá o trvalé úložiště, ale zaručené to není.
- Claude běží přes tvůj vlastní API klíč, ne přes účet hráče.
