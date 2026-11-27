{
const P=window.KRILLION_DATA||[];
const TIERS=[{n:"Plankton",p:10,c:"#8ef0c6"},{n:"Kril",p:25,c:"#ff9585"},{n:"Tuňák",p:50,c:"#63b6ff"},{n:"Žralok",p:75,c:"#97a6ff"},{n:"Jeden z krilionu",p:100,c:"#ffd36e"}];
const MULT={1:1,2:1.25,3:1.6,4:2};
const ZONES=[[0,"Sluneční zóna"],[200,"Soumraková zóna"],[1000,"Půlnoční zóna"],[4000,"Propastná zóna"],[6000,"Hadalská zóna"],[11000,"Hlouběji než Mariánský příkop"]];
const zoneOf=m=>ZONES.filter(z=>m>=z[0]).pop()[1];
const $=id=>document.getElementById(id),card=$("card");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=n=>Math.round(n).toLocaleString("cs-CZ")+" m";
const norm=s=>String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
const BASE=P.map(([lvl,q,a])=>({lvl,q,list:a.split(",").map(x=>{const v=x.split("|");return{show:v[0],vars:v,keys:v.map(norm)}})}));
/* ---------- odvozené otázky: na písmeno, podle délky ---------- */
const letterOf=s=>{const u=s.trim();return /^ch/i.test(u)?"Ch":u.charAt(0).toUpperCase()};
const lvlByCount=c=>c>=60?1:c>=25?2:c>=10?3:4;
const DB=BASE.map(b=>({...b,kind:"base",fam:b.q}));
function subset(b,pick){const m=new Map();for(const e of b.list)e.vars.forEach((v,i)=>{if(!pick(v))return;if(!m.has(e))m.set(e,{show:v,vars:[],keys:[]});const r=m.get(e);r.vars.push(v);r.keys.push(e.keys[i])});return[...m.values()]}
const clampL=x=>Math.max(1,Math.min(4,x));
const letters=v=>v.replace(/[\s\-.'’&]/g,"").length;
for(const b of []){if(b.list.length<15)continue;
 const Ls=new Set(b.list.flatMap(e=>e.vars.map(letterOf)).filter(L=>/^(Ch|[A-ZÁČĎÉÍŘŠŤÚŽ])$/.test(L)));
 for(const L of Ls){const list=subset(b,v=>letterOf(v)===L);if(list.length>=4)DB.push({lvl:clampL(b.lvl+(list.length>=20?0:list.length>=10?1:2)),q:`${b.q} (na písmeno ${L})`,list,kind:"letter",L,fam:b.q})}
 for(const n of[8,10,12]){const list=subset(b,v=>letters(v)>=n);if(list.length>=6)DB.push({lvl:clampL(b.lvl+(list.length>=25?1:2)),q:`${b.q} (aspoň ${n} písmen)`,list,kind:"min",n,fam:b.q})}}
for(const x of DB)if(x.lvl===2&&x.list.length>=40)x.lvl=1;
const DBQ=new Map(DB.map(x=>[x.q,x]));

/* ---------- rozpoznávání odpovědí ---------- */
const lev=(a,b)=>{if(Math.abs(a.length-b.length)>3)return 9;const d=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let p=d[0];d[0]=i;for(let j=1;j<=b.length;j++){const t=d[j];d[j]=Math.min(d[j]+1,d[j-1]+1,p+(a[i-1]===b[j-1]?0:1));p=t}}return d[b.length]};
const tol=L=>L>=9?2:L>=4?1:0;
function close(a,b){if(a===b)return true;const L=Math.min(a.length,b.length);if(Math.abs(a.length-b.length)>3)return false;
 if(lev(a,b)<=tol(L))return true;
 if(L>=5&&Math.abs(a.length-b.length)<=2&&a.slice(0,-2)===b.slice(0,-2))return true; // slovní tvary: tygři, Paříže…
 return false}
/* kmen slova: šmoulí/šmoulová/šmoula → smoul, čokoládová/čokoláda → cokolad, vanilková/vanilka → vanilk */
const stem=t=>{if(t.length<5)return t;const r=t.replace(/(ovou|ove|ova|ovy|ovi|ou|emu|eho|ych|ymi|ie|ia)$/,"");return(r.length>=4?r:t).replace(/[aeiouy]$/,"")};
const stemEqW=(a,b)=>{const x=stem(a),y=stem(b);return x.length>=4&&x===y};
const stemAll=(n,v)=>{const a=n.split(" "),b=v.split(" ");return a.length===b.length&&a.some(t=>t.length>=5)&&a.every((t,i)=>t===b[i]||stemEqW(t,b[i])||close(t,b[i]))};
const strong=(n,v)=>close(n,v)||close(n.replace(/ /g,""),v.replace(/ /g,""))||stemAll(n,v);
function weak(n,v){const nt=n.split(" ").filter(t=>t.length>=3);
 if(!v.includes(" ")){if(nt.length>1&&v.length>=3&&nt.some(t=>close(t,v)))return true}
 else{const vt=v.split(" ").filter(t=>t.length>=3);if(vt.length&&vt.every(x=>nt.some(t=>close(t,x))))return true}
 const nc=n.replace(/ /g,""),vc=v.replace(/ /g,"");if(vc.length>=5&&nc.length>vc.length+1&&nc.endsWith(vc))return true; // automechanik → mechanik
 return false}
/* neúplná víceslovná odpověď: „arabská“ → Arabská káva, „lední“ → Lední medvěd, „francouzský“ → Francouzský buldoček.
   Hráč napíše odlišující slova a vynechá zbytek. Platí jen tehdy, když vynechané slovo je v zadání (1),
   nebo když napsaná slova jsou jasná přídavná jména (-ský, -cký, -ový, -ní, -čí…, aspoň 5 písmen) a nejsou obecná ani křestní jména (2). Shoda musí být jednoznačná (řeší localJudge). */
const stemEq=(a,b)=>{if(close(a,b))return true;let i=0;while(i<a.length&&i<b.length&&a[i]===b[i])i++;return i>=3&&i>=Math.max(a.length,b.length)-2};
const ADJ=/(sk[yae]|ck[yae]|ov[yae]|ni|[czsjlb]i)$/;
const GEN="cern bil cerven zlut zelen modr hned sed ruzov fialov oranzov zlat stribr velk mal obr trpasl severn jizn vychodn zapadn stredn horn doln vnitrn nov star mlad obecn domac divok lesn poln horsk morsk vodn sladk slan kysel ostr cist prav lev dlouh kratk sirok tenk tlust klasick tradicn obycejn normaln spolecn svat spojen kralovsk cisarsk narodn hlavn prvn druh posledn jin dalsi cel jedn takov obri obrovsk mensi vetsi nejvets dobr zl hezk krasn".split(" ");
const generic=t=>GEN.some(g=>t.startsWith(g)&&t.length<=g.length+3);
let NAMES=null;const isName=t=>{if(!NAMES){const src=typeof window!=="undefined"&&window.KRILLION_NAMES||"";NAMES=new Set(src.split(/[,|]/).map(norm).filter(Boolean))}return NAMES.has(t)};
function part(n,v,qt,eq=close){const nt=n.split(" "),vt=v.split(" ");if(vt.length<2||nt.length>=vt.length||nt.some(t=>t.length<4))return 0;
 const used=new Set();for(const t of nt){const j=vt.findIndex((x,j)=>!used.has(j)&&eq(t,x));if(j<0)return 0;used.add(j)}
 if(nt.some(isName))return 0; // „Petr“ ≠ Petr Čech
 const rest=vt.filter((x,j)=>!used.has(j)&&x.length>=3);if(!rest.length)return 0;
 if(nt.some(t=>qt.some(w=>stemEq(t,w))))return 0; // „káva“ samotná u kávy nestačí
 if(rest.every(x=>qt.some(w=>stemEq(x,w))))return 1;
 const lead=[...used].every(j=>j<nt.length),sur=nt.length===1&&used.has(vt.length-1)&&/ova$/.test(nt[0]); // přídavné jméno na začátku, nebo příjmení -ová na konci
 if((lead||sur)&&nt.every(t=>t.length>=5&&ADJ.test(t)&&!generic(t)))return 2;
 return 0}
function tierAt(i,len){const f=i/len;return f<.15?0:f<.35?1:f<.6?2:f<.85?3:4}
function looseLocal(q,ans){const words=norm(q).split(" ").filter(w=>w.length>=4&&!["jmenuj","jakekoli","jakykoli","jakoukoli","ktereho","kterehokoli","kterykoli","nebo","kdekoli","svete"].includes(w));
 for(const b of BASE){const bq=norm(b.q);if(!words.some(w=>bq.includes(w.slice(0,5))))continue;const r=localJudge(b.q,ans);if(r&&r.valid)return r}return null}
function localJudge(q,ans){const it=DBQ.get(q);if(!it)return null;const n=norm(ans);const top=it.list.slice(0,3).map(x=>x.show);if(!n)return{valid:false,top};
 if(it.kind!=="base"){const base=DBQ.get(it.fam);const br=base&&localJudge(base.q,ans);
  if(it.kind==="letter"&&!n.startsWith(norm(it.L)))return{valid:false,reason:br&&br.valid?`${br.name} nezačíná na ${it.L}`:`Nezačíná na ${it.L}`,top};
  if(it.kind==="min"&&br&&br.valid&&letters(br.name)<it.n)return{valid:false,reason:`${br.name} má jen ${letters(br.name)} písmen, potřeba aspoň ${it.n}`,top}}
 for(const test of it.kind!=="base"&&it.kind!=="letter"?[(n,v)=>n===v,strong]:[(n,v)=>n===v,strong,weak])for(let i=0;i<it.list.length;i++){const k=it.list[i].keys.findIndex(v=>test(n,v));if(k<0)continue;
  const name=test===weak&&it.list[i].keys[k].split(" ").length<n.split(" ").length?ans.trim().replace(/^./,c=>c.toUpperCase()):it.list[i].vars[k];
  return{valid:true,name,tier:tierAt(i,it.list.length),top}}
 // nejdřív přesně napsaná slova („pažní“ → Pažní kost), teprve pak s překlepem (jinak by „pažní“ kolidovalo s „patní“)
 if(it.kind!=="min"){const qt=norm(it.fam).split(" ").filter(w=>w.length>=3);
  for(const eq of[(x,y)=>x===y,close]){const hit=[new Map(),new Map()];
   for(let i=0;i<it.list.length;i++)for(let k=0;k<it.list[i].keys.length;k++){const r=part(n,it.list[i].keys[k],qt,eq);if(r&&!hit[r-1].has(i))hit[r-1].set(i,k)}
   const h=hit.find(h=>h.size);if(!h)continue;if(h.size>1)break;const[[i,k]]=h;const e=it.list[i],j=e.keys[0].includes(" ")?0:k;return{valid:true,name:e.vars[j],tier:tierAt(i,it.list.length),top}}}
 return{valid:false,reason:"Tohle neplatí",top}}
const tierFromPct=p=>p>=12?0:p>=4?1:p>=1.2?2:p>=0.3?3:4;

/* ---------- paměť a výběr témat (testuje tests/select.test.js) ---------- */
const KEY="krillion5";
function loadState(ls){const s={best:0,runs:0,used:[],fam:{},cnt:{},seq:0,aiQ:{1:[],2:[],3:[],4:[]},dom:[]};
 try{const r=JSON.parse(ls.getItem(KEY)||"{}");if(r&&typeof r==="object")Object.assign(s,r)}catch(e){}
 const obj=x=>x&&typeof x==="object"&&!Array.isArray(x);if(!obj(s.fam))s.fam={};if(!obj(s.cnt))s.cnt={};if(!Array.isArray(s.used))s.used=[];if(!Array.isArray(s.dom))s.dom=[];
 if(!obj(s.aiQ))s.aiQ={};for(const k of[1,2,3,4])if(!Array.isArray(s.aiQ[k]))s.aiQ[k]=[];s.seq=+s.seq||0;
 for(const f in s.fam)if(!(s.cnt[f]>0)&&s.fam[f]>0)s.cnt[f]=1; // starší uložení bez počítadla: co už padlo, padlo jednou
 return s}
function saveState(ls,s){try{ls.setItem(KEY,JSON.stringify(s));return true}catch(e){return false}}
/* Téma se smí zopakovat až po vystřídání všech ostatních: bere se jen z témat, která padla nejméněkrát,
   z nich co nejblíž požadované obtížnosti, a mezi nimi to nejdéle nepoužité. */
function pickTopic(st,run,l,rnd=Math.random){const fams=new Map();for(const x of DB){if(x.kind==="base"&&!fams.has(x.fam))fams.set(x.fam,x)}
 let all=[...fams.values()].filter(x=>!run.fams.has(x.fam));if(!all.length)all=[...fams.values()];
 const cnt=x=>st.cnt[x.fam]||0,seq=x=>st.fam[x.fam]||0,dist=x=>Math.abs(x.lvl-l);
 const c0=Math.min(...all.map(cnt));let pool=all.filter(x=>cnt(x)===c0);
 const d0=Math.min(...pool.map(dist));pool=pool.filter(x=>dist(x)===d0);
 const s0=Math.min(...pool.map(seq));pool=pool.filter(x=>seq(x)===s0);
 const pick=pool[Math.floor(rnd()*pool.length)];
 run.asked.add(pick.q);run.fams.add(pick.fam);run.lastKind=pick.kind;
 st.seq=(st.seq||0)+1;st.fam[pick.fam]=st.seq;st.cnt[pick.fam]=cnt(pick)+1;st.used.push(pick.q);if(st.used.length>2500)st.used=st.used.slice(-2500);return pick}
/* zadání od Clauda nesmí být obměnou vestavěného tématu ani nedávno použitého zadání */
const QSTOP=new Set("jmenuj jakekoli jakykoli jakoukoli jakehokoli nejakou nejaky nebo ktery ktera ktere kterou ktereho kterehokoli kterykoli kdekoli svete celem sveta cesku cesky ceske ceskou ceskeho bylo byvaly byvaleho byvalou byvale treba napriklad".split(" "));
const qWords=q=>norm(q).split(" ").filter(w=>w.length>=3&&!QSTOP.has(w)).map(w=>w.slice(0,5));
function tooSimilar(q,list){const a=new Set(qWords(q));if(!a.size)return true;
 for(const o of list){const b=new Set(qWords(o));if(!b.size)continue;let k=0;for(const w of a)if(b.has(w))k++;if(k/Math.min(a.size,b.size)>=.6)return true}return false}
/* ---------- konec výběru ---------- */
let st=loadState(localStorage);
/* trvalá paměť: úložiště artefaktu (přežije zavření aplikace), záloha v prohlížeči */
let dbRef=null,remoteBusy=false,remoteDirty=false,remoteT=null;
function mergeState(r){if(!r||typeof r!=="object")return;st.best=Math.max(st.best||0,+r.best||0);st.runs=Math.max(st.runs||0,+r.runs||0);st.seq=Math.max(st.seq||0,+r.seq||0);
 const f=r.fam&&typeof r.fam==="object"?r.fam:{};for(const k in f)st.fam[k]=Math.max(st.fam[k]||0,+f[k]||0);
 if(r.aiQ&&typeof r.aiQ==="object")for(const k of[1,2,3,4]){const arr=Array.isArray(r.aiQ[k])?r.aiQ[k]:[];for(const p of arr)if(p&&typeof p.q==="string"&&!st.aiQ[k].some(x=>x.q===p.q))st.aiQ[k].push({q:String(p.q).slice(0,100),d:String(p.d||"").slice(0,60)})}
 if(Array.isArray(r.dom))st.dom=[...new Set([...st.dom,...r.dom.filter(x=>typeof x==="string")])].slice(-60);
 const u=Array.isArray(r.used)?r.used.filter(x=>typeof x==="string"):[];const set=new Set(st.used);for(const q of u)if(!set.has(q)){st.used.unshift(q);set.add(q)}if(st.used.length>2500)st.used=st.used.slice(-2500)}
async function pushRemote(){if(!dbRef||remoteBusy)return;remoteBusy=true;remoteDirty=false;
 try{await dbRef.set({best:st.best,runs:st.runs,seq:st.seq,fam:st.fam,used:st.used.slice(-2500),aiQ:st.aiQ,dom:st.dom.slice(-60)})}catch(e){}
 remoteBusy=false;if(remoteDirty)pushRemote()}
const save=()=>{saveState(localStorage,st);remoteDirty=true;clearTimeout(remoteT);remoteT=setTimeout(pushRemote,1500)};
(async()=>{try{if(!window.claude||!window.claude.use)return;const[db,user]=await Promise.all([window.claude.use("db"),window.claude.use("user")]);if(!db||!user)return;const id=await user.id();if(!id)return;
 const ref=db.doc("data/users/"+id+"/krillion");const snap=await ref.get();dbRef=ref;if(snap.exists){mergeState(snap.data());saveState(localStorage,st)}}catch(e){}})();
// Safari po 7 dnech bez návštěvy maže localStorage; požádej o trvalé úložiště, kde to jde
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist().catch(()=>{})}catch(e){}

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
const DOMAINS=["zvířata","jídlo a vaření","sport obecně","filmy","hudba","zeměpis světa","česká kultura a tradice","světová historie","česká historie","věda a vynálezy","vesmír a astronomie","lidské tělo a medicína","auta a motorismus","doprava a cestování","deskové a společenské hry","umění a malíři","architektura a stavby","knihy a spisovatelé","pohádky a dětství","mytologie","náboženství a bible","škola a vzdělání","zahrada a rostliny","počasí a přírodní jevy","jazyky a slova","svátky a oslavy","Praha","matematika","fyzika a chemie","oceán a mořský život","hmyz","ptáci","domácí mazlíčci","farma a zemědělství","letectví","lodě a námořnictví","hory a turistika","zimní sporty","olympijské hry","fotbal","hokej","tenis","Formule 1 a závody","superhrdinové a komiksy","animované filmy","fantasy a sci-fi","peníze a ekonomika","státy a vlajky","města světa","řeky, jezera a moře","ostrovy a pláže","hudební nástroje","tanec a divadlo","fotografie a film","nemocnice a zdravotnictví","pravěk a dinosauři","starověk","středověk a rytíři","energie a elektřina","památky světa","Japonsko","Itálie","USA","Francie","Velká Británie","Německo a Rakousko","Slovensko","Asie","Afrika","Latinská Amerika","klasická hudba","kriminalistika a detektivky","armáda a válka","vojenská technika","rybaření a myslivost","káva a čaj","sýry a mléčné výrobky","koření a byliny","ovoce a zelenina","pivo a víno","hotely a cestovní ruch","letiště a aerolinky","vlaky a železnice","metro a MHD","kolo a cyklistika","běh a atletika","bojové sporty","vodní sporty","golf a tenis","šachy a hlavolamy","karetní hry","magie a kouzelníci","vesmírné mise","geologie a horniny","drahé kameny a šperky","barvy a tvary","čas a kalendář","hudební festivaly","muzea a galerie","zámky a hrady","kraje, regiony a provincie","sousední státy","vítězové soutěží a turnajů","panovníci a prezidenti","sportovní kluby a ligy","Sluneční soustava","abecedy a písma","kalendář a svátky"];
const aiQ=st.aiQ,genBusy={};
function pickDomains(n){const recent=new Set(st.dom.slice(-50));const pool=DOMAINS.filter(d=>!recent.has(d));const src=pool.length>=n?pool:DOMAINS;const out=[];while(out.length<n){const d=src[Math.floor(Math.random()*src.length)];if(!out.includes(d))out.push(d)}return out}
async function gen(l){if(!sample||genBusy[l]||aiQ[l].length>=4)return;genBusy[l]=true;const doms=pickDomains(6);
 try{const r=await askAI(`Vymýšlíš zadání pro českou trivia hru Krillion. Hráč na zadání napíše JEDNU odpověď a body dostane podle toho, jak vzácná (a přitom správná) je.
Vymysli přesně 6 zadání, každé z JINÉHO oboru, v tomto pořadí oborů: ${doms.map((d,i)=>(i+1)+") "+d).join(", ")}.
Obtížnost: ${LV[l]}.
Pravidla: zadání musí mít UZAVŘENOU množinu správných odpovědí, kterou jde vyjmenovat celou a ověřit v seznamu (státy, hlavní města, kraje a regiony, sousední státy, planety a měsíce, prvky, týmy konkrétní ligy, vítězové konkrétní soutěže, panovníci a prezidenti jedné země, díla jednoho autora, postavy jednoho díla, oficiální seznamy, písmena abecedy…). Hranice musí být jednoznačná: nikdy nesmí jít o otevřenou kategorii, kam se dá napsat cokoli (žádné "slavný…", "známý…", "oblíbený…", "věc, kterou…", "něco, co…", "druh jídla", "herec", "zpěvák", "film", "videohra", "povolání", "vlastnost", "vynález", "značka"). U časově proměnných seznamů uveď rozsah (např. "(i bývalý)", "(od roku 1993)", "(do roku 2025)"). Nikdy se neptej na jednu konkrétní věc (žádné "současný", "první", "nejvyšší"); musí existovat aspoň 8 správných odpovědí; max 12 slov; začni slovem "Jmenuj"; nepoužívej obměny běžných témat (státy Evropy, hlavní města, zvěrokruh), pokud obor přímo nevyžaduje.
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

/* ---------- klávesnice a sklo ---------- */
const stage=$("stage"),hud=$("hud"),vv=window.visualViewport;let vTop=0,vH=innerHeight;
function fit(){vH=vv?vv.height:innerHeight;vTop=vv?vv.offsetTop:0;stage.style.top=vTop+"px";stage.style.height=vH+"px";hud.style.transform=`translateY(${vTop}px)`;document.body.classList.toggle("kb",!!vv&&innerHeight-vH>140)}
if(vv){vv.addEventListener("resize",fit);vv.addEventListener("scroll",fit)}addEventListener("resize",fit);fit();
addEventListener("scroll",()=>{if(!document.body.classList.contains("kb"))scrollTo(0,0)});
if(!matchMedia("(pointer: coarse)").matches)addEventListener("pointermove",e=>{for(const g of document.querySelectorAll(".glass")){const r=g.getBoundingClientRect();g.style.setProperty("--mx",((e.clientX-r.left)/r.width*100)+"%");g.style.setProperty("--my",((e.clientY-r.top)/r.height*100)+"%")}});

/* ---------- oceán ---------- */
const cv=$("sea"),cx=cv.getContext("2d");let W=0,H=0;
const dk=document.createElement("canvas"),dx=dk.getContext("2d");
const RM=matchMedia("(prefers-reduced-motion: reduce)").matches;
const MOBILE=matchMedia("(pointer: coarse)").matches;let SBK=MOBILE?0:1,Q=MOBILE?1:2,frameAvg=16;
{const d=Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype,"shadowBlur");Object.defineProperty(cx,"shadowBlur",{get(){return d.get.call(this)},set(v){d.set.call(this,v*SBK)}})}
const BUB=document.createElement("canvas");BUB.width=BUB.height=48;{const b=BUB.getContext("2d"),gg=b.createRadialGradient(17,17,0,24,24,24);gg.addColorStop(0,"rgba(255,255,255,.85)");gg.addColorStop(.7,"rgba(255,255,255,.08)");gg.addColorStop(.92,"rgba(255,255,255,.55)");gg.addColorStop(1,"rgba(255,255,255,0)");b.fillStyle=gg;b.fillRect(0,0,48,48)}
let VIG=null;function vignette(){VIG=document.createElement("canvas");VIG.width=Math.ceil(W/2);VIG.height=Math.ceil(H/2);const v=VIG.getContext("2d"),gg=v.createRadialGradient(W/4,H/5,Math.min(W,H)*.17,W/4,H/4,Math.max(W,H)*.4);gg.addColorStop(0,"rgba(0,6,18,0)");gg.addColorStop(1,"rgba(0,6,18,1)");v.fillStyle=gg;v.fillRect(0,0,W,H)}
function rs(){const d=Math.min(devicePixelRatio||1,MOBILE?1.25:2)*(Q<1?.85:1);W=innerWidth;H=innerHeight;cv.width=W*d;cv.height=H*d;cx.setTransform(d,0,0,d,0,0);dk.width=Math.ceil(W/2);dk.height=Math.ceil(H/2);dx.setTransform(.5,0,0,.5,0,0);vignette()}
addEventListener("resize",rs);rs();
const CS=[[0,[96,214,238]],[120,[34,152,200]],[500,[14,88,145]],[1500,[8,44,86]],[4000,[4,17,40]],[7000,[1,4,13]],[12000,[0,2,6]]];
function col(m){for(let i=1;i<CS.length;i++)if(m<=CS[i][0]){const[a,ca]=CS[i-1],[b,cb]=CS[i],t=(m-a)/(b-a);return ca.map((v,k)=>Math.round(v+(cb[k]-v)*t))}return CS.at(-1)[1]}
const rgb=(c,a=1)=>`rgba(${c[0]},${c[1]},${c[2]},${a})`;
const snow=Array.from({length:150},(_,i)=>({x:Math.random(),y:Math.random(),r:i<110?Math.random()*1.1+.3:Math.random()*2+1.4,w:Math.random()*6,z:i<110?.5:1.3}));
const glow=Array.from({length:55},()=>({x:Math.random(),y:Math.random(),p:Math.random()*6,c:Math.random()<.5?"#8ff7ff":"#a9ffcf"}));
const bub=[],sparks=[];
// [druh, hloubka, x (0–1), rychlost driftu px/s (0 = vlní se na místě)]
const LIFE=[["school",60,.2,22],["barracuda",130,.75,-30],["turtle",200,.8,-12],["manta",300,.3,16],["school",380,.7,-26],["shark",480,.6,-34],["whale",650,.4,10],["jelly",880,.22,0],["lantern",1150,.6,20],["jelly",1300,.8,0],["hatchet",1700,.3,-14],["squid",2050,.34,0],["vampire",2600,.72,0],["eel",3100,.25,18],["siph",3500,.25,0],["dumbo",3900,.7,0],["angler",4300,.3,0],["lantern",4700,.55,-18],["jelly",5000,.8,0],["angler",5500,.74,0],["snail",6400,.38,8],["dumbo",7000,.25,0],["siph",7400,.7,0],["eel",8200,.6,-16],["jelly",8800,.26,0],["angler",9300,.66,0],["snail",10200,.3,6],["siph",11200,.6,0],["angler",12400,.3,0],["vampire",13300,.7,0],["dumbo",14600,.4,0]];
let depth=0,target=0,lastT=0,kick=0,hurt=0,ease=1000,nextBreath=0,dyS=170;
function px(xf,spd,t,d){if(!spd)return W*xf+Math.sin(t/2800+d)*W*.06;const span=W+520;return((W*xf+spd*t/1000)%span+span)%span-260}
const FG={};function fgrad(c1,c2){const k=c1+c2;if(!FG[k]){const g=cx.createLinearGradient(0,-4,0,4);g.addColorStop(0,c1);g.addColorStop(1,c2);FG[k]=g}return FG[k]}
function fish(x,y,s,a,dir,c1,c2){cx.save();cx.translate(x,y);cx.scale(dir*s,s);cx.fillStyle=fgrad(c1||`rgba(235,252,255,${a})`,c2||`rgba(130,185,215,${a*.75})`);cx.beginPath();cx.moveTo(11,0);cx.quadraticCurveTo(6,-4.5,-4,-3.6);cx.quadraticCurveTo(-8,-1.5,-9,0);cx.quadraticCurveTo(-8,1.5,-4,3.6);cx.quadraticCurveTo(6,4.5,11,0);cx.fill();cx.beginPath();cx.moveTo(-8,0);cx.lineTo(-15,-5);cx.lineTo(-13,0);cx.lineTo(-15,5);cx.fill();cx.fillStyle=`rgba(255,255,255,${a*.5})`;cx.fillRect(-4,-.6,12,.9);cx.fillStyle=`rgba(5,20,35,${a})`;cx.beginPath();cx.arc(7,-1,1,0,7);cx.fill();cx.restore()}
function creature(k,x,y,t,d,lum,dir){
 if(k==="school"){for(let i=0;i<22;i++){const a=i*2.4,r=18+(i*13)%46;fish(x+Math.cos(a+t/2400)*r*1.4,y+Math.sin(a+t/2400)*r*.55+Math.sin(t/500+i)*2,.85+(i%3)*.15,.6,dir)}}
 else if(k==="barracuda"){for(let i=0;i<4;i++){cx.save();cx.translate(x+i*34,y+i*16+Math.sin(t/700+i)*3);cx.scale(dir,1);const g=cx.createLinearGradient(0,-5,0,5);g.addColorStop(0,"rgba(120,150,170,.85)");g.addColorStop(1,"rgba(220,235,240,.75)");cx.fillStyle=g;cx.beginPath();cx.moveTo(40,1);cx.lineTo(30,-4);cx.quadraticCurveTo(0,-6,-30,-2);cx.lineTo(-30,2);cx.quadraticCurveTo(0,6,30,4);cx.fill();cx.beginPath();cx.moveTo(-28,0);cx.lineTo(-40,-8);cx.lineTo(-36,0);cx.lineTo(-40,8);cx.fill();cx.fillStyle="rgba(40,60,80,.5)";for(let j=0;j<6;j++)cx.fillRect(-18+j*7,-4,2,4);cx.fillStyle="#0a1520";cx.beginPath();cx.arc(30,-1,1.2,0,7);cx.fill();cx.restore()}}
 else if(k==="turtle"){cx.save();cx.translate(x,y);cx.scale(dir,1);cx.rotate(Math.sin(t/2000)*.06);const f=Math.sin(t/600)*.5;cx.fillStyle="rgba(60,110,95,.85)";cx.save();cx.translate(10,-14);cx.rotate(-.9+f);cx.beginPath();cx.ellipse(0,-10,6,16,0,0,7);cx.fill();cx.restore();cx.save();cx.translate(10,14);cx.rotate(.9-f);cx.beginPath();cx.ellipse(0,10,6,16,0,0,7);cx.fill();cx.restore();cx.beginPath();cx.ellipse(-24,-10,4,8,-.8,0,7);cx.ellipse(-24,10,4,8,.8,0,7);cx.fill();const tg=cx.createRadialGradient(-6,-8,2,0,0,30);tg.addColorStop(0,"rgba(150,190,120,.95)");tg.addColorStop(.6,"rgba(90,130,80,.95)");tg.addColorStop(1,"rgba(50,85,60,.95)");cx.fillStyle=tg;cx.beginPath();cx.ellipse(0,0,28,20,0,0,7);cx.fill();cx.strokeStyle="rgba(30,50,30,.45)";cx.lineWidth=1.2;cx.beginPath();cx.moveTo(-14,-10);cx.lineTo(-4,-14);cx.lineTo(8,-12);cx.lineTo(16,-4);cx.lineTo(16,4);cx.lineTo(8,12);cx.lineTo(-4,14);cx.lineTo(-14,10);cx.lineTo(-18,0);cx.closePath();cx.moveTo(-4,-14);cx.lineTo(0,0);cx.lineTo(8,-12);cx.moveTo(0,0);cx.lineTo(16,4);cx.moveTo(0,0);cx.lineTo(-4,14);cx.moveTo(0,0);cx.lineTo(-18,0);cx.stroke();cx.fillStyle="rgba(110,150,110,.95)";cx.beginPath();cx.ellipse(34,0,10,7,0,0,7);cx.fill();cx.fillStyle="#102010";cx.beginPath();cx.arc(39,-2.5,1.4,0,7);cx.fill();cx.restore()}
 else if(k==="manta"){cx.save();cx.translate(x,y);cx.scale(dir,1);const f=Math.sin(t/800)*14;const mg=cx.createLinearGradient(0,-70,0,70);mg.addColorStop(0,"rgba(16,40,64,.9)");mg.addColorStop(.5,"rgba(30,62,90,.85)");mg.addColorStop(1,"rgba(16,40,64,.9)");cx.fillStyle=mg;cx.beginPath();cx.moveTo(46,-6);cx.quadraticCurveTo(14,-24-f,-24,-78-f);cx.quadraticCurveTo(-18,-26,-42,0);cx.quadraticCurveTo(-18,26,-24,78+f);cx.quadraticCurveTo(14,24+f,46,6);cx.fill();cx.fillStyle="rgba(16,40,64,.9)";cx.beginPath();cx.ellipse(48,-9,8,3,.5,0,7);cx.ellipse(48,9,8,3,-.5,0,7);cx.fill();cx.strokeStyle="rgba(16,40,64,.8)";cx.lineWidth=1.6;cx.beginPath();cx.moveTo(-42,0);cx.quadraticCurveTo(-80,4,-115,Math.sin(t/500)*7);cx.stroke();cx.fillStyle="rgba(220,240,255,.12)";cx.beginPath();cx.ellipse(6,0,18,10,0,0,7);cx.fill();cx.restore()}
 else if(k==="shark"){cx.save();cx.translate(x,y);cx.scale(dir,1);const sw=Math.sin(t/380)*.14;const sg=cx.createLinearGradient(0,-24,0,24);sg.addColorStop(0,"rgba(50,78,100,.95)");sg.addColorStop(.55,"rgba(78,110,135,.92)");sg.addColorStop(.62,"rgba(200,215,225,.9)");sg.addColorStop(1,"rgba(225,235,240,.85)");cx.fillStyle=sg;cx.beginPath();cx.moveTo(84,4);cx.quadraticCurveTo(70,-16,30,-18);cx.quadraticCurveTo(-30,-14,-70,-3);cx.lineTo(-70,3);cx.quadraticCurveTo(-30,14,30,16);cx.quadraticCurveTo(70,16,84,4);cx.fill();cx.save();cx.translate(-68,0);cx.rotate(sw);cx.fillStyle="rgba(55,82,104,.95)";cx.beginPath();cx.moveTo(4,-2);cx.quadraticCurveTo(-14,-16,-28,-38);cx.quadraticCurveTo(-18,-8,-14,0);cx.quadraticCurveTo(-18,8,-26,24);cx.quadraticCurveTo(-10,10,4,2);cx.fill();cx.restore();cx.fillStyle="rgba(50,78,100,.95)";cx.beginPath();cx.moveTo(16,-16);cx.quadraticCurveTo(4,-34,-10,-50);cx.quadraticCurveTo(-8,-26,-16,-14);cx.fill();cx.beginPath();cx.moveTo(26,10);cx.quadraticCurveTo(10,26,-4,36);cx.quadraticCurveTo(0,20,4,12);cx.fill();cx.strokeStyle="rgba(20,35,50,.5)";cx.lineWidth=1;for(let i=0;i<4;i++){cx.beginPath();cx.moveTo(44-i*5,-8);cx.quadraticCurveTo(42-i*5,-2,44-i*5,4);cx.stroke()}cx.fillStyle="#050a10";cx.beginPath();cx.arc(64,-3,2.3,0,7);cx.fill();cx.fillStyle="rgba(255,255,255,.6)";cx.beginPath();cx.arc(64.7,-3.7,.7,0,7);cx.fill();cx.restore()}
 else if(k==="whale"){cx.save();cx.translate(x,y);cx.scale(dir,1);const tf=Math.sin(t/1100)*8;const wg=cx.createLinearGradient(0,-44,0,44);wg.addColorStop(0,"rgba(20,62,98,.8)");wg.addColorStop(.6,"rgba(12,44,76,.8)");wg.addColorStop(1,"rgba(70,110,140,.6)");cx.fillStyle=wg;cx.beginPath();cx.moveTo(180,6);cx.quadraticCurveTo(170,-36,80,-42);cx.quadraticCurveTo(-60,-40,-170,-6);cx.lineTo(-170,6);cx.quadraticCurveTo(-60,36,80,40);cx.quadraticCurveTo(170,40,180,6);cx.fill();cx.beginPath();cx.moveTo(-165,0);cx.quadraticCurveTo(-200,-10,-238,-44+tf);cx.quadraticCurveTo(-218,-6,-226,0);cx.quadraticCurveTo(-218,6,-240,42+tf);cx.quadraticCurveTo(-200,10,-165,4);cx.fill();cx.beginPath();cx.moveTo(60,30);cx.quadraticCurveTo(30,70,-10,80);cx.quadraticCurveTo(20,50,30,34);cx.fill();cx.strokeStyle="rgba(150,190,215,.18)";cx.lineWidth=1.2;for(let i=0;i<7;i++){cx.beginPath();cx.moveTo(150-i*12,20);cx.quadraticCurveTo(110-i*12,34,60-i*12,36);cx.stroke()}cx.fillStyle="#04101c";cx.beginPath();cx.arc(140,8,3,0,7);cx.fill();cx.restore()}
 else if(k==="jelly"){const p=Math.sin(t/520+d)*.13;cx.save();cx.shadowBlur=lum?30:8;cx.shadowColor=lum?"#9ff4ff":"rgba(255,255,255,.5)";const jg=cx.createRadialGradient(x,y-8,2,x,y,28);jg.addColorStop(0,lum?"rgba(230,255,255,.9)":"rgba(255,255,255,.6)");jg.addColorStop(.6,lum?"rgba(140,230,255,.45)":"rgba(255,255,255,.25)");jg.addColorStop(1,lum?"rgba(120,220,255,.2)":"rgba(255,255,255,.1)");cx.fillStyle=jg;cx.beginPath();cx.ellipse(x,y,26*(1+p),20*(1-p),0,Math.PI,0);cx.quadraticCurveTo(x+13,y+6,x,y+3);cx.quadraticCurveTo(x-13,y+6,x-26*(1+p),y);cx.fill();cx.fillStyle=lum?"rgba(255,180,240,.6)":"rgba(255,200,230,.4)";for(let i=0;i<4;i++){cx.beginPath();cx.arc(x+Math.cos(i*1.57)*7,y-8+Math.sin(i*1.57)*4,3.2,0,7);cx.fill()}cx.strokeStyle=lum?"rgba(170,240,255,.55)":"rgba(255,255,255,.35)";cx.lineWidth=1.1;for(let i=-4;i<=4;i++){cx.beginPath();cx.moveTo(x+i*5.5,y+3);for(let j=1;j<10;j++)cx.lineTo(x+i*5.5+Math.sin(t/380+j*.7+i)*(3+j*.4),y+3+j*9);cx.stroke()}cx.lineWidth=3;cx.strokeStyle=lum?"rgba(255,190,240,.35)":"rgba(255,220,240,.25)";for(let i=-1;i<=1;i++){cx.beginPath();cx.moveTo(x+i*6,y+3);for(let j=1;j<6;j++)cx.lineTo(x+i*6+Math.sin(t/500+j+i)*6,y+3+j*10);cx.stroke()}cx.restore()}
 else if(k==="lantern"){cx.save();for(let i=0;i<18;i++){const a=i*2.4,r=14+(i*11)%40,fx=x+Math.cos(a+t/2600)*r*1.5,fy=y+Math.sin(a+t/2600)*r*.6;fish(fx,fy,.8,.5,dir,"rgba(60,80,110,.8)","rgba(30,40,60,.8)");cx.fillStyle=`rgba(140,240,255,${.5+.5*Math.sin(t/300+i)})`;cx.shadowBlur=10;cx.shadowColor="#8ff7ff";for(let j=0;j<3;j++){cx.beginPath();cx.arc(fx+dir*(-3+j*4),fy+2.6,.9,0,7);cx.fill()}cx.shadowBlur=0}cx.restore()}
 else if(k==="hatchet"){cx.save();for(let i=0;i<6;i++){const fx=x+(i%3)*40,fy=y+Math.floor(i/3)*34+Math.sin(t/600+i)*4;cx.save();cx.translate(fx,fy);cx.scale(dir,1);const g=cx.createLinearGradient(0,-10,0,10);g.addColorStop(0,"rgba(190,210,230,.85)");g.addColorStop(1,"rgba(110,140,170,.75)");cx.fillStyle=g;cx.beginPath();cx.moveTo(10,-6);cx.lineTo(-6,-7);cx.lineTo(-10,0);cx.quadraticCurveTo(-2,14,8,6);cx.closePath();cx.fill();cx.beginPath();cx.moveTo(-9,0);cx.lineTo(-15,-4);cx.lineTo(-15,4);cx.fill();cx.fillStyle="#fff";cx.beginPath();cx.arc(6,-3,2.4,0,7);cx.fill();cx.fillStyle="#000";cx.beginPath();cx.arc(6.4,-3,1.3,0,7);cx.fill();cx.fillStyle="rgba(150,240,255,.85)";cx.shadowBlur=8;cx.shadowColor="#8ff7ff";for(let j=0;j<4;j++){cx.beginPath();cx.arc(4-j*3,6-j*1.4,.9,0,7);cx.fill()}cx.restore()}cx.restore()}
 else if(k==="squid"){cx.save();cx.translate(x,y);cx.rotate(-.5+Math.sin(t/1600)*.12);cx.shadowBlur=18;cx.shadowColor="#ff8a7a";const g2=cx.createLinearGradient(-14,0,14,0);g2.addColorStop(0,"rgba(220,90,80,.55)");g2.addColorStop(.5,"rgba(255,160,140,.75)");g2.addColorStop(1,"rgba(220,90,80,.55)");cx.fillStyle=g2;cx.beginPath();cx.moveTo(0,-56);cx.quadraticCurveTo(20,-12,13,36);cx.lineTo(-13,36);cx.quadraticCurveTo(-20,-12,0,-56);cx.fill();cx.beginPath();cx.moveTo(0,-56);cx.lineTo(16,-38);cx.lineTo(-16,-38);cx.fill();cx.fillStyle="rgba(255,255,255,.7)";cx.beginPath();cx.arc(-7,28,3,0,7);cx.arc(7,28,3,0,7);cx.fill();cx.strokeStyle="rgba(255,150,130,.6)";cx.lineWidth=2.2;cx.lineCap="round";for(let i=-3;i<=3;i++){cx.beginPath();cx.moveTo(i*3,36);cx.quadraticCurveTo(i*6+Math.sin(t/300+i)*7,64,i*5+Math.sin(t/400+i)*4,88);cx.stroke()}cx.lineWidth=1.4;for(const s of[-1,1]){cx.beginPath();cx.moveTo(s*4,36);cx.bezierCurveTo(s*14,80,s*4+Math.sin(t/350)*10,110,s*16,128);cx.stroke()}cx.restore()}
 else if(k==="vampire"){cx.save();cx.translate(x,y);const p=Math.sin(t/900);cx.shadowBlur=14;cx.shadowColor="#5ff";const vg=cx.createRadialGradient(0,-6,2,0,0,40);vg.addColorStop(0,"rgba(150,40,50,.85)");vg.addColorStop(1,"rgba(70,10,20,.8)");cx.fillStyle=vg;cx.beginPath();cx.ellipse(0,-14,14,18,0,0,7);cx.fill();cx.beginPath();cx.moveTo(-12,-2);for(let i=0;i<=8;i++){const a=Math.PI*(i/8),r=34+p*8+(i%2)*6;cx.lineTo(Math.cos(a)*r*-1,Math.sin(a)*r*.7+4)}cx.lineTo(12,-2);cx.fill();cx.beginPath();cx.ellipse(-12,-28,6,3,-.6,0,7);cx.ellipse(12,-28,6,3,.6,0,7);cx.fill();cx.fillStyle="rgba(120,255,255,.9)";cx.beginPath();cx.arc(-6,-14,2.4,0,7);cx.arc(6,-14,2.4,0,7);cx.fill();cx.restore()}
 else if(k==="eel"){cx.save();cx.translate(x,y);cx.scale(dir,1);cx.strokeStyle="rgba(15,15,22,.9)";cx.lineCap="round";for(let w=6;w>0;w-=2){cx.lineWidth=w;cx.beginPath();for(let i=0;i<=30;i++){const xx=-i*7,yy=Math.sin(t/300-i*.35)*(4+i*.5);i?cx.lineTo(xx,yy):cx.moveTo(xx,yy)}cx.stroke()}cx.fillStyle="rgba(20,18,28,.95)";cx.beginPath();cx.moveTo(0,0);cx.quadraticCurveTo(22,-22,34,-6);cx.lineTo(4,2);cx.quadraticCurveTo(24,24,34,10);cx.lineTo(4,4);cx.fill();const tx=-210,ty=Math.sin(t/300-30*.35)*19;cx.fillStyle=`rgba(255,120,190,${.6+.4*Math.sin(t/250)})`;cx.shadowBlur=14;cx.shadowColor="#ff7ac8";cx.beginPath();cx.arc(tx,ty,3,0,7);cx.fill();cx.restore()}
 else if(k==="siph"){cx.save();cx.shadowBlur=16;cx.shadowColor="#8ff7ff";for(let i=0;i<26;i++){const ppx=x+Math.sin(t/900+i*.35)*30+i*9,ppy=y+Math.sin(i*.5+t/1100)*14;cx.fillStyle=`rgba(160,250,255,${.25+.45*Math.max(0,Math.sin(t/300-i*.4))})`;cx.beginPath();cx.arc(ppx,ppy,2.4,0,7);cx.fill();if(i%3===0){cx.strokeStyle="rgba(160,250,255,.18)";cx.lineWidth=.8;cx.beginPath();cx.moveTo(ppx,ppy);cx.lineTo(ppx+Math.sin(t/400+i)*5,ppy+26);cx.stroke()}}cx.restore()}
 else if(k==="dumbo"){cx.save();cx.translate(x,y+Math.sin(t/900)*8);const e=Math.sin(t/350)*.5;const dg=cx.createRadialGradient(-4,-8,2,0,0,26);dg.addColorStop(0,"rgba(255,200,190,.9)");dg.addColorStop(1,"rgba(220,120,120,.8)");cx.fillStyle=dg;cx.save();cx.translate(-16,-10);cx.rotate(-.6+e);cx.beginPath();cx.ellipse(0,0,10,5,0,0,7);cx.fill();cx.restore();cx.save();cx.translate(16,-10);cx.rotate(.6-e);cx.beginPath();cx.ellipse(0,0,10,5,0,0,7);cx.fill();cx.restore();cx.beginPath();cx.ellipse(0,-4,17,15,0,0,7);cx.fill();cx.beginPath();cx.moveTo(-16,2);for(let i=0;i<=8;i++){const xx=-16+i*4;cx.lineTo(xx,14+Math.sin(t/300+i)*3+(i%2)*4)}cx.lineTo(16,2);cx.fill();cx.fillStyle="#2a0a0a";cx.beginPath();cx.arc(-6,-4,2.2,0,7);cx.arc(6,-4,2.2,0,7);cx.fill();cx.restore()}
 else if(k==="angler"){cx.save();cx.translate(x,y);cx.scale(dir||1,1);const ag=cx.createRadialGradient(6,-6,4,0,0,40);ag.addColorStop(0,"rgba(50,44,58,.95)");ag.addColorStop(1,"rgba(8,8,12,.92)");cx.fillStyle=ag;cx.beginPath();cx.moveTo(36,6);cx.quadraticCurveTo(34,-26,0,-26);cx.quadraticCurveTo(-30,-22,-34,0);cx.quadraticCurveTo(-30,22,0,24);cx.quadraticCurveTo(26,24,36,10);cx.fill();cx.beginPath();cx.moveTo(-30,0);cx.lineTo(-56,-18);cx.quadraticCurveTo(-48,0,-56,18);cx.fill();cx.fillStyle="rgba(12,10,16,.95)";cx.beginPath();cx.moveTo(36,6);cx.lineTo(10,10);cx.lineTo(34,14);cx.fill();cx.strokeStyle="rgba(240,240,230,.75)";cx.lineWidth=1.1;for(let i=0;i<6;i++){cx.beginPath();cx.moveTo(14+i*3.6,7);cx.lineTo(15+i*3.6,1);cx.moveTo(14+i*3.6,11);cx.lineTo(15+i*3.6,16);cx.stroke()}cx.fillStyle="rgba(200,220,255,.35)";cx.beginPath();cx.arc(16,-8,3.4,0,7);cx.fill();cx.strokeStyle="rgba(255,255,255,.25)";cx.beginPath();cx.moveTo(14,-22);cx.quadraticCurveTo(30,-56,52,-38);cx.stroke();cx.restore()}
 else if(k==="snail"){cx.save();cx.translate(x,y);cx.scale(dir||1,1);const sg=cx.createLinearGradient(0,-12,0,12);sg.addColorStop(0,"rgba(255,230,240,.5)");sg.addColorStop(1,"rgba(230,180,200,.35)");cx.fillStyle=sg;cx.beginPath();cx.ellipse(0,0,32,12,0,0,7);cx.fill();cx.beginPath();cx.moveTo(-28,-3);cx.quadraticCurveTo(-58,-6+Math.sin(t/420)*7,-76,0);cx.quadraticCurveTo(-58,6,-28,5);cx.fill();cx.fillStyle="rgba(20,0,10,.6)";cx.beginPath();cx.arc(20,-3,2,0,7);cx.fill();cx.restore()}}
function lure(x,y,t,dir){const lx=x+(dir||1)*52,gl=.65+Math.sin(t/280)*.35;cx.save();cx.shadowBlur=36;cx.shadowColor="#ffd36e";cx.fillStyle=`rgba(255,228,150,${gl})`;cx.beginPath();cx.arc(lx,y-38,5,0,7);cx.fill();cx.globalAlpha=gl*.15;cx.beginPath();cx.arc(lx,y-38,30,0,7);cx.fill();cx.restore()}
function limb(x1,y1,x2,y2,bend,w,c){const mx=(x1+x2)/2,my=(y1+y2)/2,dxl=x2-x1,dyl=y2-y1,l=Math.hypot(dxl,dyl)||1;const kx=mx-dyl/l*bend,ky=my+dxl/l*bend;cx.strokeStyle=c;cx.lineWidth=w;cx.lineCap="round";cx.lineJoin="round";cx.beginPath();cx.moveTo(x1,y1);cx.lineTo(kx,ky);cx.lineTo(x2,y2);cx.stroke();return[kx,ky]}
const rot2=(x,y,a)=>{const c=Math.cos(a),s=Math.sin(a);return[x*c-y*s,x*s+y*c]};
/* Potápěč s klouby. Bez P plave (póza ze hry). P={leg:0–1 sed, tuck:0–1 schoulení, neck:otočení hlavy, hand:0–1 ruka na masce, kk:síla kopu}
   – díky tomu se dá posadit na loď, převalit zády do vody a plynule přejít do plavání. */
function diver(x,y,t,tilt,P){const sp=230-kick*90,ka=P?P.kk:1,k=Math.sin(t/sp)*(1+kick*.7)*ka,k2=Math.sin(t/sp+Math.PI)*(1+kick*.7)*ka;
 const leg=P?P.leg:0,tuck=P?P.tuck:0,neck=P?P.neck:0,hand=P?P.hand:0;
 cx.save();cx.translate(x,y);cx.rotate(tilt);cx.scale(1.18,1.18);
 const suit="#121a24",suit2="#2a3b50",rim="rgba(190,240,255,.55)",acc="#ff8a6b";
 // nohy + ploutve (zadní tmavší): plavání = natažené dozadu s kopem; sed = stehna dopředu, lýtka dolů
 for(const[o,kk,sh]of[[3,k2,.75],[-3,k,1]]){const hx=-17,hy=o+1;let fx=-50,fy=o+2+kk*7;
  const b=kk*3+2,dl=Math.hypot(fx-hx,fy-hy);let kx=(hx+fx)/2-(fy-hy)/dl*b,ky=(hy+fy)/2+(fx-hx)/dl*b;
  if(leg>0){const sw=Math.sin(t/820+o)*.1*(1-tuck),aT=Math.PI/2-tuck*.9+(o>0?.1:0),aS=aT+Math.PI/2+tuck*.5+sw,qx=hx+Math.cos(aT)*18,qy=hy+Math.sin(aT)*18;
   kx+=(qx-kx)*leg;ky+=(qy-ky)*leg;fx+=(qx+Math.cos(aS)*17-fx)*leg;fy+=(qy+Math.sin(aS)*17-fy)*leg}
  cx.strokeStyle=sh<1?"#0d141c":suit;cx.lineWidth=8.5;cx.lineCap="round";cx.lineJoin="round";cx.beginPath();cx.moveTo(hx,hy);cx.lineTo(kx,ky);cx.lineTo(fx,fy);cx.stroke();
  cx.save();cx.translate(fx,fy);cx.rotate(Math.atan2(fy-ky,fx-kx)+Math.PI+kk*.35*(1-leg)-leg*.4);const fg=cx.createLinearGradient(-30,0,0,0);fg.addColorStop(0,sh<1?"rgba(200,95,75,.75)":"rgba(255,140,110,.8)");fg.addColorStop(1,sh<1?"#c8644e":acc);cx.fillStyle=fg;cx.beginPath();cx.moveTo(2,-3.5);cx.quadraticCurveTo(-14,-11,-34,-10);cx.quadraticCurveTo(-28,0,-34,10);cx.quadraticCurveTo(-14,11,2,3.5);cx.fill();cx.strokeStyle="rgba(255,255,255,.25)";cx.lineWidth=.8;cx.beginPath();cx.moveTo(-4,-1);cx.lineTo(-30,-3);cx.moveTo(-4,1);cx.lineTo(-30,3);cx.stroke();cx.restore()}
 // láhev
 const tg=cx.createLinearGradient(0,-24,0,-10);tg.addColorStop(0,"#fff4c8");tg.addColorStop(.35,"#f4cb55");tg.addColorStop(1,"#a97a14");cx.fillStyle=tg;cx.beginPath();cx.roundRect(-22,-23,40,11,5.5);cx.fill();cx.fillStyle="rgba(0,0,0,.25)";cx.fillRect(-12,-23,2,11);cx.fillRect(6,-23,2,11);cx.fillStyle="#3b3f45";cx.beginPath();cx.roundRect(17,-21,6,7,2);cx.fill();cx.fillStyle="#d9dee3";cx.beginPath();cx.arc(24,-17.5,2.2,0,7);cx.fill();
 // trup
 const bg=cx.createLinearGradient(0,-13,0,11);bg.addColorStop(0,suit2);bg.addColorStop(.5,suit);bg.addColorStop(1,"#0a0f15");cx.fillStyle=bg;cx.beginPath();cx.moveTo(20,-9);cx.quadraticCurveTo(4,-14,-18,-8);cx.quadraticCurveTo(-24,0,-18,7);cx.quadraticCurveTo(4,12,20,7);cx.quadraticCurveTo(26,-1,20,-9);cx.fill();
 // vesta BCD
 const vg=cx.createLinearGradient(0,-12,0,10);vg.addColorStop(0,"#3c5470");vg.addColorStop(1,"#1d2b3c");cx.fillStyle=vg;cx.beginPath();cx.moveTo(18,-9);cx.quadraticCurveTo(6,-12,-6,-10);cx.lineTo(-8,6);cx.quadraticCurveTo(6,10,18,6);cx.closePath();cx.fill();cx.fillStyle=acc;cx.fillRect(-6,-3,24,2.4);cx.fillStyle="#9aa4ad";cx.beginPath();cx.roundRect(-14,4,6,5,1.2);cx.fill();cx.fillStyle="#2b2f34";cx.fillRect(-18,3,30,2.2);
 // hadice k automatice (konec se otáčí s hlavou)
 const[rx0,ry0]=rot2(7.5,7,neck),rx=30+rx0,ry=-6+ry0;
 cx.strokeStyle="#1b1f24";cx.lineWidth=2;cx.beginPath();cx.moveTo(22,-16);cx.bezierCurveTo(30,-18,rx-1,ry-9,rx-.5,ry-1);cx.stroke();cx.strokeStyle="#ffcc4d";cx.lineWidth=1.6;cx.beginPath();cx.moveTo(20,-14);cx.bezierCurveTo(14,4,22,12,26,10);cx.stroke();
 // zadní paže
 const ax=Math.sin(t/900)*2,bx2=30+(-12-30)*leg,by2=10+ax+(-8-10-ax)*leg;limb(14,-2,bx2,by2,-3+leg*7,5.5,"#0d141c");cx.fillStyle="#0d141c";cx.beginPath();cx.arc(bx2,by2,3,0,7);cx.fill();
 // hlava (s krkem: v sedu se dívá dopředu, při plavání před sebe)
 cx.save();if(neck){cx.translate(30,-6);cx.rotate(neck);cx.translate(-30,6)}
 const hg=cx.createRadialGradient(28,-9,1,30,-6,10);hg.addColorStop(0,suit2);hg.addColorStop(1,suit);cx.fillStyle=hg;cx.beginPath();cx.arc(30,-6,9,0,7);cx.fill();cx.strokeStyle="#0a0e13";cx.lineWidth=1.4;cx.beginPath();cx.arc(30,-6,8,-2.2,-.6);cx.stroke();
 const mg=cx.createLinearGradient(32,-13,41,-3);mg.addColorStop(0,"#e5fdff");mg.addColorStop(.35,"#6fd8ef");mg.addColorStop(1,"#155d80");cx.fillStyle="#111";cx.beginPath();cx.roundRect(31,-13.5,11,10,3.5);cx.fill();cx.fillStyle=mg;cx.beginPath();cx.roundRect(32.3,-12.3,8.6,7.6,2.6);cx.fill();cx.fillStyle="rgba(255,255,255,.85)";cx.beginPath();cx.moveTo(33.4,-11.4);cx.lineTo(36,-11.4);cx.lineTo(34,-7);cx.lineTo(33.4,-7);cx.fill();
 cx.fillStyle="#2d3238";cx.beginPath();cx.arc(37.5,1,3.2,0,7);cx.fill();cx.fillStyle="#ffcc4d";cx.fillRect(36.2,-.4,2.6,1.2);
 cx.fillStyle="#1d2228";cx.beginPath();cx.roundRect(25,-16.5,7,4.5,1.5);cx.fill();cx.fillStyle="#fff8d8";cx.beginPath();cx.arc(31.6,-14.3,1.6,0,7);cx.fill();
 cx.restore();
 // přední paže (před skokem drží masku a automatiku)
 const reach=Math.sin(t/1100)*3*(1-hand),sx0=36+(-9-36)*leg*(1-hand),sy0=14+reach+(16-14-reach)*leg*(1-hand),ex=sx0+(rx+1.5-sx0)*hand,ey=sy0+(ry+2.5-sy0)*hand;limb(12,0,ex,ey,4-hand*9-leg*(1-hand)*8,6,suit);cx.fillStyle="#0b0f14";cx.beginPath();cx.ellipse(ex+1.5,ey+.5,3.6,2.8,.4,0,7);cx.fill();
 cx.fillStyle="#d7e3ea";cx.beginPath();cx.roundRect(ex-5,ey-3,4,3.4,1);cx.fill();
 // okrajové světlo
 cx.strokeStyle=rim;cx.lineWidth=1;cx.beginPath();cx.moveTo(-18,-8.4);cx.quadraticCurveTo(4,-14.4,20,-9.4);cx.stroke();cx.beginPath();cx.arc(30,-6,9,-2.6,-1.4);cx.stroke();
 cx.restore()}
function head(x,y,tilt){const c=Math.cos(tilt),s=Math.sin(tilt),lx=31.6*1.18,ly=-14.3*1.18;return[x+c*lx-s*ly,y+s*lx+c*ly]}
function mouth(x,y,tilt){const c=Math.cos(tilt),s=Math.sin(tilt),lx=38*1.18,ly=1*1.18;return[x+c*lx-s*ly,y+s*lx+c*ly]}

/* ---------- scéna u hladiny: obloha, slunce, loď na vlnách a potápěč na zádi.
   Úvod (S.m="roll", ~2,75 s): zakloní se, převalí zády do vody, šplouchnutí, kamera sjede pod hladinu, srovná se a kope dolů.
   Konec (S.m="asc" → "surf"): vystoupá k hladině a vyleze zpátky na loď. Kamera = posun S.co (px) celého světa. ---------- */
const RL={lean:420,fall:1050,cam0:800,cam1:2350,lvl:2550,end:2750},SF={cam:1400,pop:1120,climb0:1260,climb1:2150,end:2350};
const eIO=x=>x<=0?0:x>=1?1:x<.5?2*x*x:1-(-2*x+2)**2/2;
const seg=(e,a,b)=>e<=a?0:e>=b?1:(e-a)/(b-a),mix=(a,b,k)=>a+(b-a)*k;
// Hermitova křivka: navazuje na rychlost z pádu, takže potápěč po dopadu plynule zpomalí (žádné zastavení)
const herm=(p0,m0,p1,s)=>{const s2=s*s,s3=s2*s;return(2*s3-3*s2+1)*p0+(s3-2*s2+s)*m0+(3*s2-2*s3)*p1};
const capM=(m,d)=>Math.sign(m)===Math.sign(d)?Math.sign(m)*Math.min(Math.abs(m),Math.abs(d)*2.4):m*.3;
const S={m:"deck",e:0,sp:1,done:null,co:null,co0:0,coP:0,L:0,bx:0,by:0,r:0,sc0:.6,lay:null,dv:null,snap:30,band:40};
const drops=[],rings=[],foam=[];let crown=null,wwater=null;
const wave=(x,t)=>Math.sin(x/41+t/560)*2.6+Math.sin(x/17-t/340)*1.1;
// sprity a gradienty se vytvoří jednou (výkon na iPhonu), pak už jen drawImage / translate
const sprite=(w,h,f)=>{const c=document.createElement("canvas");c.width=w;c.height=h;f(c.getContext("2d"));return c};
const SUN=sprite(240,240,b=>{const g=b.createRadialGradient(120,120,0,120,120,120);g.addColorStop(0,"rgba(255,252,236,1)");g.addColorStop(.15,"rgba(255,247,214,1)");g.addColorStop(.18,"rgba(255,238,186,.6)");g.addColorStop(.4,"rgba(255,228,170,.2)");g.addColorStop(1,"rgba(255,222,160,0)");b.fillStyle=g;b.fillRect(0,0,240,240)});
const CLOUD=sprite(260,104,b=>{for(const[x,y,r]of[[64,70,30],[104,52,40],[150,48,44],[196,64,32],[38,80,20],[128,78,30],[226,80,18]]){const g=b.createRadialGradient(x-r*.2,y-r*.35,r*.1,x,y,r);g.addColorStop(0,"rgba(255,255,255,1)");g.addColorStop(.75,"rgba(246,251,255,.92)");g.addColorStop(1,"rgba(235,246,252,0)");b.fillStyle=g;b.beginPath();b.arc(x,y,r,0,7);b.fill()}
 b.globalCompositeOperation="source-atop";const g=b.createLinearGradient(0,50,0,104);g.addColorStop(0,"rgba(190,222,238,0)");g.addColorStop(1,"rgba(160,200,224,.45)");b.fillStyle=g;b.fillRect(0,0,260,104)});
const FOAM=sprite(64,64,b=>{const g=b.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,"rgba(255,255,255,.9)");g.addColorStop(.5,"rgba(240,252,255,.45)");g.addColorStop(1,"rgba(240,252,255,0)");b.fillStyle=g;b.fillRect(0,0,64,64)});
let SKY=null,SKYH=0;function skyG(){if(SKYH!==H){SKYH=H;SKY=cx.createLinearGradient(0,-H,0,0);SKY.addColorStop(0,"#2a8fcd");SKY.addColorStop(.45,"#5db6e3");SKY.addColorStop(.8,"#a6dcf0");SKY.addColorStop(.95,"#e2f6f8");SKY.addColorStop(1,"#f6fcf6")}return SKY}
let SEA=null,SEAB=-1;function seaG(b){b=Math.round(b);if(SEAB!==b){SEAB=b;SEA=cx.createLinearGradient(0,0,0,b+6);SEA.addColorStop(0,"#8fd3e4");SEA.addColorStop(.1,"#46aad2");SEA.addColorStop(.55,"#2a93c4");SEA.addColorStop(1,"#1878ad")}return SEA}
let UNB=null;function undG(){if(!UNB){UNB=cx.createLinearGradient(0,0,0,60);UNB.addColorStop(0,"rgba(235,252,255,.4)");UNB.addColorStop(1,"rgba(235,252,255,0)")}return UNB}
let BG=null,BGL=0;function boatG(L){if(BGL===L)return BG;BGL=L;const H1=L*.16,g=(a,b,c)=>{const x=cx.createLinearGradient(0,a,0,b);for(const[o,col]of c)x.addColorStop(o,col);return x};
 BG={hull:g(-H1,L*.07,[[0,"#f4fbff"],[.45,"#d6e6ef"],[.62,"#1c3550"],[1,"#0e1f33"]]),cab:g(-H1-L*.17,-H1,[[0,"#ffffff"],[1,"#cfdde6"]]),win:g(-H1-L*.15,-H1-L*.06,[[0,"#e5fdff"],[.4,"#6fd8ef"],[1,"#155d80"]]),
  under:g(0,L*.08,[[0,"rgba(20,120,170,.55)"],[1,"rgba(10,70,120,.75)"]])};return BG}
/* loď (lokálně: čára vody y=0, záď vlevo); ponořená část prosvítá vodou */
function boat(t){const L=S.L,H1=L*.16,G=boatG(L);cx.save();cx.translate(S.bx,S.by);cx.rotate(S.r);
 const hull=()=>{cx.beginPath();cx.moveTo(-L*.5,-H1);cx.lineTo(L*.36,-H1);cx.quadraticCurveTo(L*.5,-H1-L*.02,L*.53,-H1-L*.05);cx.quadraticCurveTo(L*.44,L*.02,L*.3,L*.07);cx.lineTo(-L*.46,L*.07);cx.quadraticCurveTo(-L*.5,L*.03,-L*.5,-H1)};
 // konzole s předním sklem, stožár s vlajkou „potápěč pod vodou“
 cx.fillStyle=G.cab;cx.beginPath();cx.moveTo(-L*.02,-H1);cx.lineTo(L*.03,-H1-L*.17);cx.lineTo(L*.2,-H1-L*.17);cx.lineTo(L*.27,-H1);cx.closePath();cx.fill();
 cx.fillStyle=G.win;cx.beginPath();cx.moveTo(L*.045,-H1-L*.15);cx.lineTo(L*.19,-H1-L*.15);cx.lineTo(L*.23,-H1-L*.06);cx.lineTo(L*.025,-H1-L*.06);cx.closePath();cx.fill();
 cx.fillStyle="rgba(255,255,255,.8)";cx.beginPath();cx.moveTo(L*.06,-H1-L*.145);cx.lineTo(L*.09,-H1-L*.145);cx.lineTo(L*.06,-H1-L*.07);cx.fill();
 cx.fillStyle="#2a3b50";cx.fillRect(L*.03,-H1-L*.185,L*.17,L*.018);
 cx.strokeStyle="#3b4a58";cx.lineWidth=2;cx.beginPath();cx.moveTo(L*.12,-H1-L*.17);cx.lineTo(L*.12,-H1-L*.36);cx.stroke();
 const fw=Math.sin(t/260)*2,fw2=Math.sin(t/260+1.3)*2;cx.fillStyle="#e8402f";cx.beginPath();cx.moveTo(L*.12,-H1-L*.36);cx.quadraticCurveTo(L*.18,-H1-L*.36+fw2,L*.24,-H1-L*.355+fw);cx.lineTo(L*.24,-H1-L*.275+fw);cx.quadraticCurveTo(L*.18,-H1-L*.28+fw2,L*.12,-H1-L*.28);cx.closePath();cx.fill();
 cx.strokeStyle="#fff";cx.lineWidth=2.6;cx.beginPath();cx.moveTo(L*.125,-H1-L*.352);cx.lineTo(L*.235,-H1-L*.283+fw);cx.stroke();
 // náhradní láhve v lodi
 cx.fillStyle="#f4cb55";for(const o of[0,.055]){cx.beginPath();cx.roundRect(-L*(.24-o),-H1-L*.1,L*.042,L*.11,L*.02);cx.fill()}cx.fillStyle="#3b3f45";cx.fillRect(-L*.228,-H1-L*.118,L*.018,L*.022);cx.fillRect(-L*.173,-H1-L*.118,L*.018,L*.022);
 // trup: bílý nahoře, tmavé dno, oranžový pruh, okénka
 cx.fillStyle=G.hull;hull();cx.fill();
 cx.fillStyle="#ff8a6b";cx.beginPath();cx.moveTo(-L*.5,-H1*.5);cx.lineTo(L*.47,-H1*.62);cx.lineTo(L*.45,-H1*.44);cx.lineTo(-L*.5,-H1*.32);cx.closePath();cx.fill();
 cx.fillStyle="#2a3b50";cx.fillRect(-L*.5,-H1-2,L*.87,3);
 cx.fillStyle="rgba(20,50,80,.75)";for(const x of[.1,.18,.26]){cx.beginPath();cx.arc(L*x,-H1*.78,L*.014,0,7);cx.fill()}
 cx.strokeStyle="rgba(255,255,255,.55)";cx.lineWidth=1;cx.beginPath();cx.moveTo(-L*.49,-H1+1.5);cx.lineTo(L*.36,-H1+1.5);cx.stroke();
 cx.strokeStyle="rgba(190,205,215,.9)";cx.lineWidth=1.6;cx.beginPath();cx.moveTo(-L*.36,-H1);cx.lineTo(-L*.36,-H1-L*.07);cx.lineTo(L*.34,-H1-L*.07);cx.lineTo(L*.34,-H1);cx.moveTo(-L*.36,-H1-L*.07);cx.lineTo(-L*.3,-H1-L*.07);cx.stroke();
 // žebřík na zádi (po něm potápěč vyleze zpátky)
 cx.strokeStyle="#b9c7d1";cx.lineWidth=1.8;cx.beginPath();cx.moveTo(-L*.47,-H1-L*.025);cx.quadraticCurveTo(-L*.53,-H1-L*.03,-L*.53,-H1+L*.01);cx.lineTo(-L*.53,L*.07);cx.stroke();
 cx.lineWidth=1.4;cx.beginPath();for(let y=-H1+L*.03;y<L*.07;y+=L*.03){cx.moveTo(-L*.53,y);cx.lineTo(-L*.555,y)}cx.stroke();
 // pěna u trupu na čáře vody
 cx.fillStyle=`rgba(255,255,255,${.45+Math.sin(t/300)*.15})`;cx.beginPath();cx.ellipse(L*.36,1,L*.07,2.2,0,0,7);cx.ellipse(-L*.48,1,L*.05,1.8,0,0,7);cx.fill();
 // ponořená část trupu prosvítá vodou
 cx.save();cx.beginPath();cx.rect(-L,0,L*2,L*.2);cx.clip();cx.fillStyle=G.under;hull();cx.fill();cx.restore();
 cx.restore()}
/* místo, kde je na úvodní / koncové obrazovce hladina a jak velká je loď: v prostoru mezi HUD a kartou */
function deckLayout(){const top=vTop+64,ct=vTop+Math.max(card.offsetTop,150),free=ct-top,L=Math.max(130,Math.min(W*.6,300,free*1.25));
 return{wl:top+Math.max(free*.8,L*.56+8),L,bx:Math.max(L*.62,Math.min(W*.56,W-L*.6))}}
function seat(t){const H1=S.L*.16,[a,b]=rot2(-S.L*.455,-H1-1,S.r);return{x:S.bx+a,y:S.by+b,rot:-Math.PI/2+S.r+Math.sin(t/1900)*.03}}
function fromHip(hx,hy,rot,sc){const k=1.18*sc,[a,b]=rot2(-17*k,k,rot);return[hx-a,hy-b]}
const SEAT_P=t=>({leg:1,tuck:0,neck:1.4+Math.sin(t/2600)*.15,hand:0,kk:0});
/* převal: poloha středu těla vůči hladině během pádu (u = 0–1) */
function fallPose(u,t){const s=S.h0,rot=S.r0-Math.PI*.95*u**1.7,hx=s[0]-S.L*.16*u*u*(3-2*u),hy=s[1]+(22-s[1])*u*u;const[x,y]=fromHip(hx,hy,rot,S.sc0);return{x,y,rot}}
function splash(x,big,sY){const n=big?(MOBILE?22:34):(MOBILE?8:12),s=big?1:.55;
 for(let i=0;i<n;i++){const a=-Math.PI/2+(Math.random()-.5)*(big?1.9:1.3),v=(Math.random()*.3+.14)*s+.04;drops.push({x:x+(Math.random()-.5)*16,y:-2,vx:Math.cos(a)*v,vy:Math.sin(a)*v,r:Math.random()*2.2+.9})}
 for(let i=0;i<(big?3:2);i++)rings.push({x,a:-i*200,big});
 for(let i=0;i<(big?7:3);i++)foam.push({x:x+(Math.random()-.5)*(big?46:18),w:Math.random()*14+8,l:1,s:(Math.random()-.5)*.03});
 if(big){crown={x,a:0};wwater={x,a:0};for(let i=0;i<(MOBILE?26:42);i++)bub.push({x:x+(Math.random()-.5)*50,y:sY+8+Math.random()*80,r:Math.random()*4+1.4,vy:Math.random()*1.3+.7,d:Math.random()*380,w:Math.random()*6})}}
function rollStep(t,e,sY,dxp,dyp,tilt){let x,y,rot,sc=S.sc0,P;
 if(e<RL.lean){const s=seat(t),p=eIO(e/RL.lean);rot=s.rot-.34*p;[x,y]=fromHip(s.x,s.y,rot,sc);P={leg:1,tuck:.35*p,neck:1.4-.6*p,hand:eIO(e/280),kk:0};S.h0=[s.x,s.y-sY];S.r0=rot}
 else if(e<RL.fall){const u=(e-RL.lean)/(RL.fall-RL.lean),f=fallPose(u,t);x=f.x;y=sY+f.y;rot=f.rot;P={leg:1,tuck:.35+.6*eIO(u),neck:.8-.45*u,hand:1,kk:0};
  if(!S.spl&&y>sY-2){S.spl=true;splash(x,true,sY)}}
 else{if(!S.f1){const D=RL.fall-RL.lean,a=fallPose(1,t),b=fallPose(.98,t);S.f1=a;S.fv={x:(a.x-b.x)/(.02*D),y:(a.y-b.y)/(.02*D),r:(a.rot-b.rot)/(.02*D)};if(!S.spl){S.spl=true;splash(a.x,true,sY)}}
  const D=RL.lvl-RL.fall,s=seg(e,RL.fall,RL.lvl),tx=dxp,ty=dyp-(vTop-70),tr=tilt-Math.PI*2,f=S.f1;
  x=herm(f.x,capM(S.fv.x*D,tx-f.x),tx,s);y=sY+herm(f.y,capM(S.fv.y*D,ty-f.y),ty,s);rot=herm(f.rot,capM(S.fv.r*D,tr-f.rot),tr,s);
  if(e>=RL.lvl){x=dxp;y=sY+ty;rot=tr}
  const g=eIO(seg(e,RL.fall,RL.fall+750));P={leg:1-g,tuck:.95*(1-eIO(seg(e,RL.fall,RL.fall+600))),neck:.35*(1-g),hand:1-eIO(seg(e,RL.fall+250,RL.fall+950)),kk:eIO(seg(e,RL.fall+250,RL.fall+900))};
  sc=mix(S.sc0,1,eIO(seg(e,RL.fall,RL.end-250)));if(!S.kicked&&e>RL.fall+350){S.kicked=true;kick=1}}
 S.dv={x,y,rot,sc,P};if(e>=RL.end)endRoll()}
function surfStep(t,e,sY,dxp,dyp,tilt){if(!S.s0)S.s0={x:dxp,y:dyp-sY,rot:tilt};const st=seat(t),ax=st.x-S.L*.07,ay=26,up=-Math.PI/2+.08;let x,y,rot,sc,P;
 if(e<SF.climb0){const p=eIO(seg(e,0,SF.climb0));x=mix(S.s0.x,ax,p);y=sY+mix(S.s0.y,ay,p);rot=mix(S.s0.rot,up,eIO(seg(e,0,SF.climb0*.85)));sc=mix(1,S.sc0,p);P={leg:0,tuck:0,neck:.3*p,hand:0,kk:1}}
 else{const c=eIO(seg(e,SF.climb0,SF.climb1)),[sx,sy]=fromHip(st.x,st.y,st.rot,S.sc0);x=mix(ax,sx,c);y=mix(sY+ay,sy,c);rot=mix(up,st.rot,c);sc=S.sc0;
  P={leg:eIO(seg(e,SF.climb0+60,SF.climb1)),tuck:.45*Math.sin(Math.PI*c),neck:mix(.3,1.4,c),hand:0,kk:1-c};
  if(e<SF.climb1+400&&Math.random()<.3)drops.push({x:x+(Math.random()-.5)*16*S.sc0,y:y-sY+8,vx:0,vy:.02,r:Math.random()*1.3+.6})}
 if(!S.pop&&e>=SF.pop){S.pop=true;splash(ax,false,sY)}
 S.dv={x,y,rot,sc,P};if(e>=SF.end){S.m="deck";S.e=0}}
function beginRoll(done){if(S.m!=="deck"){S.m="deck";depth=target=0;S.co=null;S.snap=1}S.lay=deckLayout();if(S.snap>0||S.co===null){S.L=S.lay.L;S.bx=S.lay.bx;S.co=S.lay.wl-(vTop-70)}
 S.co0=S.co;S.m="roll";S.e=0;S.sp=1;S.spl=false;S.kicked=false;S.f1=null;S.done=done}
function endRoll(){if(S.m!=="roll")return;S.m="dive";S.sp=1;S.dv=null;const d=S.done;S.done=null;d&&d()}
function beginAscent(){if(RM){S.m="deck";depth=target=0;S.co=null;S.snap=1;return}S.m="asc";S.aD=depth;S.aT=Math.max(1300,Math.min(3800,1000+depth*.3));S.e=-500;target=0;S.s0=null;S.pop=false}
/* jeden snímek scény: kamera, loď, póza potápěče; vrací y hladiny na obrazovce */
function sceneStep(t,dt,dxp,dyp,tilt){if(S.m!=="roll")S.lay=deckLayout();const lay=S.lay,k=S.snap>0||S.co===null?1:Math.min(1,dt/280);if(S.snap>0)S.snap--;
 if(S.m!=="roll"){S.L+=(lay.L-S.L)*k;S.bx+=(lay.bx-S.bx)*k}
 const coHome=lay.wl-(vTop-70);S.band=Math.max(26,Math.min(64,H*.07));S.sc0=S.L/300*.86;
 if(S.m==="roll"||S.m==="surf")S.e+=dt*S.sp;const e=S.e;
 if(S.m==="deck")S.co=S.co===null?coHome:S.co+(coHome-S.co)*k;
 else if(S.m==="roll")S.co=S.co0*(1-eIO(seg(e,RL.cam0,RL.cam1)));
 else if(S.m==="surf")S.co=coHome*eIO(seg(e,0,SF.cam));
 else S.co=0;
 const sY=vTop-70-depth*(H/900)+S.co;
 S.r=Math.sin(t/1150)*.032+Math.sin(t/640+1)*.012;S.by=sY+wave(S.bx,t)*.5+Math.sin(t/930)*1.2+1;
 S.dv=null;
 if(S.m==="deck"){const s=seat(t),[x,y]=fromHip(s.x,s.y,s.rot,S.sc0);S.dv={x,y,rot:s.rot,sc:S.sc0,P:SEAT_P(t)}}
 else if(S.m==="roll")rollStep(t,e,sY,dxp,dyp,tilt);
 else if(S.m==="surf")surfStep(t,e,sY,dxp,dyp,tilt);
 return sY}
/* obloha, slunce, mraky, moře k obzoru, čára hladiny, loď; při a<1 pohled zespodu (stříbřitá hladina) */
function surfaceLayer(t,sY){const band=S.band,hz=sY-band,lay=S.lay;
 cx.save();cx.translate(0,hz);cx.fillStyle=skyG();cx.fillRect(-2,-hz-2,W+4,hz+3);cx.restore();
 // slunce a mraky (kreslí se z hotových spritů)
 const sunH=Math.max(56,(lay.wl-band-vTop-70)*.58),sx=W*.82,sy=hz-sunH;cx.drawImage(SUN,sx-120,sy-120);
 for(let i=0;i<3;i++){const s=[.85,.6,.42][i],cw=260*s,x=((i*.39+t/(90000+i*30000))%1)*(W+cw*2)-cw,y=hz-sunH*[1.15,.62,.3][i]-52*s;cx.globalAlpha=[.92,.8,.7][i];cx.drawImage(CLOUD,x,y,cw,104*s)}cx.globalAlpha=1;
 // moře až k obzoru, vzdálené vlnky, odlesk slunce
 cx.save();cx.translate(0,hz);cx.fillStyle=seaG(band);cx.beginPath();cx.moveTo(-2,0);cx.lineTo(W+2,0);for(let x=W+2;x>-16;x-=16)cx.lineTo(x,band+wave(x,t));cx.lineTo(-16,band+wave(-16,t));cx.closePath();cx.fill();
 cx.fillStyle="rgba(255,255,255,.55)";cx.fillRect(0,0,W,1);
 cx.strokeStyle="rgba(255,255,255,.2)";cx.lineWidth=1;for(let j=0;j<3;j++){const yy=band*(.3+j*.22);cx.beginPath();for(let x=0;x<=W+24;x+=24){const y=yy+Math.sin(x/(22+j*14)+t/(900-j*150)+j*2)*(.6+j*.5);x?cx.lineTo(x,y):cx.moveTo(x,y)}cx.stroke()}
 cx.fillStyle="rgba(255,250,228,.8)";cx.beginPath();for(let i=0;i<12;i++){const f=i/12,w=(5+f*20)*(.3+.7*Math.abs(Math.sin(t/(170+i*23)+i*1.7))),xx=sx+Math.sin(i*2.3+t/900)*(5+f*16);cx.rect(xx-w/2,2+f*(band-7),w,1.2+f*1.3)}cx.fill();
 cx.restore();
 // kroužky na hladině po šplouchnutí
 for(const r of rings){if(r.a<=0)continue;const k=r.a/1600,rx=(r.big?14:8)+k*(r.big?100:50),ry=2.2+k*(r.big?8:5);cx.strokeStyle=`rgba(255,255,255,${.75*(1-k)*(1-k)})`;cx.lineWidth=1.6*(1-k)+.6;cx.beginPath();cx.ellipse(r.x,sY+wave(r.x,t)*.6,rx,ry,0,0,7);cx.stroke()}
 // čára hladiny a světlý pás těsně pod ní (hladina nad hlavou, když kamera sjíždí pod vodu)
 undG();cx.save();cx.translate(0,sY);cx.fillStyle=UNB;cx.fillRect(0,0,W,60);cx.strokeStyle="rgba(255,255,255,.9)";cx.lineWidth=1.8;cx.beginPath();for(let x=-16;x<=W+16;x+=16){const y=wave(x,t);x>-16?cx.lineTo(x,y):cx.moveTo(x,y)}cx.stroke();
 cx.strokeStyle="rgba(255,255,255,.22)";cx.lineWidth=1.2;for(let j=1;j<3;j++){cx.beginPath();for(let x=0;x<=W+20;x+=20){const y=j*13+Math.sin(x/(30+j*9)+t/(600-j*90)+j)*3;x?cx.lineTo(x,y):cx.moveTo(x,y)}cx.stroke()}cx.restore();
 boat(t);
 for(const f of foam){cx.fillStyle=`rgba(255,255,255,${.7*f.l})`;cx.beginPath();cx.ellipse(f.x,sY+wave(f.x,t)*.6,f.w,2+f.w*.12,0,0,7);cx.fill()}}
/* šplouchnutí přes potápěče: vodní koruna, kapky, bílá voda pod hladinou */
function splashFx(t,dt,sY){
 for(let i=drops.length-1;i>=0;i--){const d=drops[i];d.x+=d.vx*dt;d.y+=d.vy*dt;d.vy+=.0011*dt;if(d.y>1&&d.vy>0)drops.splice(i,1)}
 for(let i=rings.length-1;i>=0;i--)if((rings[i].a+=dt)>1600)rings.splice(i,1);
 for(let i=foam.length-1;i>=0;i--){const f=foam[i];f.l-=dt/1700;f.w+=dt*.012;f.x+=f.s*dt;if(f.l<=0)foam.splice(i,1)}
 if(wwater){const k=(wwater.a+=dt)/1300;if(k>=1)wwater=null;else{cx.globalAlpha=.55*(1-k);for(let i=0;i<4;i++){const r=(26+k*70)*(1-i*.15),x=wwater.x+(i-1.5)*14*(1+k),y=sY+20+i*9+k*30;cx.drawImage(FOAM,x-r,y-r,r*2,r*2)}cx.globalAlpha=1}}
 if(crown){const k=(crown.a+=dt)/480;if(k>=1)crown=null;else{const h=(S.sc0*70+14)*Math.sin(Math.PI*Math.min(1,k*1.15)),w=7+k*10;cx.fillStyle=`rgba(240,252,255,${.85*(1-k)})`;cx.beginPath();
  for(let i=-3;i<=3;i++){const bx=crown.x+i*w,hh=h*(1-Math.abs(i)/4.2),lean=i*k*4;cx.moveTo(bx-w*.45,sY+2);cx.quadraticCurveTo(bx+lean*.5,sY-hh*.6,bx+lean,sY-hh);cx.quadraticCurveTo(bx+lean*.5+w*.2,sY-hh*.5,bx+w*.45,sY+2)}cx.fill()}}
 if(drops.length){cx.fillStyle="rgba(245,253,255,.95)";cx.beginPath();for(const d of drops){const y=sY+d.y;cx.moveTo(d.x+d.r,y);cx.arc(d.x,y,d.r,0,7)}cx.fill()}}
function draw(t){const dt=Math.min(t-lastT,50)||16;lastT=t;frameAvg=frameAvg*.95+dt*.05;
 if(t>8000&&frameAvg>24&&Q>0&&!draw.cool){Q--;SBK=0;draw.cool=1;setTimeout(()=>draw.cool=0,3000);rs()}
 const prev=depth;if(S.m==="asc"){S.e+=dt;depth=S.aD*(1-eIO(seg(S.e,0,S.aT)));if(S.e>=S.aT){depth=0;S.m="surf";S.e=0;S.s0=null;S.pop=false}}else depth+=(target-depth)*(RM?1:Math.min(1,dt/ease));const v=depth-prev;
 kick=Math.max(0,kick-dt/1400);hurt=Math.max(0,hurt-dt/700);
 // potápěč v prostoru mezi HUD a kartou
 const freeTop=vTop+66,freeBot=vTop+Math.max(card.offsetTop,140);const playing=stage.classList.contains("play");const want=playing?Math.min(vTop+card.offsetTop+card.offsetHeight+95,H-70):Math.max(freeTop+40,Math.min(freeTop+(freeBot-freeTop)*.42,vTop+230));dyS+=(want-dyS)*Math.min(1,dt/350);
 const dxp=W*.5+Math.sin(t/3100)*W*.04,dyp=dyS+Math.sin(t/900)*6+hurt*Math.sin(t/30)*4;
 const tilt=.16+Math.sin(t/1300)*.05+Math.max(-.4,Math.min(v*.03,.55))+kick*.22-(target<depth-5?1:0);
 const sY=sceneStep(t,dt,dxp,dyp,tilt),co=S.co,dco=co-S.coP;S.coP=co;
 if(dco){for(const b of bub)b.y+=dco;for(const s of snow)s.y=((s.y+dco/H)%1+1)%1}
 const yOf=d=>dyp+40+(d-depth)*(H/900)+co;
 const top=col(Math.max(0,depth-160)),bot=col(depth+750);
 const g=cx.createLinearGradient(0,0,0,H);g.addColorStop(0,rgb(top));g.addColorStop(1,rgb(bot));cx.fillStyle=g;cx.fillRect(0,0,W,H);
 cx.save();cx.globalCompositeOperation="lighter";
 const ra=Math.max(0,1-depth/700)*.15,r0=Math.max(0,sY);if(ra>.002&&r0<H){for(let i=0;i<7;i++){const x=W*(i/6)+Math.sin(t/3400+i*1.7)*70,w=50+(i*37)%90;const lg=cx.createLinearGradient(0,r0,0,H*.95+r0);lg.addColorStop(0,`rgba(255,255,255,${ra*(1+Math.sin(t/1800+i)*.4)})`);lg.addColorStop(1,"rgba(255,255,255,0)");cx.fillStyle=lg;cx.beginPath();cx.moveTo(x-w/2,r0);cx.lineTo(x+w/2,r0);cx.lineTo(x+w*1.7-W*.12,H);cx.lineTo(x-w*1.3-W*.12,H);cx.fill()}}
 const ca=Q>=1?Math.max(0,1-depth/260)*.1:0;if(ca>.002){cx.strokeStyle=`rgba(255,255,255,${ca})`;cx.lineWidth=2;for(let j=0;j<5;j++){cx.beginPath();for(let x=0;x<=W;x+=14){const y=vTop+H*.04+j*28+Math.sin(x/53+t/900+j)*9+Math.sin(x/21-t/700)*4-depth*(H/900)+co;x?cx.lineTo(x,y):cx.moveTo(x,y)}cx.stroke()}}
 cx.restore();
 cx.font="600 11px -apple-system,Inter,sans-serif";cx.textBaseline="middle";
 for(let m=Math.max(500,Math.floor((depth-500)/500)*500);m<depth+900;m+=500){const y=yOf(m);if(y<0||y>H)continue;cx.strokeStyle="rgba(255,255,255,.12)";cx.setLineDash([3,6]);cx.beginPath();cx.moveTo(0,y);cx.lineTo(W*.22,y);cx.stroke();cx.setLineDash([]);cx.fillStyle="rgba(255,255,255,.35)";cx.fillText(m.toLocaleString("cs-CZ")+" m",10,y-9)}
 const deep=Math.min(1,Math.max(0,(depth-600)/1800));
 const GLOWY=new Set(["jelly","siph","lantern","hatchet","eel","vampire"]);
 const vis=LIFE.map(([k,d,xf,s])=>({k,d,x:px(xf,s,t,d),y:yOf(d),dir:s<0?-1:1})).filter(c=>c.y>-260&&c.y<H+260&&c.y>sY+40);
 for(const c of vis){if(deep>.4&&GLOWY.has(c.k))continue;creature(c.k,c.x,c.y,t,c.d,depth>900,c.dir)}
 const sp=v*.9+.12,SN=Q>=2?snow.length:Q>=1?100:60;cx.fillStyle=depth>900?"rgba(200,245,255,.32)":"rgba(255,255,255,.22)";cx.beginPath();for(let i=0;i<SN;i++){const s=snow[i];s.y-=(sp*s.r*.004*s.z)+.00018*s.r;if(s.y<0){s.y=1;s.x=Math.random()}if(s.y>1)s.y=0;const x=s.x*W+Math.sin(t/2100+s.w)*6,y=s.y*H;if(y<sY+4)continue;cx.moveTo(x+s.r,y);cx.arc(x,y,s.r,0,7)}cx.fill();
 const swim=S.m==="dive"||S.m==="asc";
 const[hx,hy]=head(dxp,dyp,tilt);
 if(deep>0){dx.globalCompositeOperation="source-over";dx.clearRect(0,0,W*2,H*2);dx.fillStyle=`rgba(0,3,10,${.84*deep})`;dx.fillRect(0,0,W,H);dx.globalCompositeOperation="destination-out";
  const ang=tilt+.32+Math.sin(t/2300)*.08,len=Math.max(W,H)*.8,spr=.34;const lg=dx.createRadialGradient(hx,hy,0,hx,hy,len);lg.addColorStop(0,"rgba(0,0,0,1)");lg.addColorStop(.5,"rgba(0,0,0,.78)");lg.addColorStop(1,"rgba(0,0,0,0)");dx.fillStyle=lg;dx.beginPath();dx.moveTo(hx,hy);dx.arc(hx,hy,len,ang-spr,ang+spr);dx.closePath();dx.fill();
  const hg=dx.createRadialGradient(dxp,dyp,0,dxp,dyp,130);hg.addColorStop(0,"rgba(0,0,0,.92)");hg.addColorStop(1,"rgba(0,0,0,0)");dx.fillStyle=hg;dx.beginPath();dx.arc(dxp,dyp,130,0,7);dx.fill();
  cx.drawImage(dk,0,0,W,H);
  cx.save();cx.globalCompositeOperation="lighter";const bg2=cx.createRadialGradient(hx,hy,0,hx,hy,len*.85);bg2.addColorStop(0,`rgba(225,250,255,${.17*deep})`);bg2.addColorStop(1,"rgba(225,250,255,0)");cx.fillStyle=bg2;cx.beginPath();cx.moveTo(hx,hy);cx.arc(hx,hy,len*.85,ang-spr*.8,ang+spr*.8);cx.closePath();cx.fill();
  for(let i=0;i<14;i++){const a=ang+(((i*.37)%1)-.5)*spr*1.4,r=((t/40+i*61)%(len*.7))+30;cx.fillStyle=`rgba(255,255,255,${.35*deep*(1-r/(len*.7))})`;cx.beginPath();cx.arc(hx+Math.cos(a)*r,hy+Math.sin(a)*r,1.2,0,7);cx.fill()}cx.restore()}
 if(deep>.05){cx.save();cx.globalCompositeOperation="lighter";cx.globalAlpha=deep*.55;for(const col of["#8ff7ff","#a9ffcf"]){cx.fillStyle=col;cx.beginPath();for(const p of glow){if(p.c!==col||Math.sin(t/700+p.p)<0)continue;const x=p.x*W,y=((p.y-depth/4000)%1+1)%1*H;cx.moveTo(x+1.7,y);cx.arc(x,y,1.7,0,7)}cx.fill()}cx.restore();cx.globalAlpha=1}
 for(const c of vis){if(deep>.4&&GLOWY.has(c.k))creature(c.k,c.x,c.y,t,c.d,true,c.dir);if(c.k==="angler")lure(c.x,c.y,t,c.dir)}
 // dech: bubliny z automatiky, jen když je potápěč pod vodou
 const dv=S.dv;let mx,my;if(dv){const[a,b]=rot2(38*1.18*dv.sc,1.18*dv.sc,dv.rot);mx=dv.x+a;my=dv.y+b}else[mx,my]=mouth(dxp,dyp,tilt);
 if(t>nextBreath&&my>sY+12&&S.m!=="deck"){nextBreath=t+1500+Math.random()*900;for(let i=0;i<6;i++)bub.push({x:mx,y:my,r:Math.random()*3+1.4,vy:Math.random()*.8+1,d:i*80,w:Math.random()*6})}
 if(swim&&v>1&&bub.length<90&&Math.random()<.5)bub.push({x:dxp-40+(Math.random()-.5)*16,y:dyp,r:Math.random()*2.5+1.2,vy:Math.random()*1.2+1.4,d:0,w:Math.random()*6});
 for(let i=bub.length-1;i>=0;i--){const b=bub[i];if(b.d>0){b.d-=dt;continue}b.y-=b.vy*dt/16;b.x+=Math.sin(b.y/18+b.w)*.5;if(b.y<sY+3||b.y<-10){bub.splice(i,1);continue}cx.drawImage(BUB,b.x-b.r,b.y-b.r,b.r*2,b.r*2)}
 if(sY>-90)surfaceLayer(t,sY);
 if(dv){cx.save();cx.translate(dv.x,dv.y);cx.scale(dv.sc,dv.sc);diver(0,0,t,dv.rot,dv.P);cx.restore()}else diver(dxp,dyp,t,tilt);
 if(sY>-120)splashFx(t,dt,sY);
 if(deep>0&&swim){cx.save();cx.globalCompositeOperation="lighter";cx.fillStyle="rgba(255,250,220,.95)";cx.shadowBlur=16;cx.shadowColor="#fff6c8";cx.beginPath();cx.arc(hx,hy,2.6,0,7);cx.fill();cx.restore()}
 cx.save();cx.globalCompositeOperation="lighter";for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];s.x+=s.vx*dt/16;s.y+=s.vy*dt/16;s.vy+=.02;s.l-=dt/950;if(s.l<=0){sparks.splice(i,1);continue}cx.globalAlpha=s.l;cx.fillStyle=s.c;cx.shadowBlur=12;cx.shadowColor=s.c;cx.beginPath();cx.arc(s.x,s.y,s.r*s.l+.4,0,7);cx.fill()}cx.restore();
 cx.globalAlpha=.22*Math.min(1,Math.max(.25,(vTop-sY)/H))+deep*.3;cx.drawImage(VIG,0,0,W,H);cx.globalAlpha=1;
 const dmT=fmt(depth);if($("dm").textContent!==dmT)$("dm").textContent=dmT;$("mark").style.top=Math.min(depth/11000,1)*100+"%";
 requestAnimationFrame(draw)}
requestAnimationFrame(draw);
function burst(c,n){if(RM)return;const x=card.offsetLeft+card.offsetWidth/2,y=vTop+card.offsetTop+60;for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=Math.random()*4+1.5;sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,r:Math.random()*2.6+1,l:1,c})}}

/* ---------- hra ---------- */
let run=null,timer=null,left=25,limit=25,busy=false,lastZone="Sluneční zóna",advT=null;
const ARROW='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const LVN={1:"Lehká",2:"Střední",3:"Těžká",4:"Expert"};
const lvlFor=n=>n<=3?1:n<=7?2:n<=12?3:4;
function swap(html,after){card.classList.add("out");setTimeout(()=>{card.innerHTML=html;card.classList.remove("out","in");void card.offsetWidth;card.classList.add("in");after&&after()},170)}
function o2(effect){const n=run?run.o2:3,e=$("o2");e.innerHTML=[0,1,2].map(i=>`<i class="${i>=n?"off":""}${effect&&effect.i===i?" "+effect.c:""}"></i>`).join("");e.classList.toggle("low",n===1)}
function toast(s){const e=$("toast");e.textContent=s;e.classList.add("on");clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove("on"),2600)}
function setDepth(m,slow){ease=slow?2600:1000;if(m>target){kick=1;const d=$("dm");d.classList.add("bump");setTimeout(()=>d.classList.remove("bump"),350)}target=m;const z=zoneOf(m);if(z!==lastZone&&m>0){lastZone=z;setTimeout(()=>toast(z),1000)}}
function home(){run=null;o2();setDepth(0,true);stage.classList.remove("play");
 swap(`<h1>Krillion</h1><p class="lede">Vzácnější odpověď tě vezme hlouběji. Otázky postupně přitvrzují. Ponor končí, až dojde kyslík.</p><div class="rules"><span><i></i><i></i><i></i>&nbsp;3 bubliny</span><span>chyba = −1</span><span>Jeden z krilionu = +1</span></div><button class="btn" id="go">Ponořit se</button>${st.best?`<div class="meta"><span>Rekord <b>${fmt(st.best)}</b></span><span>Ponorů <b>${st.runs}</b></span></div>`:""}`,()=>{$("go").onclick=start})}
function nextPrompt(l){gen(l);gen(Math.min(4,l+1));
 while(aiQ[l].length&&tooSimilar(aiQ[l][0].q,st.used.slice(-400)))aiQ[l].shift(); // starší fronta od Clauda
 if(aiQ[l].length&&Math.random()<.55){const i=Math.max(0,aiQ[l].findIndex(p=>!run.fams.has("dom:"+p.d)));const p=aiQ[l].splice(i,1)[0];run.asked.add(p.q);run.fams.add("dom:"+p.d);run.lastKind="ai";st.used.push(p.q);save();return{q:p.q,ai:true}}
 const pick=pickTopic(st,run,l);save();return{q:pick.q,ai:false}}
function start(){run={o2:3,pts:0,n:0,ans:[],best:null,asked:new Set(),fams:new Set()};lastZone="Sluneční zóna";target=0;o2();
 // poloha lodi a hladiny se změří ještě s úvodní kartou, pak se karta přepne do herního rozložení
 const done=()=>{document.removeEventListener("pointerdown",skip,true);stage.classList.remove("intro");card.classList.remove("in");void card.offsetWidth;card.classList.add("in");ask()};
 if(RM){S.m="dive";S.co=0;S.dv=null;depth=0}else{beginRoll(done);stage.classList.add("intro")}
 stage.classList.add("play");card.classList.remove("out","in");
 card.innerHTML=`<div class="prog" id="prog"><i id="bar"></i></div><div class="panel" id="pn"></div>
 <form class="glass field" id="f" autocomplete="off"><input id="a" placeholder="Tvoje odpověď" aria-label="Odpověď" enterkeyhint="send" autocapitalize="sentences" autocorrect="off" spellcheck="false"><button class="go" id="sb" aria-label="Odeslat">${ARROW}</button></form>
 <div class="hint" id="h"></div><button class="skip" id="sk" type="button">Přeskočit</button>`;
 void card.offsetWidth;card.classList.add("in");
 $("f").onsubmit=e=>{e.preventDefault();if(advT){advance();return}submit()};$("sk").onclick=()=>{if(!busy)lose("Přeskočeno",null)};
 $("a").addEventListener("input",e=>{if(advT)e.target.value=""});
 gen(1);gen(2);
 // iOS otevře klávesnici jen při fokusu v rámci tapnutí → fokus hned teď, karta je zatím neviditelná
 const a=$("a");try{a.focus({preventScroll:true})}catch(e){}
 if(RM){ask();return}
 // tapnutí během seskoku ho zrychlí (doběhne plynule za zlomek sekundy), fokus inputu zůstane
 function skip(e){if(e.target&&e.target.closest&&e.target.closest("#f"))return;e.preventDefault();try{a.focus({preventScroll:true})}catch(_){}S.sp=6}
 document.addEventListener("pointerdown",skip,true)}
function ask(){busy=false;advT=null;run.n++;run.lvl=lvlFor(run.n);const p=nextPrompt(run.lvl);run.q=p.q;run.ai=p.ai;
 limit=run.n>16?Math.max(10,15-(run.n-16)*.5):({1:25,2:21,3:18,4:15})[run.lvl];left=limit;
 const pn=$("pn");pn.className="panel";pn.onclick=null;pn.innerHTML=`<div style="animation:fade .45s both"><div class="qn">#${run.n} · ${LVN[run.lvl]}</div>${(()=>{const m=run.q.match(/^(.*) \((na písmeno .+|aspoň \d+ písmen)\)$/);return m?`<div class="q">${esc(m[1])}</div><div class="tag">${esc(m[2])}</div>`:`<div class="q">${esc(run.q)}</div>`})()}</div>`;
 if(run.n===4||run.n===8||run.n===13)toast(`Obtížnost: ${LVN[run.lvl]} · ×${MULT[run.lvl]} hloubky`);
 const a=$("a");a.value="";$("f").classList.remove("dim");$("sb").innerHTML=ARROW;$("h").textContent="";$("sk").style.visibility="";
 try{a.focus({preventScroll:true})}catch(e){}
 clearInterval(timer);timer=setInterval(()=>{const b=$("bar");if(!b)return;$("prog").classList.toggle("pause",busy);if(busy)return;left-=.1;b.style.transform=`scaleX(${Math.max(left/limit,0)})`;$("prog").classList.toggle("low",left<6);if(left<=0){clearInterval(timer);$("a").value.trim()?submit():lose("Došel čas",null)}},100)}
async function submit(){const a=$("a");if(!a||busy)return;const v=a.value.trim();if(!v){a.focus();return}
 busy=true;$("sb").innerHTML='<span class="spin"></span>';
 const q=run.q;let r=run.ai?null:localJudge(q,v);
 if((!r||!r.valid)&&sample){try{const ar=await aiJudge(q,v);if(ar.valid||!r)r=ar;else if(r&&!r.top?.length)r.top=ar.top}catch(e){if(!aiWarned){aiWarned=true;toast(aiErr==="not_granted"?"Claude není povolený · záložní režim":aiErr==="rate_limited"?"Limit Clauda vyčerpán · záložní režim":"Claude neodpovídá · záložní režim")}}}
 if(run.ai&&(!r||!r.valid)&&!/\(| v | ve | z | ze | na | od | do |\d/.test(" "+q+" ")){const lr=looseLocal(q,v);if(lr)r=lr}
 if(!r){showRes(`<div class="tier" style="color:#d4e4ff">Bez hodnocení</div><div class="sub">Tohle zadání se nepodařilo ověřit · kyslík ti zůstává</div>`);return}
 if(r.valid)win(r);else lose(r.reason||"Tohle neplatí",r)}
function showRes(html){clearInterval(timer);busy=true;const pn=$("pn");pn.className="panel res";pn.innerHTML=`<div>${html}</div>`;pn.onclick=advance;
 $("f").classList.add("dim");$("sb").innerHTML=ARROW;$("sk").style.visibility="hidden";$("h").textContent="";
 clearTimeout(advT);advT=setTimeout(advance,run.o2>0?2300:2700)}
function win(r){const T=TIERS[r.tier],m=Math.round(T.p*MULT[run.lvl]);run.pts+=m;run.ans.push(r.tier+1);if(!run.best||r.tier>run.best.t||(r.tier===run.best.t&&run.lvl>run.best.l))run.best={t:r.tier,a:r.name,l:run.lvl};
 setDepth(run.pts*10);burst(T.c,12+r.tier*10);
 let extra="";if(r.tier===4&&run.o2<3){run.o2++;o2({i:run.o2-1,c:"gain"});extra=" · <b>+1 kyslík</b>"}
 showRes(`<div class="tier" style="color:${T.c};text-shadow:0 0 34px ${T.c}88">${T.n}</div><div class="sub"><b>${esc(r.name)}</b> · vzácnost ${r.tier+1}/5 · +${fmt(m*10)}${extra}</div><div class="ladder">${TIERS.map((x,i)=>`<i class="${i<=r.tier?"on":""}" style="color:${T.c};--i:${i}"></i>`).join("")}</div>`)}
function lose(why,r){clearInterval(timer);run.o2--;run.ans.push(0);o2({i:run.o2,c:"pop"});hurt=1;
 const f=$("flash");f.classList.add("on");setTimeout(()=>f.classList.remove("on"),60);const fe=$("f");fe.classList.remove("shake");void fe.offsetWidth;fe.classList.add("shake");try{navigator.vibrate&&navigator.vibrate(60)}catch(e){}
 const ex=r&&r.top&&r.top.length?r.top:(localJudge(run.q,"")||{}).top;
 showRes(`<div class="tier" style="color:#ffb0a5;text-shadow:0 0 30px #ff7a6a77">−1 kyslík</div><div class="sub">${esc(why)}${ex&&ex.length?` · platilo by třeba <b>${ex.map(esc).join(", ")}</b>`:""}</div>`)}
function advance(){if(!advT)return;clearTimeout(advT);advT=null;if(run.o2<=0)end();else ask()}
function end(){clearInterval(timer);const a=$("a");a&&a.blur();stage.classList.remove("play");const m=run.pts*10,rec=m>st.best;if(rec)st.best=m;st.runs++;save();
 const z=zoneOf(m),T=run.best?TIERS[run.best.t]:null;
 swap(`<div class="end"><div class="qn">Došel kyslík</div><div class="big">${fmt(m)}</div><div class="zone">${esc(z)}${rec&&m>0?" · nový rekord":""}</div>
 <div class="tcap">Vzácnost odpovědí (1 = běžná, 5 = nejvzácnější, ✕ = chyba)</div><div class="chips">${run.ans.map((v,i)=>`<span style="--i:${i};${v?`color:${TIERS[v-1].c};box-shadow:inset 0 0 0 1px ${TIERS[v-1].c}66`:"color:rgba(255,255,255,.35)"}">${v||"✕"}</span>`).join("")}</div>
 ${(()=>{const ok=run.ans.filter(v=>v);return ok.length?`<div class="avg">Průměrná vzácnost <b>${(ok.reduce((a,b)=>a+b,0)/ok.length).toLocaleString("cs-CZ",{maximumFractionDigits:1,minimumFractionDigits:1})} / 5</b></div>`:""})()}
 <div class="meta"><span>Otázek <b>${run.n}</b></span>${T?`<span>Nejvzácnější <b style="color:${T.c}">${esc(run.best.a)}</b></span>`:""}<span>Rekord <b>${fmt(st.best)}</b></span></div>
 <div class="row"><button class="btn" id="nx">Ponořit se znovu</button><button class="btn g" id="cp">Sdílet</button></div></div>`,()=>{
  if(rec&&m>0)burst("#ffd36e",70);
  $("nx").onclick=start;
  $("cp").onclick=async()=>{const sq=["⬛","🟩","🟧","🟦","🟪","🟨"];const txt=`Krillion · ${fmt(m)} · ${z}\n${run.ans.map(v=>sq[v]).join("")}`;try{await navigator.clipboard.writeText(txt);toast("Zkopírováno")}catch(e){toast("Kopírování nejde")}}});
 const r0=run;setTimeout(()=>{if(run===r0&&S.m==="dive")beginAscent()},700);run.o2=0}
o2();home();
}
