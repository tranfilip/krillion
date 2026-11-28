// Krillion – Data témat Krillionu (odvozené seznamy DB/DBQ) a rozpoznávání odpovědí: norm, lev, close, stem, strong, weak, part, localJudge, looseLocal.
// Blok rozpoznávání (od definice norm po tierFromPct) testuje tests/judge.test.js – hranice bloku nepřesouvej.
// Skripty se načítají v pořadí z index.html a sdílejí horní const/let/function (klasické skripty, bez build kroku).
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
 if(L>=5&&a.replace(/ej$/,"y")===b.replace(/ej$/,"y"))return true; // hovorové -ej: Plzeňskej → Plzeňský
 return false}
/* kmen slova: šmoulí/šmoulová/šmoula → smoul, čokoládová/čokoláda → cokolad, vanilková/vanilka → vanilk */
const stem=t=>{if(t.length<5)return t;const r=t.replace(/(ovou|ove|ova|ovy|ovi|ou|emu|eho|ych|ymi|ie|ia)$/,"");return(r.length>=4?r:t).replace(/[aeiouy]$/,"")};
const stemEqW=(a,b)=>{const x=stem(a),y=stem(b);return x.length>=4&&x===y};
const stemAll=(n,v)=>{const a=n.split(" "),b=v.split(" ");return a.length===b.length&&a.some(t=>t.length>=5)&&a.every((t,i)=>t===b[i]||stemEqW(t,b[i])||close(t,b[i]))};
// bez mezer jen tehdy, když nejde o vynechané krátké rozlišující slovo („vitamín“ ≠ Vitamín C)
const strong=(n,v)=>close(n,v)||(n.includes(" ")||!v.split(" ").some(t=>t.length<3)?close(n.replace(/ /g,""),v.replace(/ /g,"")):n.replace(/ /g,"")===v.replace(/ /g,""))||stemAll(n,v);
function weak(n,v){const nt=n.split(" ").filter(t=>t.length>=3);
 if(!v.includes(" ")){if(nt.length>1&&v.length>=3&&nt.some(t=>close(t,v)))return true}
 else{const vt=v.split(" ").filter(t=>t.length>=3),all=n.split(" ");if(vt.length&&vt.every(x=>nt.some(t=>close(t,x)))&&v.split(" ").every(x=>x.length>=3||all.includes(x)))return true} // krátká slova musí sedět: „vitamín“ ≠ Vitamín C
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
