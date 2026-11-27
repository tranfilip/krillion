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
let NAMES=null;const isName=t=>{if(!NAMES){const b=BASE.find(x=>x.q==="Jmenuj české křestní jméno");NAMES=new Set(b?b.list.flatMap(e=>e.keys):[])}return NAMES.has(t)};
function part(n,v,qt){const nt=n.split(" "),vt=v.split(" ");if(vt.length<2||nt.length>=vt.length||nt.some(t=>t.length<4))return 0;
 const used=new Set();for(const t of nt){const j=vt.findIndex((x,j)=>!used.has(j)&&close(t,x));if(j<0)return 0;used.add(j)}
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
 if(it.kind!=="min"){const qt=norm(it.fam).split(" ").filter(w=>w.length>=3),hit=[new Map(),new Map()];
  for(let i=0;i<it.list.length;i++)for(let k=0;k<it.list[i].keys.length;k++){const r=part(n,it.list[i].keys[k],qt);if(r&&!hit[r-1].has(i))hit[r-1].set(i,k)}
  for(const h of hit)if(h.size){if(h.size>1)break;const[[i,k]]=h;const e=it.list[i],j=e.keys[0].includes(" ")?0:k;return{valid:true,name:e.vars[j],tier:tierAt(i,it.list.length),top}}}
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
const LV={1:"1 = úplně otevřené a snadné, stovky správných odpovědí (např. 'Jmenuj jakékoli zvíře', 'Jmenuj kus oblečení')",2:"2 = střední, zhruba 50–200 odpovědí (např. 'Jmenuj psí plemeno', 'Jmenuj asijský stát')",3:"3 = užší, uzavřená množina zhruba 10–60 odpovědí (např. 'Jmenuj klub anglické Premier League (i bývalý)', 'Jmenuj kraj ČR')",4:"4 = úzká a těžká množina 5–40 odpovědí, vyžaduje znalosti (např. 'Jmenuj vzácný plyn', 'Jmenuj stát, kterým protéká Dunaj')"};
const DOMAINS=["zvířata","jídlo a vaření","sport obecně","filmy","seriály","hudba","zeměpis světa","česká kultura a tradice","světová historie","česká historie","věda a vynálezy","vesmír a astronomie","lidské tělo a medicína","móda a oblékání","kosmetika a péče","auta a motorismus","doprava a cestování","počítače a internet","videohry","deskové a společenské hry","umění a malíři","architektura a stavby","knihy a spisovatelé","pohádky a dětství","mytologie","náboženství a bible","značky a firmy","domácnost a bydlení","škola a vzdělání","práce a povolání","zahrada a rostliny","počasí a přírodní jevy","jazyky a slova","svátky a oslavy","Praha","nápoje a koktejly","sladkosti a dezerty","emoce a vlastnosti","matematika","fyzika a chemie","oceán a mořský život","hmyz","ptáci","domácí mazlíčci","farma a zemědělství","letectví","lodě a námořnictví","hory a turistika","zimní sporty","olympijské hry","fotbal","hokej","tenis","Formule 1 a závody","superhrdinové a komiksy","animované filmy","fantasy a sci-fi","celebrity a influenceři","sociální sítě a aplikace","peníze a ekonomika","státy a vlajky","města světa","řeky, jezera a moře","ostrovy a pláže","hudební nástroje","tanec a divadlo","fotografie a film","řemesla a nářadí","kuchyně a nádobí","nábytek a interiér","nemocnice a zdravotnictví","pravěk a dinosauři","starověk","středověk a rytíři","energie a elektřina","památky světa","Japonsko","Itálie","USA","Francie","Velká Británie","Německo a Rakousko","Slovensko","Asie","Afrika","Latinská Amerika","rap a hip-hop","pop a světové hvězdy","rock a metal","klasická hudba","televize a reality show","kriminalistika a detektivky","armáda a válka","vojenská technika","kempování a příroda","rybaření a myslivost","zdraví a fitness","jóga a wellness","káva a čaj","pečivo a pekárna","sýry a mléčné výrobky","koření a byliny","ovoce a zelenina","maso a uzeniny","fast food","street food","pivo a víno","chytrá elektronika","telefony a gadgety","programování","umělá inteligence","kryptoměny a finance","obchody a nakupování","hotely a cestovní ruch","letiště a aerolinky","vlaky a železnice","metro a MHD","kolo a cyklistika","běh a atletika","bojové sporty","vodní sporty","golf a tenis","šachy a hlavolamy","karetní hry","magie a kouzelníci","duchové a záhady","vesmírné mise","geologie a horniny","drahé kameny a šperky","barvy a tvary","čas a kalendář","rodina a vztahy","jména a přezdívky","slang a hovorová čeština","přísloví a frázy","hudební festivaly","muzea a galerie","zámky a hrady"];
const aiQ=st.aiQ,genBusy={};
function pickDomains(n){const recent=new Set(st.dom.slice(-50));const pool=DOMAINS.filter(d=>!recent.has(d));const src=pool.length>=n?pool:DOMAINS;const out=[];while(out.length<n){const d=src[Math.floor(Math.random()*src.length)];if(!out.includes(d))out.push(d)}return out}
async function gen(l){if(!sample||genBusy[l]||aiQ[l].length>=4)return;genBusy[l]=true;const doms=pickDomains(6);
 try{const r=await askAI(`Vymýšlíš zadání pro českou trivia hru Krillion. Hráč na zadání napíše JEDNU odpověď a body dostane podle toho, jak vzácná (a přitom správná) je.
Vymysli přesně 6 zadání, každé z JINÉHO oboru, v tomto pořadí oborů: ${doms.map((d,i)=>(i+1)+") "+d).join(", ")}.
Obtížnost: ${LV[l]}.
Pravidla: zadání musí být jednoznačné a vždy upřesnit rozsah (např. "(i bývalého)", "kdekoli na světě", "v Česku"); nikdy se neptej na jednu konkrétní věc (žádné "současný", "první", "nejvyšší"); musí existovat aspoň 15 správných odpovědí, u snadných stovky; max 10 slov; začni slovem "Jmenuj"; buď kreativní a nepoužívej otřepaná témata (ovoce, zvíře, barva, hlavní město), pokud obor přímo nevyžaduje.
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
function diver(x,y,t,tilt){const sp=230-kick*90,k=Math.sin(t/sp)*(1+kick*.7),k2=Math.sin(t/sp+Math.PI)*(1+kick*.7);
 cx.save();cx.translate(x,y);cx.rotate(tilt);cx.scale(1.18,1.18);
 const suit="#121a24",suit2="#2a3b50",rim="rgba(190,240,255,.55)",acc="#ff8a6b",acc2="#ffb08f";
 // zadní noha + ploutev
 for(const[o,kk,sh]of[[3,k2,.75],[-3,k,1]]){const hipX=-17,hipY=o+1,footX=-50,footY=o+2+kk*7;const[kx,ky]=limb(hipX,hipY,footX,footY,kk*3+2,8.5,sh<1?"#0d141c":suit);
  cx.save();cx.translate(footX,footY);cx.rotate(Math.atan2(footY-ky,footX-kx)+Math.PI+kk*.35);const fg=cx.createLinearGradient(-30,0,0,0);fg.addColorStop(0,sh<1?"rgba(200,95,75,.75)":"rgba(255,140,110,.8)");fg.addColorStop(1,sh<1?"#c8644e":acc);cx.fillStyle=fg;cx.beginPath();cx.moveTo(2,-3.5);cx.quadraticCurveTo(-14,-11,-34,-10);cx.quadraticCurveTo(-28,0,-34,10);cx.quadraticCurveTo(-14,11,2,3.5);cx.fill();cx.strokeStyle="rgba(255,255,255,.25)";cx.lineWidth=.8;cx.beginPath();cx.moveTo(-4,-1);cx.lineTo(-30,-3);cx.moveTo(-4,1);cx.lineTo(-30,3);cx.stroke();cx.restore()}
 // láhev
 const tg=cx.createLinearGradient(0,-24,0,-10);tg.addColorStop(0,"#fff4c8");tg.addColorStop(.35,"#f4cb55");tg.addColorStop(1,"#a97a14");cx.fillStyle=tg;cx.beginPath();cx.roundRect(-22,-23,40,11,5.5);cx.fill();cx.fillStyle="rgba(0,0,0,.25)";cx.fillRect(-12,-23,2,11);cx.fillRect(6,-23,2,11);cx.fillStyle="#3b3f45";cx.beginPath();cx.roundRect(17,-21,6,7,2);cx.fill();cx.fillStyle="#d9dee3";cx.beginPath();cx.arc(24,-17.5,2.2,0,7);cx.fill();
 // trup
 const bg=cx.createLinearGradient(0,-13,0,11);bg.addColorStop(0,suit2);bg.addColorStop(.5,suit);bg.addColorStop(1,"#0a0f15");cx.fillStyle=bg;cx.beginPath();cx.moveTo(20,-9);cx.quadraticCurveTo(4,-14,-18,-8);cx.quadraticCurveTo(-24,0,-18,7);cx.quadraticCurveTo(4,12,20,7);cx.quadraticCurveTo(26,-1,20,-9);cx.fill();
 // vesta BCD
 const vg=cx.createLinearGradient(0,-12,0,10);vg.addColorStop(0,"#3c5470");vg.addColorStop(1,"#1d2b3c");cx.fillStyle=vg;cx.beginPath();cx.moveTo(18,-9);cx.quadraticCurveTo(6,-12,-6,-10);cx.lineTo(-8,6);cx.quadraticCurveTo(6,10,18,6);cx.closePath();cx.fill();cx.fillStyle=acc;cx.fillRect(-6,-3,24,2.4);cx.fillStyle="#9aa4ad";cx.beginPath();cx.roundRect(-14,4,6,5,1.2);cx.fill();cx.fillStyle="#2b2f34";cx.fillRect(-18,3,30,2.2);
 // hadice
 cx.strokeStyle="#1b1f24";cx.lineWidth=2;cx.beginPath();cx.moveTo(22,-16);cx.bezierCurveTo(30,-18,36,-8,37,0);cx.stroke();cx.strokeStyle="#ffcc4d";cx.lineWidth=1.6;cx.beginPath();cx.moveTo(20,-14);cx.bezierCurveTo(14,4,22,12,26,10);cx.stroke();
 // zadní paže
 const ax=Math.sin(t/900)*2;limb(14,-2,30,10+ax,-3,5.5,"#0d141c");cx.fillStyle="#0d141c";cx.beginPath();cx.arc(30,10+ax,3,0,7);cx.fill();
 // hlava
 const hg=cx.createRadialGradient(28,-9,1,30,-6,10);hg.addColorStop(0,suit2);hg.addColorStop(1,suit);cx.fillStyle=hg;cx.beginPath();cx.arc(30,-6,9,0,7);cx.fill();cx.strokeStyle="#0a0e13";cx.lineWidth=1.4;cx.beginPath();cx.arc(30,-6,8,-2.2,-.6);cx.stroke();
 const mg=cx.createLinearGradient(32,-13,41,-3);mg.addColorStop(0,"#e5fdff");mg.addColorStop(.35,"#6fd8ef");mg.addColorStop(1,"#155d80");cx.fillStyle="#111";cx.beginPath();cx.roundRect(31,-13.5,11,10,3.5);cx.fill();cx.fillStyle=mg;cx.beginPath();cx.roundRect(32.3,-12.3,8.6,7.6,2.6);cx.fill();cx.fillStyle="rgba(255,255,255,.85)";cx.beginPath();cx.moveTo(33.4,-11.4);cx.lineTo(36,-11.4);cx.lineTo(34,-7);cx.lineTo(33.4,-7);cx.fill();
 cx.fillStyle="#2d3238";cx.beginPath();cx.arc(37.5,1,3.2,0,7);cx.fill();cx.fillStyle="#ffcc4d";cx.fillRect(36.2,-.4,2.6,1.2);
 cx.fillStyle="#1d2228";cx.beginPath();cx.roundRect(25,-16.5,7,4.5,1.5);cx.fill();cx.fillStyle="#fff8d8";cx.beginPath();cx.arc(31.6,-14.3,1.6,0,7);cx.fill();
 // přední paže
 const reach=Math.sin(t/1100)*3;const[ekx,eky]=limb(12,0,36,14+reach,4,6,suit);cx.fillStyle="#0b0f14";cx.beginPath();cx.ellipse(37.5,14.5+reach,3.6,2.8,.4,0,7);cx.fill();
 cx.fillStyle="#d7e3ea";cx.beginPath();cx.roundRect(31,11+reach,4,3.4,1);cx.fill();
 // okrajové světlo
 cx.strokeStyle=rim;cx.lineWidth=1;cx.beginPath();cx.moveTo(-18,-8.4);cx.quadraticCurveTo(4,-14.4,20,-9.4);cx.stroke();cx.beginPath();cx.arc(30,-6,9,-2.6,-1.4);cx.stroke();
 cx.restore()}
function head(x,y,tilt){const c=Math.cos(tilt),s=Math.sin(tilt),lx=31.6*1.18,ly=-14.3*1.18;return[x+c*lx-s*ly,y+s*lx+c*ly]}
function mouth(x,y,tilt){const c=Math.cos(tilt),s=Math.sin(tilt),lx=38*1.18,ly=1*1.18;return[x+c*lx-s*ly,y+s*lx+c*ly]}
/* ---------- úvod: potápěč se z lodi zády převalí do vody (back roll), kamera sjede pod hladinu ---------- */
const INTRO=2600,ROLL0=420,ROLL1=1150,CAM0=1200,CAM1=2450;
let intro=null;const drops=[];
const eIO=x=>x<=0?0:x>=1?1:x<.5?2*x*x:1-(-2*x+2)**2/2,eIn=x=>x<=0?0:x>=1?1:x*x;
// cachované gradienty (v lokálních souřadnicích, kreslí se přes translate)
let SKY=null,SKYK="";function skyG(h){const k=h|0;if(SKYK!==k){SKYK=k;SKY=cx.createLinearGradient(0,-h,0,0);SKY.addColorStop(0,"#5fc3e6");SKY.addColorStop(.55,"#a9e3f3");SKY.addColorStop(.78,"#e6f8fb");SKY.addColorStop(.8,"#4fb2d6");SKY.addColorStop(1,"#2591c2")}return SKY}
let BG=null,BGL=0;function boatG(L){if(BGL===L)return BG;BGL=L;const H1=L*.16,g=(a,b,c)=>{const x=cx.createLinearGradient(0,a,0,b);for(const[o,col]of c)x.addColorStop(o,col);return x};
 BG={hull:g(-H1,L*.07,[[0,"#f4fbff"],[.45,"#d6e6ef"],[.62,"#1c3550"],[1,"#0e1f33"]]),cab:g(-H1-L*.17,-H1,[[0,"#ffffff"],[1,"#cfdde6"]]),win:g(-H1-L*.15,-H1-L*.06,[[0,"#e5fdff"],[.4,"#6fd8ef"],[1,"#155d80"]]),
  under:g(0,L*.08,[[0,"rgba(20,120,170,.55)"],[1,"rgba(10,70,120,.75)"]])};return BG}
function boat(x,y,L,t){const H1=L*.16,G=boatG(L),r=Math.sin(t/760)*.025;cx.save();cx.translate(x,y);cx.rotate(r);
 // konzole s předním sklem, stožár s vlajkou „potápěč pod vodou“
 cx.fillStyle=G.cab;cx.beginPath();cx.moveTo(-L*.02,-H1);cx.lineTo(L*.03,-H1-L*.17);cx.lineTo(L*.2,-H1-L*.17);cx.lineTo(L*.27,-H1);cx.closePath();cx.fill();
 cx.fillStyle=G.win;cx.beginPath();cx.moveTo(L*.045,-H1-L*.15);cx.lineTo(L*.19,-H1-L*.15);cx.lineTo(L*.23,-H1-L*.06);cx.lineTo(L*.025,-H1-L*.06);cx.closePath();cx.fill();
 cx.fillStyle="rgba(255,255,255,.8)";cx.beginPath();cx.moveTo(L*.06,-H1-L*.145);cx.lineTo(L*.09,-H1-L*.145);cx.lineTo(L*.06,-H1-L*.07);cx.fill();
 cx.strokeStyle="#3b4a58";cx.lineWidth=2;cx.beginPath();cx.moveTo(L*.12,-H1-L*.17);cx.lineTo(L*.12,-H1-L*.36);cx.stroke();
 const fw=Math.sin(t/260)*2;cx.fillStyle="#e8402f";cx.beginPath();cx.moveTo(L*.12,-H1-L*.36);cx.lineTo(L*.24,-H1-L*.355+fw);cx.lineTo(L*.24,-H1-L*.275+fw);cx.lineTo(L*.12,-H1-L*.28);cx.closePath();cx.fill();
 cx.strokeStyle="#fff";cx.lineWidth=2.6;cx.beginPath();cx.moveTo(L*.125,-H1-L*.352);cx.lineTo(L*.235,-H1-L*.283+fw);cx.stroke();
 // náhradní láhev v lodi
 cx.fillStyle="#f4cb55";cx.beginPath();cx.roundRect(-L*.2,-H1-L*.1,L*.045,L*.11,L*.02);cx.fill();cx.fillStyle="#3b3f45";cx.fillRect(-L*.188,-H1-L*.12,L*.02,L*.025);
 // trup: bílý nahoře, tmavé dno, oranžový pruh
 const hull=()=>{cx.beginPath();cx.moveTo(-L*.5,-H1);cx.lineTo(L*.36,-H1);cx.quadraticCurveTo(L*.5,-H1-L*.02,L*.53,-H1-L*.05);cx.quadraticCurveTo(L*.44,L*.02,L*.3,L*.07);cx.lineTo(-L*.46,L*.07);cx.quadraticCurveTo(-L*.5,L*.03,-L*.5,-H1)};
 cx.fillStyle=G.hull;hull();cx.fill();
 cx.fillStyle="#ff8a6b";cx.beginPath();cx.moveTo(-L*.5,-H1*.5);cx.lineTo(L*.47,-H1*.62);cx.lineTo(L*.45,-H1*.44);cx.lineTo(-L*.5,-H1*.32);cx.closePath();cx.fill();
 cx.fillStyle="#2a3b50";cx.fillRect(-L*.5,-H1-2,L*.87,3);
 cx.strokeStyle="rgba(190,205,215,.9)";cx.lineWidth=1.6;cx.beginPath();cx.moveTo(-L*.42,-H1);cx.lineTo(-L*.42,-H1-L*.07);cx.lineTo(L*.34,-H1-L*.07);cx.lineTo(L*.34,-H1);cx.stroke();
 // ponořená část trupu je vidět pod hladinou přes vodu
 cx.save();cx.beginPath();cx.rect(-L,0,L*2,L*.2);cx.clip();cx.fillStyle=G.under;hull();cx.fill();cx.restore();
 cx.restore()}
function startIntro(done){intro={t0:performance.now(),done,splash:false,ex:0,ey:0};drops.length=0}
function endIntro(){if(!intro)return;const d=intro.done;intro=null;drops.length=0;d&&d()}
function introFrame(t,dxp,dyp,tilt){const e=t-intro.t0;if(e>=INTRO){endIntro();return null}
 const s0=vTop+vH*.47,sEnd=vTop-vH*.3,sY=s0+(sEnd-s0)*eIO((e-CAM0)/(CAM1-CAM0))+Math.sin(t/700)*2;
 const L=Math.min(W*.62,300),bx=W*.56,by=sY-L*.012;
 // nebe a vzdálená hladina nad čarou vody
 if(sY>0){cx.save();cx.translate(0,sY);cx.fillStyle=skyG(vH*.75);cx.fillRect(0,-sY-2,W,sY+2);cx.fillStyle="rgba(255,255,255,.75)";
  for(let i=0;i<3;i++){const cxp=((i*.37+t/90000)%1)*W*1.3-W*.15,cyp=-vH*(.6-i*.09);cx.beginPath();cx.ellipse(cxp,cyp,46+i*14,10+i*3,0,0,7);cx.ellipse(cxp+30,cyp-6,26,9,0,0,7);cx.fill()}
  cx.restore()}
 // potápěč: sedí na okraji, zády se převalí do vody, pod vodou doplave na své místo
 const G0x=bx-L*.44,G0y=by-L*.16,sc0=.62;let px,py,rot,sc;
 if(e<ROLL1){const p=eIn((e-ROLL0)/(ROLL1-ROLL0)),lean=e<ROLL0?Math.sin(e/120)*.04:0;
  rot=-Math.PI/2-p*Math.PI-lean;sc=sc0;px=G0x-p*L*.16;py=G0y-20*sc0+p*(sY+30-(G0y-20*sc0));
  if(!intro.splash&&py>sY-6){intro.splash=true;intro.ex=px;intro.ey=py-sY;
   for(let i=0;i<(MOBILE?22:34);i++){const a=-Math.PI/2+(Math.random()-.5)*1.7,v=Math.random()*4.5+2.5;drops.push({x:px+(Math.random()-.5)*18,y:-2,vx:Math.cos(a)*v,vy:Math.sin(a)*v,r:Math.random()*2.4+1,l:1})}
   for(let i=0;i<(MOBILE?24:40);i++)bub.push({x:px+(Math.random()-.5)*40,y:sY+10+Math.random()*50,r:Math.random()*4+1.5,vy:Math.random()*1.4+.8,d:Math.random()*400,w:Math.random()*6})}}
 else{const q=eIO((e-ROLL1)/(INTRO-ROLL1-80));const x1=intro.ex||G0x-L*.2,y1=sY+(intro.ey||28);
  rot=-Math.PI*1.5+q*(-Math.PI*.5+tilt);sc=sc0+(1-sc0)*q;px=x1+(dxp-x1)*q;py=y1+(dyp-y1)*q}
 // kapky nad hladinou a pěna kolem místa dopadu
 for(let i=drops.length-1;i>=0;i--){const d=drops[i];d.x+=d.vx;d.y+=d.vy;d.vy+=.32;if(d.y>0&&d.vy>0){drops.splice(i,1);continue}}
 if(drops.length){cx.fillStyle="rgba(245,253,255,.95)";cx.beginPath();for(const d of drops){const y=sY+d.y;cx.moveTo(d.x+d.r,y);cx.arc(d.x,y,d.r,0,7)}cx.fill()}
 if(intro.splash){const k=Math.min(1,(e-ROLL1+120)/700);if(k<1){cx.strokeStyle=`rgba(255,255,255,${.85*(1-k)})`;cx.lineWidth=3*(1-k)+1;cx.beginPath();cx.ellipse(intro.ex,sY,14+k*70,3+k*8,0,0,7);cx.stroke()}}
 // čára hladiny (vlnky) a světlý pás těsně pod ní
 if(sY>-20&&sY<H+20){cx.fillStyle="rgba(255,255,255,.18)";cx.fillRect(0,sY,W,18);cx.strokeStyle="rgba(255,255,255,.85)";cx.lineWidth=2;cx.beginPath();for(let x=0;x<=W;x+=12){const y=sY+Math.sin(x/30+t/300)*2.2+Math.sin(x/11-t/210)*1;x?cx.lineTo(x,y):cx.moveTo(x,y)}cx.stroke()}
 const seated=e<ROLL0+90; // dokud sedí, nohy jsou v lodi (za trupem); při převalu přepadnou přes okraj
 if(!seated)boat(bx,by,L,t);
 cx.save();cx.translate(px,py);cx.scale(sc,sc);diver(0,0,t,rot);cx.restore();
 if(seated)boat(bx,by,L,t);
 return sY}
function draw(t){const dt=Math.min(t-lastT,50)||16;lastT=t;frameAvg=frameAvg*.95+dt*.05;
 if(t>8000&&frameAvg>24&&Q>0&&!draw.cool){Q--;SBK=0;draw.cool=1;setTimeout(()=>draw.cool=0,3000);rs()}
 const prev=depth;depth+=(target-depth)*(RM?1:Math.min(1,dt/ease));const v=depth-prev;
 kick=Math.max(0,kick-dt/1400);hurt=Math.max(0,hurt-dt/700);
 // potápěč v prostoru mezi HUD a kartou
 const freeTop=vTop+66,freeBot=vTop+Math.max(card.offsetTop,140);const playing=stage.classList.contains("play");const want=playing?Math.min(vTop+card.offsetTop+card.offsetHeight+95,H-70):Math.max(freeTop+40,Math.min(freeTop+(freeBot-freeTop)*.42,vTop+230));dyS+=(want-dyS)*Math.min(1,dt/350);
 const dxp=W*.5+Math.sin(t/3100)*W*.04,dyp=dyS+Math.sin(t/900)*6+hurt*Math.sin(t/30)*4;
 const yOf=d=>dyp+40+(d-depth)*(H/900);
 const top=col(Math.max(0,depth-160)),bot=col(depth+750);
 const g=cx.createLinearGradient(0,0,0,H);g.addColorStop(0,rgb(top));g.addColorStop(1,rgb(bot));cx.fillStyle=g;cx.fillRect(0,0,W,H);
 cx.save();cx.globalCompositeOperation="lighter";
 const ra=Math.max(0,1-depth/700)*.15;if(ra>.002){for(let i=0;i<7;i++){const x=W*(i/6)+Math.sin(t/3400+i*1.7)*70,w=50+(i*37)%90;const lg=cx.createLinearGradient(0,0,0,H*.95);lg.addColorStop(0,`rgba(255,255,255,${ra*(1+Math.sin(t/1800+i)*.4)})`);lg.addColorStop(1,"rgba(255,255,255,0)");cx.fillStyle=lg;cx.beginPath();cx.moveTo(x-w/2,0);cx.lineTo(x+w/2,0);cx.lineTo(x+w*1.7-W*.12,H);cx.lineTo(x-w*1.3-W*.12,H);cx.fill()}}
 const ca=Q>=1?Math.max(0,1-depth/260)*.1:0;if(ca>.002){cx.strokeStyle=`rgba(255,255,255,${ca})`;cx.lineWidth=2;for(let j=0;j<5;j++){cx.beginPath();for(let x=0;x<=W;x+=14){const y=vTop+H*.04+j*28+Math.sin(x/53+t/900+j)*9+Math.sin(x/21-t/700)*4-depth*(H/900);x?cx.lineTo(x,y):cx.moveTo(x,y)}cx.stroke()}}
 cx.restore();
 const sy=yOf(0)-H*.32;if(sy>-50){const sg=cx.createLinearGradient(0,0,0,sy+8);sg.addColorStop(0,"rgba(255,255,255,.34)");sg.addColorStop(1,"rgba(255,255,255,.08)");cx.fillStyle=sg;cx.beginPath();cx.moveTo(0,0);for(let x=0;x<=W;x+=16)cx.lineTo(x,sy+Math.sin(x/38+t/620)*4+Math.sin(x/90-t/900)*3);cx.lineTo(W,0);cx.fill()}
 cx.font="600 11px -apple-system,Inter,sans-serif";cx.textBaseline="middle";
 for(let m=Math.max(500,Math.floor((depth-500)/500)*500);m<depth+900;m+=500){const y=yOf(m);if(y<0||y>H)continue;cx.strokeStyle="rgba(255,255,255,.12)";cx.setLineDash([3,6]);cx.beginPath();cx.moveTo(0,y);cx.lineTo(W*.22,y);cx.stroke();cx.setLineDash([]);cx.fillStyle="rgba(255,255,255,.35)";cx.fillText(m.toLocaleString("cs-CZ")+" m",10,y-9)}
 const deep=Math.min(1,Math.max(0,(depth-600)/1800));
 const GLOWY=new Set(["jelly","siph","lantern","hatchet","eel","vampire"]);
 const vis=LIFE.map(([k,d,xf,s])=>({k,d,x:px(xf,s,t,d),y:yOf(d),dir:s<0?-1:1})).filter(c=>c.y>-260&&c.y<H+260);
 for(const c of vis){if(deep>.4&&GLOWY.has(c.k))continue;creature(c.k,c.x,c.y,t,c.d,depth>900,c.dir)}
 const sp=v*.9+.12,SN=Q>=2?snow.length:Q>=1?100:60;cx.fillStyle=depth>900?"rgba(200,245,255,.32)":"rgba(255,255,255,.22)";cx.beginPath();for(let i=0;i<SN;i++){const s=snow[i];s.y-=(sp*s.r*.004*s.z)+.00018*s.r;if(s.y<0){s.y=1;s.x=Math.random()}if(s.y>1)s.y=0;const x=s.x*W+Math.sin(t/2100+s.w)*6,y=s.y*H;cx.moveTo(x+s.r,y);cx.arc(x,y,s.r,0,7)}cx.fill();
 const tilt=.16+Math.sin(t/1300)*.05+Math.min(v*.03,.55)+kick*.22-(target<depth-5?1:0);
 const[hx,hy]=head(dxp,dyp,tilt);
 if(deep>0){dx.globalCompositeOperation="source-over";dx.clearRect(0,0,W*2,H*2);dx.fillStyle=`rgba(0,3,10,${.84*deep})`;dx.fillRect(0,0,W,H);dx.globalCompositeOperation="destination-out";
  const ang=tilt+.32+Math.sin(t/2300)*.08,len=Math.max(W,H)*.8,spr=.34;const lg=dx.createRadialGradient(hx,hy,0,hx,hy,len);lg.addColorStop(0,"rgba(0,0,0,1)");lg.addColorStop(.5,"rgba(0,0,0,.78)");lg.addColorStop(1,"rgba(0,0,0,0)");dx.fillStyle=lg;dx.beginPath();dx.moveTo(hx,hy);dx.arc(hx,hy,len,ang-spr,ang+spr);dx.closePath();dx.fill();
  const hg=dx.createRadialGradient(dxp,dyp,0,dxp,dyp,130);hg.addColorStop(0,"rgba(0,0,0,.92)");hg.addColorStop(1,"rgba(0,0,0,0)");dx.fillStyle=hg;dx.beginPath();dx.arc(dxp,dyp,130,0,7);dx.fill();
  cx.drawImage(dk,0,0,W,H);
  cx.save();cx.globalCompositeOperation="lighter";const bg2=cx.createRadialGradient(hx,hy,0,hx,hy,len*.85);bg2.addColorStop(0,`rgba(225,250,255,${.17*deep})`);bg2.addColorStop(1,"rgba(225,250,255,0)");cx.fillStyle=bg2;cx.beginPath();cx.moveTo(hx,hy);cx.arc(hx,hy,len*.85,ang-spr*.8,ang+spr*.8);cx.closePath();cx.fill();
  for(let i=0;i<14;i++){const a=ang+(((i*.37)%1)-.5)*spr*1.4,r=((t/40+i*61)%(len*.7))+30;cx.fillStyle=`rgba(255,255,255,${.35*deep*(1-r/(len*.7))})`;cx.beginPath();cx.arc(hx+Math.cos(a)*r,hy+Math.sin(a)*r,1.2,0,7);cx.fill()}cx.restore()}
 if(deep>.05){cx.save();cx.globalCompositeOperation="lighter";cx.globalAlpha=deep*.55;for(const col of["#8ff7ff","#a9ffcf"]){cx.fillStyle=col;cx.beginPath();for(const p of glow){if(p.c!==col||Math.sin(t/700+p.p)<0)continue;const x=p.x*W,y=((p.y-depth/4000)%1+1)%1*H;cx.moveTo(x+1.7,y);cx.arc(x,y,1.7,0,7)}cx.fill()}cx.restore();cx.globalAlpha=1}
 for(const c of vis){if(deep>.4&&GLOWY.has(c.k))creature(c.k,c.x,c.y,t,c.d,true,c.dir);if(c.k==="angler")lure(c.x,c.y,t,c.dir)}
 const[mx,my]=mouth(dxp,dyp,tilt);
 if(!intro&&t>nextBreath){nextBreath=t+1500+Math.random()*900;for(let i=0;i<6;i++)bub.push({x:mx,y:my,r:Math.random()*3+1.4,vy:Math.random()*.8+1,d:i*80,w:Math.random()*6})}
 if(!intro&&v>1&&bub.length<90&&Math.random()<.5)bub.push({x:dxp-40+(Math.random()-.5)*16,y:dyp,r:Math.random()*2.5+1.2,vy:Math.random()*1.2+1.4,d:0,w:Math.random()*6});
 for(let i=bub.length-1;i>=0;i--){const b=bub[i];if(b.d>0){b.d-=dt;continue}b.y-=b.vy*dt/16;b.x+=Math.sin(b.y/18+b.w)*.5;cx.drawImage(BUB,b.x-b.r,b.y-b.r,b.r*2,b.r*2);if(b.y<-10)bub.splice(i,1)}
 let iSY=null;if(intro)iSY=introFrame(t,dxp,dyp,tilt);if(!intro)diver(dxp,dyp,t,tilt);
 if(iSY!==null)for(let i=bub.length-1;i>=0;i--)if(bub[i].y<iSY+4)bub.splice(i,1);
 if(deep>0&&!intro){cx.save();cx.globalCompositeOperation="lighter";cx.fillStyle="rgba(255,250,220,.95)";cx.shadowBlur=16;cx.shadowColor="#fff6c8";cx.beginPath();cx.arc(hx,hy,2.6,0,7);cx.fill();cx.restore()}
 cx.save();cx.globalCompositeOperation="lighter";for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];s.x+=s.vx*dt/16;s.y+=s.vy*dt/16;s.vy+=.02;s.l-=dt/950;if(s.l<=0){sparks.splice(i,1);continue}cx.globalAlpha=s.l;cx.fillStyle=s.c;cx.shadowBlur=12;cx.shadowColor=s.c;cx.beginPath();cx.arc(s.x,s.y,s.r*s.l+.4,0,7);cx.fill()}cx.restore();
 cx.globalAlpha=.22+deep*.3;cx.drawImage(VIG,0,0,W,H);cx.globalAlpha=1;
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
 stage.classList.add("intro");
 const skip=e=>{if(e.target&&e.target.closest&&e.target.closest("#f"))return;e.preventDefault();try{a.focus({preventScroll:true})}catch(_){}endIntro()};
 document.addEventListener("pointerdown",skip,true);
 startIntro(()=>{document.removeEventListener("pointerdown",skip,true);stage.classList.remove("intro");card.classList.remove("in");void card.offsetWidth;card.classList.add("in");ask()})}
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
 swap(`<div class="qn">Došel kyslík</div><div class="big">${fmt(m)}</div><div class="zone">${esc(z)}${rec&&m>0?" · nový rekord":""}</div>
 <div class="tcap">Vzácnost odpovědí (1 = běžná, 5 = nejvzácnější, ✕ = chyba)</div><div class="chips">${run.ans.map((v,i)=>`<span style="--i:${i};${v?`color:${TIERS[v-1].c};box-shadow:inset 0 0 0 1px ${TIERS[v-1].c}66`:"color:rgba(255,255,255,.35)"}">${v||"✕"}</span>`).join("")}</div>
 ${(()=>{const ok=run.ans.filter(v=>v);return ok.length?`<div class="avg">Průměrná vzácnost <b>${(ok.reduce((a,b)=>a+b,0)/ok.length).toLocaleString("cs-CZ",{maximumFractionDigits:1,minimumFractionDigits:1})} / 5</b></div>`:""})()}
 <div class="meta"><span>Otázek <b>${run.n}</b></span>${T?`<span>Nejvzácnější <b style="color:${T.c}">${esc(run.best.a)}</b></span>`:""}<span>Rekord <b>${fmt(st.best)}</b></span></div>
 <div class="row"><button class="btn" id="nx">Ponořit se znovu</button><button class="btn g" id="cp">Sdílet</button></div>`,()=>{
  if(rec&&m>0)burst("#ffd36e",70);
  $("nx").onclick=start;
  $("cp").onclick=async()=>{const sq=["⬛","🟩","🟧","🟦","🟪","🟨"];const txt=`Krillion · ${fmt(m)} · ${z}\n${run.ans.map(v=>sq[v]).join("")}`;try{await navigator.clipboard.writeText(txt);toast("Zkopírováno")}catch(e){toast("Kopírování nejde")}}});
 setTimeout(()=>setDepth(0,true),1600);run.o2=0}
o2();home();
}
