// Krillion – Napojení na Clauda (window.claude.use("sample") z src/shim.js): askAI, vymýšlení zadání gen, hodnocení aiJudge.
// Skripty se načítají v pořadí z index.html a sdílejí horní const/let/function (klasické skripty, bez build kroku).
/* ---------- Claude ---------- */
let sample=null,aiWarned=false;
try{Promise.resolve(window.claude&&window.claude.use&&window.claude.use("sample")).then(s=>{sample=s||null;if(sample){gen(1).then(()=>gen(2))}}).catch(()=>{})}catch(e){}
let aiErr="";
async function askAI(prompt,tier="quick"){if(!sample)throw{code:"not_granted"};
 const parse=x=>{if(x&&typeof x==="object"&&!("text" in x))return x;const m=String(x&&x.text||x||"").match(/\{[\s\S]*\}/);if(!m)throw{code:"parse"};return JSON.parse(m[0])};
 let lastE=null;
 for(const call of[()=>sample.json(prompt,{modelTier:tier}),()=>sample(prompt,{modelTier:tier}),()=>sample(prompt)]){
  try{const v=await call();return parse(v)}catch(e){lastE=e;if(e&&(e.code==="not_granted"||e.code==="rate_limited"))break}}
 aiErr=(lastE&&lastE.code)||"error";if(aiErr==="not_granted")sample=null;throw lastE||{code:"error"}}
const LV={1:"1 = snadné, odpověď zná každý, aspoň 12 odpovědí (např. 'Jmenuj krajské město v Česku', 'Jmenuj znamení zvěrokruhu', 'Jmenuj měsíc v roce')",2:"2 = střední, zhruba 20–200 odpovědí (např. 'Jmenuj stát Evropské unie', 'Jmenuj kraj České republiky', 'Jmenuj hlavní město asijského státu')",3:"3 = užší uzavřená množina zhruba 10–60 odpovědí (např. 'Jmenuj tým NBA', 'Jmenuj slovenský kraj', 'Jmenuj člena Společenstva prstenu')",4:"4 = těžká uzavřená množina 8–60 odpovědí, vyžaduje znalosti (např. 'Jmenuj vzácný plyn', 'Jmenuj měsíc planety Saturn', 'Jmenuj generálního tajemníka OSN')"};
const DOMAINS=["zeměpis světa","česká kultura a tradice","světová historie","česká historie","vesmír a astronomie","knihy a spisovatelé","mytologie","náboženství a bible","Praha","fyzika a chemie","zimní sporty","olympijské hry","fotbal","hokej","tenis","Formule 1 a závody","státy a vlajky","starověk","Japonsko","Itálie","USA","Francie","Velká Británie","Německo a Rakousko","Slovensko","metro a MHD","běh a atletika","kraje, regiony a provincie","sousední státy","vítězové soutěží a turnajů","panovníci a prezidenti","sportovní kluby a ligy","Sluneční soustava","abecedy a písma","kalendář a svátky","evropské regiony a provincie","mezinárodní organizace a jejich členové","sportovní ligy USA","mistrovství světa a Evropy","Formule 1","opery a jejich autoři","česká literatura (díla jednoho autora)","postavy jednoho filmu nebo knihy","chemické prvky a skupiny","měsíce planet","řecká a římská mytologie","bible","abecedy a hláskování","úřední jazyky států","olympijské hry (pořadatelé a sporty)","prezidenti a premiéři"];
const aiQ=st.aiQ,genBusy={};
function pickDomains(n){const recent=new Set(st.dom.slice(-50));const pool=DOMAINS.filter(d=>!recent.has(d));const src=pool.length>=n?pool:DOMAINS;const out=[];while(out.length<n){const d=src[Math.floor(Math.random()*src.length)];if(!out.includes(d))out.push(d)}return out}
async function gen(l){if(!sample||genBusy[l]||aiQ[l].length>=4)return;genBusy[l]=true;const doms=pickDomains(6);
 try{const r=await askAI(`Vymýšlíš zadání pro českou trivia hru Krillion. Hráč na zadání napíše JEDNU odpověď a body dostane podle toho, jak vzácná (a přitom správná) je.
Vymysli přesně 6 zadání, každé z JINÉHO oboru, v tomto pořadí oborů: ${doms.map((d,i)=>(i+1)+") "+d).join(", ")}.
Obtížnost: ${LV[l]}.
Pravidla: každé zadání musí projít PŘÍSNÝM testem: „Existuje oficiální nebo všeobecně uznávaný úplný výčet, podle kterého jde u každé odpovědi jednoznačně říct ano/ne?“ Ano = státy, hlavní města, kraje a regiony, sousední státy, planety a měsíce planet, chemické prvky, souhvězdí, kosti těla, týmy konkrétní ligy, vítězové konkrétní soutěže, prezidenti a panovníci jedné země, stanice metra, díla jednoho autora, postavy konkrétního díla, písmena abecedy, dny a měsíce. Ne = cokoli bez pevného výčtu: "místnost v domě", "věc v…", "něco, co…", "druh/typ něčeho" bez pevné definice, vlastnosti, pocity, povolání, hračky, nářadí, jídla, nápoje, oblečení, barvy, sporty, hudební nástroje, hudební žánry, rostliny a zvířata obecně, slavní lidé, herci, zpěváci, filmy a hry obecně, značky. U časově proměnných seznamů uveď rozsah (např. "(i bývalý)", "(od roku 1993)", "(do roku 2025)"). Nikdy se neptej na jednu konkrétní věc (žádné "současný", "první", "nejvyšší"); musí existovat aspoň 8 správných odpovědí; max 12 slov; začni slovem "Jmenuj"; nepoužívej obměny běžných témat (státy Evropy, hlavní města, zvěrokruh), pokud obor přímo nevyžaduje.
Nepoužívej tato zadání ani jejich obměny: ${JSON.stringify(st.used.slice(-60))}
Vrať pouze JSON: {"prompts":[{"q":"...","d":"obor"}, ...]}`);
  const known=[...BASE.map(b=>b.q),...st.used.slice(-400)];for(const k of[1,2,3,4])for(const p of aiQ[k])known.push(p.q);
  for(const p of(r&&r.prompts||[])){const q=typeof p==="string"?p:p&&p.q;if(typeof q!=="string"||q.length>100||!/^jmenuj/i.test(q.trim()))continue;if(tooSimilar(q,known))continue;known.push(q);aiQ[l].push({q:q.trim(),d:String(p.d||"").slice(0,60)})}
  st.dom.push(...doms);st.dom=st.dom.slice(-60);save()}catch(e){}genBusy[l]=false}
