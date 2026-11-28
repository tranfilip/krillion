// Krillion – Uživatelské rozhraní a režim Krillion: výměna karty, HUD, úvodní obrazovka, společný seskok launch, otázky a hodnocení Krillionu,
// konec hry, časový pruh tick a společné pomocné funkce režimů.
// Skripty se načítají v pořadí z index.html a sdílejí horní const/let/function (klasické skripty, bez build kroku).
/* ---------- hra ---------- */
let run=null,left=25,limit=25,busy=false,lastZone="Sluneční zóna",advT=null;
const ARROW='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const LVN={1:"Lehká",2:"Střední",3:"Těžká",4:"Expert"};
const FLAME='<svg viewBox="0 0 16 20" aria-hidden="true"><path fill="currentColor" d="M8 0c1 3.2 5.6 5.6 5.6 11A5.6 5.6 0 0 1 2.4 11c0-2.6 1.3-4.3 2.6-5.6.2 1.8 1 3 2.2 3.4C6.4 5.8 7.3 2.6 8 0z"/></svg>';
const lvlFor=n=>n<=3?1:n<=7?2:n<=12?3:4;
function swap(html,after){card.classList.add("out");setTimeout(()=>{stage.scrollTop=0;card.innerHTML=html;card.classList.remove("out","in");void card.offsetWidth;card.classList.add("in");after&&after()},170)}
function o2(effect){const e=$("o2");if(run&&run.mode==="est"){e.classList.remove("low");e.innerHTML=`<span class="qc">${Math.max(1,Math.min(run.n,EST_N))}<small> / ${EST_N}</small></span>`;return}
 const n=run?run.o2:3;e.innerHTML=[0,1,2].map(i=>`<i class="${i>=n?"off":""}${effect&&effect.i===i?" "+effect.c:""}"></i>`).join("");e.classList.toggle("low",n===1);
 if(run&&run.mode==="hl"){const k=run.streak||0;e.insertAdjacentHTML("beforeend",`<span class="streak${k?"":" off"}${effect&&effect.hot?" hot":""}" aria-label="Série ${k}">${FLAME}<b>${k}</b></span>`)}}
function toast(s){const e=$("toast");e.textContent=s;e.classList.add("on");clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove("on"),2600)}
function setDepth(m,slow){ease=slow?2600:1000;if(m>target){kick=1;const d=$("dm");d.classList.add("bump");setTimeout(()=>d.classList.remove("bump"),350)}target=m;const z=zoneOf(m);if(z!==lastZone&&m>0){lastZone=z;setTimeout(()=>toast(z),1000)}}
/* úvodní obrazovka: výběr režimu (loď, moře i seskok jsou pro všechny režimy stejné) */
function home(){run=null;o2();setDepth(0,true);stage.classList.remove("play");card.onclick=null;stopT();clearTimeout(advT);advT=null;
 const rec=b=>b?`Rekord <b>${fmt(b)}</b>`:"Bez rekordu",M=[
  ["hl","#8ef0c6","Vyšší, nebo nižší?","Ťukni na to, čeho je víc. Rozdíly se zmenšují, chyba stojí bublinu kyslíku.",ms.hl.best],
  ["est","#63b6ff","Odhad","Deset otázek, odpovíš číslem. Čím přesnější odhad, tím hlouběji.",ms.est.best],
  ["kr","#ffd36e","Krillion","Napiš odpověď. Čím vzácnější, tím hlouběji. Ponor končí, až dojde kyslík.",st.best]];
 swap(`<h1>Krillion</h1><p class="lede">Vyber si, jak se dnes ponoříš.</p><div class="modes">${M.map(([k,c,t,d,b],i)=>`<button class="mode" type="button" data-m="${k}" style="--c:${c};--i:${i}"><span class="mt">${t}</span><span class="mr">${rec(b)}</span><span class="md">${d}</span></button>`).join("")}</div>`,
  ()=>{for(const b of card.querySelectorAll(".mode"))b.onclick=()=>({hl:startHL,est:startEst,kr:start})[b.dataset.m]()})}
