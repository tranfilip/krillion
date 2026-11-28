// Krillion – Paměť a výběr otázek (témata Krillionu, páry vyšší/nižší, otázky odhadu), hodnocení odhadu, ukládání do localStorage.
// Bloky mezi značkami testují tests/select.test.js a tests/modes.test.js – značky nepřejmenovávej.
// Skripty se načítají v pořadí z index.html a sdílejí horní const/let/function (klasické skripty, bez build kroku).
/* ---------- paměť a výběr témat (testuje tests/select.test.js) ---------- */
const KEY="krillion5";
function loadState(ls){const s={best:0,runs:0,used:[],fam:{},cnt:{},seq:0,aiQ:{1:[],2:[],3:[],4:[]},dom:[],scores:[]};
 try{const r=JSON.parse(ls.getItem(KEY)||"{}");if(r&&typeof r==="object")Object.assign(s,r)}catch(e){}
 const obj=x=>x&&typeof x==="object"&&!Array.isArray(x);if(!obj(s.fam))s.fam={};if(!obj(s.cnt))s.cnt={};if(!Array.isArray(s.used))s.used=[];if(!Array.isArray(s.dom))s.dom=[];
 if(!obj(s.aiQ))s.aiQ={};for(const k of[1,2,3,4])if(!Array.isArray(s.aiQ[k]))s.aiQ[k]=[];s.seq=+s.seq||0;
 s.scores=Array.isArray(s.scores)?s.scores.filter(x=>Number.isFinite(x)).slice(-20):[]; // výsledky posledních her (průměr na konci hry)
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

/* ---------- režimy: čísla, hodnocení a výběr (testuje tests/modes.test.js) ---------- */
const HLD=window.KRILLION_HL||{V:{},G:[]},ESTD=window.KRILLION_EST||[],MKEY="krillion-rezimy1",YNOW=new Date().getFullYear();
// položky „Vyšší, nebo nižší?“: veličina (otázka + jednotka) a kategorie se dědí ze skupiny; u y:1 je hodnota rok vzniku → stáří
// známost f: 1 = zná každý, 3 = méně známé (skupina f, výjimky v k → 1 a h → 3)
const famOf=(g,n)=>g.k&&g.k.includes(n)?1:g.h&&g.h.includes(n)?3:g.f||2;
const HLI=[];for(const g of HLD.G||[])for(const[n,val,note]of g.i)HLI.push({id:g.v+":"+n,v:g.v,c:g.c,n,val:g.y?YNOW-val:val,lv:Math.log(g.y?YNOW-val:val),yr:g.y?val:null,note:note||g.s||"",a:!!g.a,min:Math.max(1.05,g.min||1.05),f:famOf(g,n)});
const HLV=new Map();for(const x of HLI){if(!HLV.has(x.v))HLV.set(x.v,[]);HLV.get(x.v).push(x)}
/* obtížnost otázky 1–4 (Lehká–Expert): podle poměru hodnot (velký rozdíl = lehčí) a známosti méně známé položky */
const ratioLvl=lr=>lr>=Math.log(3)?1:lr>=Math.log(1.8)?2:lr>=Math.log(1.3)?3:4;
const pairLevel=(lr,f)=>Math.max(1,Math.min(4,Math.round(ratioLvl(lr)+(f-1)*.75)));
// překvapivá srovnání: pevné páry se zajímavostí, obtížnost o stupeň vyšší (intuice tu klame), nejméně Střední
const HLX=(HLD.X||[]).map(([q,u,A,B,fact,o],i)=>{o=o||{};const mk=([n,val])=>{const v=o.y?YNOW-val:val;return{id:"x"+i+":"+n,v:"x"+i,c:"Překvapení",n,val:v,lv:Math.log(v),yr:o.y?val:null,note:"",a:!!o.a,min:1.05,f:1,u}};
 const a=mk(A),b=mk(B),lr=Math.abs(a.lv-b.lv);return{key:q+"|"+A[0]+"|"+B[0],q,a,b,fact,lr,lvl:Math.max(2,Math.min(4,ratioLvl(lr)+1))}});
const ESTQ=ESTD.map(([c,q,v,u,note])=>({c,q,v,u:u||"",note:note||""}));
/* číslo od hráče: „1 500“, „1,5 mil“, „2 tis.“, „3k“, „1.500.000“, „2,5 miliardy“, „206 kostí“ */
const MULTW=[[/^(bilion|bil)/,1e12],[/^(miliard|mld|md)/,1e9],[/^(milion|mil|mio)/,1e6],[/^(tis|k$)/,1e3]];
function parseNum(s){let t=String(s??"").toLowerCase().replace(/[\s  '’_]/g,"").replace(/^(~|≈|asi|cca|zhruba|přibližně|priblizne)/,"");
 const m=t.match(/^(\d[\d.,]*)(.*)$/);let num="1",rest=t;if(m){num=m[1].replace(/[.,]+$/,"");rest=m[2]}else if(!t)return NaN;
 const dots=(num.match(/\./g)||[]).length,commas=(num.match(/,/g)||[]).length;
 if(dots&&commas){const dec=num.lastIndexOf(".")>num.lastIndexOf(",")?".":",";num=num.split(dec==="."?",":".").join("").replace(dec,".")}
 else if(commas)num=/^\d{1,3}(,\d{3}){2,}$/.test(num)?num.replace(/,/g,""):commas===1?num.replace(",","."):"x"; // čárka = desetinná (česky), 1,500,000 = tisíce
 else if(dots)num=/^\d{1,3}(\.\d{3})+$/.test(num)?num.replace(/\./g,""):dots===1?num:"x"; // 1.500 = tisíc, 1.5 = desetinné
 let v=/^\d+(\.\d+)?$/.test(num)?parseFloat(num):NaN;if(!isFinite(v))return NaN;
 rest=rest.replace(/^[.,]+/,"");const e=rest.match(/^e(\d{1,2})/);
 if(e)v*=10**+e[1];else if(rest){const w=MULTW.find(([re])=>re.test(rest));if(w)v*=w[1];else if(!m)return NaN}
 return v>0&&isFinite(v)?v:NaN}
/* hodnocení odhadu podle poměru r = max(tip/skutečnost, skutečnost/tip): plynulá křivka, lineární v logaritmech
   mezi body r ≤ 1,05 → 1 000 m, 2 → 500, 10 → 50, 100 → 20, 1 000 → 5, víc než 1 000× → 0 */
const EP=[[1.05,1000],[2,500],[10,50],[100,20],[1000,5]].map(([r,m])=>[Math.log(r),Math.log(m)]);
const EK=[1.05,1.25,2,10].map(Math.log); // nadpis: Přesně! / Skoro! / Blízko / Daleko / Úplně vedle
function estScore(g,t){if(!(g>0)||!(t>0))return{m:0,k:5,q:Infinity};const q=Math.max(g/t,t/g),L=Math.log(q),e=1e-9;let m;
 if(L<=EP[0][0]+e)m=1000;else if(L>EP[EP.length-1][0]+e)m=0;
 else{let i=0;while(L>EP[i+1][0]+e)i++;const[x0,y0]=EP[i],[x1,y1]=EP[i+1];m=Math.exp(y0+(y1-y0)*(L-x0)/(x1-x0))}
 m=m>=100?Math.round(m/10)*10:Math.round(m);let k=0;while(k<EK.length&&L>EK[k]+e)k++;return{m,k,q}}
const fmtR=x=>x.toLocaleString("cs-CZ",{maximumFractionDigits:x<10?1:0});
function estDiff(g,t){if(!(g>0))return"bez odpovědi";const r=g/t;if(Math.abs(r-1)<.005)return"přesně";
 if(r>=1000||r<=.001)return`přes 1 000× ${r>1?"víc":"míň"}`;if(r>=2)return`${fmtR(r)}× víc`;if(r<=.5)return`${fmtR(1/r)}× míň`;const p=Math.max(1,Math.round(Math.abs(r-1)*100));return`o ${p} % ${r>1?"víc":"míň"}`}
/* čísla pro lidi: 1,38 mil. / 2,92 mld. jen když se tím nic neztratí, jinak celé číslo s mezerami */
function fmtNum(v){const a=Math.abs(v),L=(x,d)=>x.toLocaleString("cs-CZ",{maximumFractionDigits:d});
 for(const[k,s]of[[1e12," bil."],[1e9," mld."],[1e6," mil."]])if(a>=k){const x=v/k;if(Math.abs(x*1000-Math.round(x*1000))<1e-6||a>=1e12)return L(x,3)+s;break}
 if(a>=1000)return L(Math.round(v),0);if(a>=1)return L(v,3);if(!a)return"0";
 return L(v,Math.min(8,1-Math.floor(Math.log10(a))+2))}
const plLet=n=>n===1?"rok":Number.isInteger(n)&&n>=2&&n<=4?"roky":Number.isInteger(n)?"let":"roku";
// hodnota s jednotkou: malé kilogramy jako gramy, velké vzdálenosti v km, „let“ ve správném tvaru
function fmtU(v,u){if(u==="kg"&&v<1)return v<.001?fmtNum(v*1e6)+" mg":fmtNum(v*1000)+" g";if(u==="m"&&v>=1e5)return fmtNum(v/1000)+" km";
 if(u==="let")u=plLet(v);return fmtNum(v)+(u?" "+u:"")}
const yrTxt=y=>y<0?`${-y} př. n. l.`:String(y);
function fmtHL(x,val=x.val){const u=x.u!==undefined?x.u:(HLD.V[x.v]||[])[1]||"";return(x.a?"~":"")+fmtU(val,u)+(x.yr!==null?` (${yrTxt(x.yr)})`:"")}
/* paměť režimů (rekordy, použité páry a otázky) – zvlášť od Krillion režimu, přežije reload */
function loadModes(ls){const s={hl:{best:0,runs:0,pairs:[],it:{}},est:{best:0,runs:0,cnt:{},last:{},seq:0}},obj=x=>x&&typeof x==="object"&&!Array.isArray(x);
 let r=null;try{r=JSON.parse(ls.getItem(MKEY)||"null")}catch(e){}
 if(obj(r))for(const k of["hl","est"])if(obj(r[k]))Object.assign(s[k],r[k]);
 const h=s.hl,e=s.est;h.best=+h.best||0;h.runs=+h.runs||0;h.pairs=Array.isArray(h.pairs)?h.pairs.filter(x=>typeof x==="string"):[];if(!obj(h.it))h.it={};if(!obj(h.sx))h.sx={};
 e.best=+e.best||0;e.runs=+e.runs||0;e.seq=+e.seq||0;if(!obj(e.cnt))e.cnt={};if(!obj(e.last))e.last={};
 for(const o of[h,e])o.scores=Array.isArray(o.scores)?o.scores.filter(x=>Number.isFinite(x)).slice(-20):[]; // výsledky posledních her
 return s}
function saveModes(ls,s){try{ls.setItem(MKEY,JSON.stringify(s));return true}catch(e){return false}}
/* „Vyšší, nebo nižší?“: cílová obtížnost roste s počtem otázek (1–4 Lehká, 5–9 Střední, 10–15 Těžká, pak Expert).
   Pár: stejná veličina, poměr ≥ 1,05 (a ≥ min skupiny), co nejblíž cílové obtížnosti, žádná položka dvakrát za ponor,
   pár se mezi hrami neopakuje, méně použité položky mají přednost a veličiny se střídají. Občas padne překvapivé srovnání. */
const hlLvl=n=>n<=4?1:n<=9?2:n<=15?3:4;
const LVR={1:4,2:2.2,3:1.5,4:1.15},HL_MULT={1:1,2:1.5,3:2,4:3};
const hlPoints=l=>100*HL_MULT[l];
const streakBonus=s=>s>0&&s%6===0?300*s/6:0; // série 6 → +300 m, 12 → +600 m, 18 → +900 m…
const hlKey=(a,b)=>a.id<b.id?a.id+"|"+b.id:b.id+"|"+a.id;
function pickSurprise(h,run,L,rnd){if(!HLX.length)return null;const cnt=x=>h.sx[x.key]||0,c0=Math.min(...HLX.map(cnt));
 let pool=HLX.filter(x=>cnt(x)===c0&&!run.items.has(x.a.id));if(!pool.length)return null;
 const d0=Math.min(...pool.map(x=>Math.abs(x.lvl-L)));pool=pool.filter(x=>Math.abs(x.lvl-L)===d0);
 const x=pool[Math.floor(rnd()*pool.length)];h.sx[x.key]=c0+1;run.items.add(x.a.id);run.lastXn=run.n;
 return{v:x.a.v,a:x.a,b:x.b,r:Math.exp(x.lr),lvl:x.lvl,q:x.q,fact:x.fact,side:rnd()<.5?[x.a,x.b]:[x.b,x.a]}}
function pickPair(ms,run,rnd=Math.random){const h=ms.hl;if(!h.sx)h.sx={};const L=hlLvl(run.n||1),T=Math.log(LVR[L]);
 // překvapení: od 3. otázky, asi každá třetí, nikdy dvě hned po sobě
 if(run.n>=3&&(run.n-(run.lastXn||-9))>=2&&rnd()<.34){const x=pickSurprise(h,run,L,rnd);if(x)return x}
 for(let pass=0;pass<2;pass++){const used=new Set(h.pairs);let best=null,bs=Infinity;
  const order=[...HLV.keys()].map(v=>{const w=Math.sqrt(HLV.get(v).length)/(1+3*(run.vc[v]||0))*(run.lastV.includes(v)?.01:1);return{v,k:Math.pow(rnd(),1/w)}}).sort((a,b)=>b.k-a.k);
  order.forEach(({v},rank)=>{const P=HLV.get(v).filter(x=>!run.items.has(x.id)),cnt=x=>h.it[x.id]||0,c0=Math.min(...P.map(cnt));
   const base=rank*.18,ca=P.map(x=>.25*(cnt(x)-c0));if(base>=bs)return;
   for(let i=0;i<P.length;i++){const a=P[i];if(!(a.val>0))continue;for(let j=i+1;j<P.length;j++){const b=P[j];if(!(b.val>0))continue;const lr=Math.abs(a.lv-b.lv);
    if(lr<Math.log(Math.max(a.min,b.min))-1e-12)continue;const d=pairLevel(lr,Math.max(a.f,b.f));
    const s=2.5*Math.abs(d-L)+.6*Math.abs(lr-T)+ca[i]+ca[j]+(a.c!==b.c?.12:0)+base+rnd()*.15;if(s<bs&&!used.has(hlKey(a,b))){bs=s;best={v,a,b,r:Math.exp(lr),lvl:d}}}}});
  if(best){const{v,a,b}=best;h.pairs.push(hlKey(a,b));if(h.pairs.length>4000)h.pairs=h.pairs.slice(-4000);h.it[a.id]=(h.it[a.id]||0)+1;h.it[b.id]=(h.it[b.id]||0)+1;
   run.items.add(a.id);run.items.add(b.id);run.vc[v]=(run.vc[v]||0)+1;run.lastV=[v,...run.lastV].slice(0,2);best.side=rnd()<.5?[a,b]:[b,a];return best}
  h.pairs=[]} // všechny páry už padly → paměť párů od začátku
 return null}
/* „Odhad“: otázka se zopakuje až po vystřídání všech ostatních (i mezi hrami), obory se v ponoru střídají */
function pickEst(ms,run,rnd=Math.random){const e=ms.est,cnt=x=>e.cnt[x.q]||0,last=x=>e.last[x.q]||0;
 let pool=ESTQ.filter(x=>!run.qs.has(x.q));if(!pool.length)pool=ESTQ.slice();
 const c0=Math.min(...pool.map(cnt));pool=pool.filter(x=>cnt(x)===c0);
 const recent=run.cats.slice(-3),fresh=pool.filter(x=>!recent.includes(x.c));if(fresh.length)pool=fresh;
 const l0=Math.min(...pool.map(last));pool=pool.filter(x=>last(x)===l0);
 const p=pool[Math.floor(rnd()*pool.length)];e.seq++;e.cnt[p.q]=c0+1;e.last[p.q]=e.seq;run.qs.add(p.q);run.cats.push(p.c);return p}
/* ---------- konec režimů ---------- */
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
/* zápis do localStorage (stovky kB JSONu) neběží uprostřed animace nové otázky, ale chvíli po ní;
   při odchodu ze stránky nebo přepnutí aplikace se uloží hned */
const later=(fn,ms)=>{let t=0;const run=()=>{if(t){clearTimeout(t);t=0;fn()}},f=()=>{if(!t)t=setTimeout(run,ms)};f.flush=run;return f};
const saveLS=later(()=>saveState(localStorage,st),700);
const save=()=>{saveLS();remoteDirty=true;clearTimeout(remoteT);remoteT=setTimeout(pushRemote,1500)};
(async()=>{try{if(!window.claude||!window.claude.use)return;const[db,user]=await Promise.all([window.claude.use("db"),window.claude.use("user")]);if(!db||!user)return;const id=await user.id();if(!id)return;
 const ref=db.doc("data/users/"+id+"/krillion");const snap=await ref.get();dbRef=ref;if(snap.exists){mergeState(snap.data());saveState(localStorage,st)}}catch(e){}})();
// Safari po 7 dnech bez návštěvy maže localStorage; požádej o trvalé úložiště, kde to jde
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist().catch(()=>{})}catch(e){}