async function aiJudge(q,ans){const r=await askAI(`Jsi rozhodčí české trivia hry Krillion. Zadání: "${q}". Odpověď hráče: "${ans}".
1) Je odpověď věcně správná a odpovídá zadání? Buď velmi tolerantní: přijmi odpovědi s diakritikou i bez ní, s překlepy, celé jméno i jen příjmení, synonyma, poddruhy a odrůdy (např. "bílý tygr" je zvíře), složená slova (např. "automechanik" je povolání), hovorové, cizí i odborné názvy (např. "dračí ovoce" = pitahaya). Neplatné je jen to, co je jednoznačně špatně, mimo zadání, příliš obecné nebo nesmysl. Když si nejsi jistý, odpověď UZNEJ. Příklady platných odpovědí: "Hanoj" je hlavní město (Vietnam), "Kost" je český hrad, "Jazz" je hudební žánr.
2) Odhadni, kolik procent běžných českých hráčů by na toto zadání napsalo právě tuto odpověď (vše dohromady = 100 %). Kalibrace pro "Jmenuj ovoce": jablko 24, banán 15, jahoda 8, mango 3, kiwi 2.5, liči 1, dračí ovoce 0.8, kumquat 0.2, mangostan 0.05.
3) Uveď 3 nejčastější odpovědi.
Názvy piš spisovnou češtinou s diakritikou a velkým počátečním písmenem.
Vrať pouze JSON: {"valid":true|false,"name":"správný název","pct":číslo,"top":["","",""],"reason":"pokud neplatné, max 8 slov"}`,"default");
 if(!r||typeof r.valid!=="boolean")throw 0;return{valid:r.valid,name:String(r.name||ans).slice(0,60),tier:tierFromPct(+r.pct||5),top:(r.top||[]).slice(0,3).map(String),reason:String(r.reason||"").slice(0,80)}}