function nextPrompt(l){gen(l);gen(Math.min(4,l+1));
 while(aiQ[l].length&&tooSimilar(aiQ[l][0].q,st.used.slice(-400)))aiQ[l].shift(); // starší fronta od Clauda
 if(aiQ[l].length&&Math.random()<.55){const i=Math.max(0,aiQ[l].findIndex(p=>!run.fams.has("dom:"+p.d)));const p=aiQ[l].splice(i,1)[0];run.asked.add(p.q);run.fams.add("dom:"+p.d);run.lastKind="ai";st.used.push(p.q);save();return{q:p.q,ai:true}}
 const pick=pickTopic(st,run,l);save();return{q:pick.q,ai:false}}
/* společný seskok z lodi pro všechny režimy. Karta se vytvoří hned při tapnutí a input dostane fokus v rámci
   tapnutí (jinak iOS neotevře klávesnici); do dopadu je karta skrytá třídou .stage.intro. */
function launch(html,setup,first){lastZone="Sluneční zóna";target=0;o2();card.onclick=null;stopT();clearTimeout(advT);advT=null;busy=false;
 // poloha lodi a hladiny se změří ještě s úvodní kartou, pak se karta přepne do herního rozložení
 const done=()=>{document.removeEventListener("pointerdown",skip,true);stage.classList.remove("intro");card.classList.remove("in");void card.offsetWidth;card.classList.add("in");first()};
 if(RM){S.m="dive";S.co=0;S.dv=null;depth=0}else{beginRoll(done);stage.classList.add("intro")}
 stage.classList.add("play");card.classList.remove("out","in");card.innerHTML=html;void card.offsetWidth;card.classList.add("in");
 const a=setup&&setup();
 // iOS otevře klávesnici jen při fokusu v rámci tapnutí → fokus hned teď, karta je zatím neviditelná
 if(a)try{a.focus({preventScroll:true})}catch(e){}
 if(RM){first();return}
 // tapnutí během seskoku ho zrychlí (doběhne plynule za zlomek sekundy), fokus inputu zůstane
 function skip(e){if(a&&e.target&&e.target.closest&&e.target.closest("#f"))return;e.preventDefault();if(a)try{a.focus({preventScroll:true})}catch(_){}S.sp=6}
 document.addEventListener("pointerdown",skip,true)}
function start(){run={mode:"kr",o2:3,pts:0,n:0,ans:[],best:null,asked:new Set(),fams:new Set()};
 launch(`<div class="prog" id="prog"><i id="bar"></i></div><div class="panel" id="pn"></div>
 <form class="glass field" id="f" autocomplete="off"><input id="a" placeholder="Tvoje odpověď" aria-label="Odpověď" enterkeyhint="send" autocapitalize="sentences" autocorrect="off" spellcheck="false"><button class="go" id="sb" aria-label="Odeslat">${ARROW}</button></form>
 <div class="hint" id="h"></div><button class="skip" id="sk" type="button">Přeskočit</button>`,()=>{
  $("f").onsubmit=e=>{e.preventDefault();if(advT){advance();return}submit()};$("sk").onclick=()=>{if(!busy)lose("Přeskočeno",null)};
  $("a").addEventListener("input",e=>{if(advT)e.target.value=""});
  gen(1);gen(2);return $("a")},ask)}
function ask(){busy=false;advT=null;run.n++;run.lvl=lvlFor(run.n);const p=nextPrompt(run.lvl);run.q=p.q;run.ai=p.ai;
 limit=run.n>16?Math.max(10,15-(run.n-16)*.5):({1:25,2:21,3:18,4:15})[run.lvl];left=limit;
 const pn=$("pn");pn.className="panel";pn.onclick=null;pn.innerHTML=`<div style="animation:fade .45s both"><div class="qn">#${run.n} · ${LVN[run.lvl]}</div>${(()=>{const m=run.q.match(/^(.*) \((na písmeno .+|aspoň \d+ písmen)\)$/);return m?`<div class="q">${esc(m[1])}</div><div class="tag">${esc(m[2])}</div>`:`<div class="q">${esc(run.q)}</div>`})()}</div>`;
 if(run.n===4||run.n===8||run.n===13)toast(`Obtížnost: ${LVN[run.lvl]} · ×${MULT[run.lvl]} hloubky`);
 const a=$("a");a.value="";$("f").classList.remove("dim");$("sb").innerHTML=ARROW;$("h").textContent="";$("sk").style.visibility="";
 try{a.focus({preventScroll:true})}catch(e){}
 tick(limit,()=>{$("a").value.trim()?submit():lose("Došel čas",null)})}
async function submit(){const a=$("a");if(!a||busy)return;const v=a.value.trim();if(!v){a.focus();return}
 busy=true;$("sb").innerHTML='<span class="spin"></span>';
 const q=run.q;let r=run.ai?null:localJudge(q,v);
 if((!r||!r.valid)&&sample){try{const ar=await aiJudge(q,v);if(ar.valid||!r)r=ar;else if(r&&!r.top?.length)r.top=ar.top}catch(e){if(!aiWarned){aiWarned=true;toast(aiErr==="not_granted"?"Claude není povolený · záložní režim":aiErr==="rate_limited"?"Limit Clauda vyčerpán · záložní režim":"Claude neodpovídá · záložní režim")}}}
 if(run.ai&&(!r||!r.valid)&&!/\(| v | ve | z | ze | na | od | do |\d/.test(" "+q+" ")){const lr=looseLocal(q,v);if(lr)r=lr}
 if(!r){showRes(`<div class="tier" style="color:#d4e4ff">Bez hodnocení</div><div class="sub">Tohle zadání se nepodařilo ověřit · kyslík ti zůstává</div>`);return}
 if(r.valid)win(r);else lose(r.reason||"Tohle neplatí",r)}
function showRes(html){stopT();busy=true;const pn=$("pn");pn.className="panel res";pn.innerHTML=`<div>${html}</div>`;pn.onclick=advance;
 $("f").classList.add("dim");$("sb").innerHTML=ARROW;$("sk").style.visibility="hidden";$("h").textContent="";
 clearTimeout(advT);advT=setTimeout(advance,run.o2>0?2300:2700)}
function win(r){const T=TIERS[r.tier],m=Math.round(T.p*MULT[run.lvl]);run.pts+=m;run.ans.push(r.tier+1);if(!run.best||r.tier>run.best.t||(r.tier===run.best.t&&run.lvl>run.best.l))run.best={t:r.tier,a:r.name,l:run.lvl};
 setDepth(run.pts*10);burst(T.c,12+r.tier*10);
 let extra="";if(r.tier===4&&run.o2<3){run.o2++;o2({i:run.o2-1,c:"gain"});extra=" · <b>+1 kyslík</b>"}
 showRes(`<div class="tier" style="color:${T.c};text-shadow:0 0 34px ${T.c}88">${T.n}</div><div class="sub"><b>${esc(r.name)}</b> · vzácnost ${r.tier+1}/5 · +${fmt(m*10)}${extra}</div><div class="ladder">${TIERS.map((x,i)=>`<i class="${i<=r.tier?"on":""}" style="color:${T.c};--i:${i}"></i>`).join("")}</div>`)}
function lose(why,r){stopT();run.o2--;run.ans.push(0);o2({i:run.o2,c:"pop"});hurt=1;
 const f=$("flash");f.classList.add("on");setTimeout(()=>f.classList.remove("on"),60);const fe=$("f");fe.classList.remove("shake");void fe.offsetWidth;fe.classList.add("shake");try{navigator.vibrate&&navigator.vibrate(60)}catch(e){}
 const ex=r&&r.top&&r.top.length?r.top:(localJudge(run.q,"")||{}).top;
 showRes(`<div class="tier" style="color:#ffb0a5;text-shadow:0 0 30px #ff7a6a77">−1 kyslík</div><div class="sub">${esc(why)}${ex&&ex.length?` · platilo by třeba <b>${ex.map(esc).join(", ")}</b>`:""}</div>`)}
function advance(){if(!advT)return;clearTimeout(advT);advT=null;if(run.o2<=0)end();else ask()}
function end(){stopT();const a=$("a");a&&a.blur();stage.classList.remove("play");const m=run.pts*10,rec=m>st.best;if(rec)st.best=m;st.runs++;save();
 const z=zoneOf(m),T=run.best?TIERS[run.best.t]:null;
 swap(`<div class="end"><div class="qn">Došel kyslík</div><div class="big">${fmt(m)}</div><div class="zone">${esc(z)}${rec&&m>0?" · nový rekord":""}</div>
 <div class="tcap">Vzácnost odpovědí (1 = běžná, 5 = nejvzácnější, ✕ = chyba)</div><div class="chips">${run.ans.map((v,i)=>`<span style="--i:${i};${v?`color:${TIERS[v-1].c};box-shadow:inset 0 0 0 1px ${TIERS[v-1].c}66`:"color:rgba(255,255,255,.35)"}">${v||"✕"}</span>`).join("")}</div>
 ${(()=>{const ok=run.ans.filter(v=>v);return ok.length?`<div class="avg">Průměrná vzácnost <b>${(ok.reduce((a,b)=>a+b,0)/ok.length).toLocaleString("cs-CZ",{maximumFractionDigits:1,minimumFractionDigits:1})} / 5</b></div>`:""})()}
 <div class="meta"><span>Otázek <b>${run.n}</b></span>${T?`<span>Nejvzácnější <b style="color:${T.c}">${esc(run.best.a)}</b></span>`:""}<span>Rekord <b>${fmt(st.best)}</b></span></div>
 <div class="row"><button class="btn" id="nx">Ponořit se znovu</button><button class="btn g" id="cp">Sdílet</button></div><button class="skip" id="md" type="button">Jiný režim</button></div>`,()=>{
  if(rec&&m>0)burst("#ffd36e",70);
  $("nx").onclick=start;$("md").onclick=home;
  $("cp").onclick=async()=>{const sq=["⬛","🟩","🟧","🟦","🟪","🟨"];const txt=`Krillion · ${fmt(m)} · ${z}\n${run.ans.map(v=>sq[v]).join("")}`;try{await navigator.clipboard.writeText(txt);toast("Zkopírováno")}catch(e){toast("Kopírování nejde")}}});
 const r0=run;setTimeout(()=>{if(run===r0&&S.m==="dive")beginAscent()},700);run.o2=0}
/* ---------- společné pro nové režimy ---------- */
let ms=loadModes(localStorage);const saveM=()=>saveModes(localStorage,ms);
const HL_T=15,EST_N=10,EST_T=30;
/* časový pruh: zbývající čas z performance.now() (konec = start + limit), kreslí se v requestAnimationFrame přes
   transform: scaleX. Během vyhodnocování (busy) se čas zastaví a konec se posune o dobu pauzy. Smyčka skončí s otázkou. */
let tm=null;
function stopT(){if(tm){cancelAnimationFrame(tm.raf);tm=null}}
function tick(sec,onEnd){stopT();limit=left=sec;const b0=$("bar"),p0=$("prog");if(b0)b0.style.transform="scaleX(1)";if(p0)p0.classList.remove("low","pause");
 const t={raf:0,end:performance.now()+sec*1000,pausedAt:0};tm=t;
 const f=now=>{if(tm!==t)return;const b=$("bar"),p=$("prog");if(!b||!p){stopT();return}
  if(busy){if(!t.pausedAt)t.pausedAt=now}else if(t.pausedAt){t.end+=now-t.pausedAt;t.pausedAt=0}
  if(p.classList.contains("pause")!==busy)p.classList.toggle("pause",busy);
  left=Math.max(0,((t.pausedAt||now)-t.end)/-1000);b.style.transform=`scaleX(${left/limit})`;
  const low=left<6;if(p.classList.contains("low")!==low)p.classList.toggle("low",low);
  if(left<=0){stopT();onEnd();return}t.raf=requestAnimationFrame(f)};
 t.raf=requestAnimationFrame(f)}
function ouch(){hurt=1;const f=$("flash");f.classList.add("on");setTimeout(()=>f.classList.remove("on"),60);try{navigator.vibrate&&navigator.vibrate(60)}catch(e){}}
function share(btn,txt){btn.onclick=async()=>{try{await navigator.clipboard.writeText(txt);toast("Zkopírováno")}catch(e){toast("Kopírování nejde")}}}
function ascendLater(){const r0=run;setTimeout(()=>{if(run===r0&&S.m==="dive")beginAscent()},700)}
const endRow=`<div class="row"><button class="btn" id="nx">Ponořit se znovu</button><button class="btn g" id="cp">Sdílet</button></div><button class="skip" id="md" type="button">Jiný režim</button>`;
const LVC={1:"#8ef0c6",2:"#63b6ff",3:"#c9a8ff",4:"#ffd36e"};
const pct=r=>r<2?`${Math.max(5,Math.round((r-1)*100))} %`:`${fmtR(r)}×`;
