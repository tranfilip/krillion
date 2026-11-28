// Krillion – Uživatelské rozhraní a režim Krillion: výměna karty, HUD, úvodní obrazovka, společný seskok launch, otázky a hodnocení Krillionu,
// nastavení a návody, koncová karta se sdílením, časový pruh tick a společné pomocné funkce režimů.
// Skripty se načítají v pořadí z index.html a sdílejí horní const/let/function (klasické skripty, bez build kroku).
/* ---------- hra ---------- */
let run=null,left=25,limit=25,busy=false,lastZone="Sluneční zóna",advT=null;
const ARROW='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const LVN={1:"Lehká",2:"Střední",3:"Těžká",4:"Expert"};
const FLAME='<svg viewBox="0 0 16 20" aria-hidden="true"><path fill="currentColor" d="M8 0c1 3.2 5.6 5.6 5.6 11A5.6 5.6 0 0 1 2.4 11c0-2.6 1.3-4.3 2.6-5.6.2 1.8 1 3 2.2 3.4C6.4 5.8 7.3 2.6 8 0z"/></svg>';
const lvlFor=n=>n<=3?1:n<=7?2:n<=12?3:4;
// výměna obsahu karty; nová výměna zruší nedokončenou předchozí (dvojí tapnutí nesmí přepsat novou obrazovku starou)
function swap(html,after){clearTimeout(swap.t);card.classList.add("out");swap.t=setTimeout(()=>{swap.t=0;stage.scrollTop=0;card.innerHTML=html;CG.dirty=true;card.classList.remove("out","in");void card.offsetWidth;card.classList.add("in");after&&after()},170)}
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
 swap(`<button class="gear" id="gear" type="button" aria-label="Nastavení" title="Nastavení">${SLIDERS}</button><h1>Krillion</h1><p class="lede">Vyber si, jak se dnes ponoříš.</p><div class="modes">${M.map(([k,c,t,d,b],i)=>`<button class="mode" type="button" data-m="${k}" style="--c:${c};--i:${i}"><span class="mt">${t}</span><span class="mr">${rec(b)}</span><span class="md">${d}</span></button>`).join("")}</div>`,
  ()=>{for(const b of card.querySelectorAll(".mode"))b.onclick=()=>openMode(b.dataset.m);$("gear").onclick=settings})}
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
 clearTimeout(swap.t);swap.t=0;stage.classList.add("play");card.classList.remove("out","in");card.innerHTML=html;CG.dirty=true;void card.offsetWidth;card.classList.add("in");
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
 limit=run.n>16?Math.max(10,15-(run.n-16)*.5):({1:25,2:21,3:18,4:15})[run.lvl];
 limit+=readT(run.q.length,45,10,5);left=limit; // dlouhé zadání = pár sekund navíc na přečtení
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
 setDepth(run.pts*10);burst(T.c,12+r.tier*10);buzz(r.tier>=3?[20,40,20]:12);
 let extra="";if(r.tier===4&&run.o2<3){run.o2++;o2({i:run.o2-1,c:"gain"});extra=" · <b>+1 kyslík</b>"}
 showRes(`<div class="tier" style="color:${T.c};text-shadow:0 0 34px ${T.c}88">${T.n}</div><div class="sub"><b>${esc(r.name)}</b> · vzácnost ${r.tier+1}/5 · +${fmt(m*10)}${extra}</div><div class="ladder">${TIERS.map((x,i)=>`<i class="${i<=r.tier?"on":""}" style="color:${T.c};--i:${i}"></i>`).join("")}</div>`)}
function lose(why,r){stopT();run.o2--;run.ans.push(0);o2({i:run.o2,c:"pop"});hurt=1;
 const f=$("flash");f.classList.add("on");setTimeout(()=>f.classList.remove("on"),60);const fe=$("f");fe.classList.remove("shake");void fe.offsetWidth;fe.classList.add("shake");buzz([40,30,40]);
 // ukázka platných odpovědí: dvě běžné a jedna z nejvzácnějších (u vestavěných témat)
 const ex=r&&r.top&&r.top.length?r.top:(localJudge(run.q,"")||{}).top,it=DBQ.get(run.q),rare=it&&it.list.length>=6?it.list[it.list.length-1].show:"";
 const tip=ex&&ex.length?` · platilo by třeba <b>${(rare?ex.slice(0,2):ex).map(esc).join(", ")}</b>${rare?` nebo vzácné <b>${esc(rare)}</b>`:""}`:"";
 showRes(`<div class="tier" style="color:#ffb0a5;text-shadow:0 0 30px #ff7a6a77">${run.o2>0?"−1 kyslík":"Došel kyslík"}</div><div class="sub">${esc(why)}${tip}</div>`)}
function advance(){if(!advT)return;clearTimeout(advT);advT=null;if(run.o2<=0)end();else ask()}
function end(){stopT();const a=$("a");a&&a.blur();stage.classList.remove("play");const m=run.pts*10,prev=st.best;if(m>st.best)st.best=m;st.runs++;pushScore(st,m);save();
 const r0=run,T=r0.best?TIERS[r0.best.t]:null,ok=r0.ans.filter(v=>v),avg=ok.length?ok.reduce((a,b)=>a+b,0)/ok.length:0;
 endCard({title:"Krillion · došel kyslík",m,prev,runs:st.runs,scores:st.scores,again:start,
  stats:[["otázek",r0.n],["správně",ok.length],["průměrná vzácnost",avg?avg.toLocaleString("cs-CZ",{maximumFractionDigits:1,minimumFractionDigits:1})+" / 5":"–"]],
  note:T?`<div class="best">Nejvzácnější odpověď <b style="color:${T.c}">${esc(r0.best.a)}</b></div>`:"",
  body:`<div class="tcap">Vzácnost odpovědí (1 = běžná, 5 = nejvzácnější, ✕ = chyba)</div><div class="chips">${r0.ans.map((v,i)=>chip(i,v?TIERS[v-1].c:"",v||"✕")).join("")}</div>`,
  share:(z,rec)=>{const sq=["⬛","🟩","🟧","🟦","🟪","🟨"];return`🤿 Krillion\n🌊 ${fmt(m)} · ${z}${rec?" · 🏆 nový rekord":""}\n${T?`💎 nejvzácnější: ${r0.best.a}\n`:""}${r0.ans.map(v=>sq[v]).join("")}`}});
 run.o2=0}
/* ---------- společné pro nové režimy ---------- */
let ms=loadModes(localStorage);const saveM=later(()=>saveModes(localStorage,ms),700);
const flushAll=()=>{saveLS.flush();saveM.flush()};addEventListener("pagehide",flushAll);document.addEventListener("visibilitychange",()=>{if(document.hidden)flushAll()});
const HL_T=15,EST_N=10,EST_T=30;
/* časový pruh: zbývající čas z performance.now() (konec = start + limit), kreslí se v requestAnimationFrame přes
   transform: scaleX. Během vyhodnocování (busy) se čas zastaví a konec se posune o dobu pauzy. Smyčka skončí s otázkou. */
let tm=null;
function stopT(){if(tm){cancelAnimationFrame(tm.raf);tm=null}}
function tick(sec,onEnd){stopT();limit=left=sec;const b0=$("bar"),p0=$("prog");if(b0)b0.style.transform="scaleX(1)";if(p0)p0.classList.remove("low","pause");
 const t={raf:0,end:performance.now()+sec*1000,pausedAt:0,prev:performance.now()};tm=t;
 const f=now=>{if(tm!==t)return;const b=$("bar"),p=$("prog");if(!b||!p){stopT();return}
  // aplikace na pozadí (iPhone: přepnutí aplikace, zamčení) – snímky neběží, čas se nepočítá
  if(now-t.prev>400&&!t.pausedAt)t.end+=now-t.prev-17;t.prev=now;
  if(busy){if(!t.pausedAt)t.pausedAt=now}else if(t.pausedAt){t.end+=now-t.pausedAt;t.pausedAt=0}
  if(p.classList.contains("pause")!==busy)p.classList.toggle("pause",busy);
  left=Math.max(0,((t.pausedAt||now)-t.end)/-1000);const sx=(left/limit).toFixed(4);if(sx!==t.sx){t.sx=sx;b.style.transform="scaleX("+sx+")"}
  const low=left<6;if(p.classList.contains("low")!==low)p.classList.toggle("low",low);
  if(left<=0){stopT();onEnd();return}t.raf=requestAnimationFrame(f)};
 t.raf=requestAnimationFrame(f)}
function ouch(){hurt=1;const f=$("flash");f.classList.add("on");setTimeout(()=>f.classList.remove("on"),60);buzz([40,30,40])}
function ascendLater(){const r0=run;setTimeout(()=>{if(run===r0&&S.m==="dive")beginAscent()},700)}
/* ---------- návod při prvním spuštění režimu, nastavení, koncová obrazovka a sdílení ---------- */
const SLIDERS='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/></svg>';
const MODE_START={hl:()=>startHL(),est:()=>startEst(),kr:()=>start()};
const HELP={
 hl:["Vyšší, nebo nižší?","#8ef0c6",["Uvidíš dvě věci a otázku. Ťukni na tu, které je víc – je vyšší, starší, rychlejší…","Správně = hlouběji. Těžší otázka dá víc metrů, každých 6 správných v řadě přidá bonus.","Chyba nebo došlý čas stojí bublinu kyslíku. Máš tři."],MOBILE?"Po odpovědi uvidíš obě skutečné hodnoty i zdroj.":"Na počítači můžeš hrát i šipkami ← → (nebo 1 a 2)."],
 est:["Odhad","#63b6ff",["Deset otázek s číselnou odpovědí, na každou máš 30 sekund.","Čím blíž skutečnosti, tím hlouběji: do ±5 % 1 000 m, dvakrát vedle 500 m, desetkrát vedle 50 m.","Velká čísla napiš jako „1,5 mil“ nebo „2 tis.“, nebo ťukni na tis. / mil. / mld."],"Kyslík tu nedochází – vždy odehraješ všech deset otázek."],
 kr:["Krillion","#ffd36e",["Na každé zadání napiš jednu odpověď, třeba na „Jmenuj evropský stát“.","Čím vzácnější správná odpověď, tím hlouběji: Česko dá pár metrů, Lichtenštejnsko mnohem víc.","Chyba stojí bublinu kyslíku, nejvzácnější odpověď ji vrací. Překlepy a chybějící háčky nevadí."],"Ponor končí, až dojde kyslík."]};
function openMode(k){if(SET.seen[k])MODE_START[k]();else helpCard(k)}
// tlačítko „Ponořit se“ spouští hru přímo v tapnutí → iOS otevře klávesnici (viz launch)
function helpCard(k,back){const[t,c,P,note]=HELP[k];
 swap(`<div class="help" style="--c:${c}"><div class="qn">Jak se hraje</div><h2>${t}</h2><ol>${P.map((x,i)=>`<li style="--i:${i}"><i aria-hidden="true">${i+1}</i><span>${x}</span></li>`).join("")}</ol><p class="hnote">${note}</p>
 <div class="row"><button class="btn" id="hgo" type="button">Ponořit se</button></div><button class="skip" id="hbk" type="button">${back?"Zpět do nastavení":"Jiný režim"}</button></div>`,()=>{
  $("hgo").onclick=()=>{SET.seen[k]=1;saveSet();MODE_START[k]()};$("hbk").onclick=back||home;if(!MOBILE)try{$("hgo").focus({preventScroll:true})}catch(e){}})}
function settings(){syncSnd();const sfx=window.KRILLION_SFX,row=(k,t,d)=>`<button class="sw" type="button" role="switch" aria-checked="${SET[k]}" data-k="${k}"><span><b>${t}</b><small>${d}</small></span><i aria-hidden="true"></i></button>`;
 swap(`<div class="setc"><div class="qn">Krillion</div><h2>Nastavení</h2><div class="sets">
 ${row("anim","Animace","Seskok z lodi, jiskry a přechody karet. Vypnuté = klidnější hra.")}
 ${CANBUZZ?row("vib","Vibrace","Jemné zavibrování po odpovědi."):""}
 ${sfx?row("snd","Zvuky","Šplouchnutí, bubliny a krátké znělky po odpovědi."):""}</div>
 ${OSRM.matches?'<p class="hnote">V systému máš zapnuté omezení pohybu – hra se proto hýbe méně i se zapnutými animacemi.</p>':""}
 <div class="hlp"><span>Jak se hraje</span>${Object.keys(HELP).map(k=>`<button type="button" class="chip" data-h="${k}">${HELP[k][0]}</button>`).join("")}</div>
 <p class="sstat">Odehráno her: vyšší/nižší <b>${ms.hl.runs}</b> · odhad <b>${ms.est.runs}</b> · Krillion <b>${st.runs}</b></p>
 <div class="row"><button class="btn" id="bk" type="button">Hotovo</button></div></div>`,()=>{
  for(const b of card.querySelectorAll(".sw"))b.onclick=()=>{const k=b.dataset.k;SET[k]=!SET[k];if(k==="snd"&&sfx&&sfx.set)sfx.set(SET.snd);saveSet();b.setAttribute("aria-checked",String(SET[k]));if(k==="anim")applyMotion();if(k==="vib"&&SET.vib)buzz(25)};
  for(const b of card.querySelectorAll("[data-h]"))b.onclick=()=>helpCard(b.dataset.h,settings);
  $("bk").onclick=home})}
// adresa hry do sdíleného textu (jen veřejná, ne localhost); bez ?fps a podobných parametrů
const GAME_URL=/^https?:$/.test(location.protocol)&&!/^(localhost|127\.|0\.0\.0\.0|\[::1\]|192\.168\.|10\.)/.test(location.hostname)?location.origin+location.pathname.replace(/index\.html$/,""):"";
function copyText(t){try{const a=document.createElement("textarea");a.value=t;a.setAttribute("readonly","");a.style.cssText="position:fixed;left:-9999px;top:0";document.body.appendChild(a);a.select();const ok=document.execCommand("copy");a.remove();return ok}catch(e){return false}}
// na telefonu nabídka sdílení systému, jinak schránka (a záložní kopírování přes textarea)
function shareBtn(btn,txt){btn.onclick=async()=>{const full=GAME_URL?txt+"\n"+GAME_URL:txt;
 if(navigator.share&&MOBILE){try{await navigator.share({text:full});return}catch(e){if(e&&e.name==="AbortError")return}}
 try{await navigator.clipboard.writeText(full);toast("Výsledek je ve schránce – pošli ho kamarádům")}catch(e){toast(copyText(full)?"Výsledek je ve schránce":"Kopírování nejde")}}}
const pushScore=(o,m)=>{o.scores=(o.scores||[]).concat(Math.round(m)).slice(-20)};
/* koncová karta: výsledek, rekord (nový / kolik chybělo), statistiky, průběh hry, sdílení. o.share(zóna, rekord) vrací text */
function endCard(o){const{m,prev}=o,rec=m>prev&&m>0,z=zoneOf(m),L=o.scores.slice(-10),avg=L.length>1?L.reduce((a,b)=>a+b,0)/L.length:0;
 const badge=rec?`<div class="rec">Nový rekord${prev>0?`<span> · předchozí ${fmt(prev)}</span>`:""}</div>`:prev>0?`<div class="recn">Rekord ${fmt(prev)} · chybělo ${fmt(prev-m)}</div>`:"";
 swap(`<div class="end"><div class="qn">${esc(o.title)}</div><div class="big">${fmt(m)}</div><div class="zone">${esc(z)}</div>${badge}
 <div class="stats">${o.stats.map(([k,v],i)=>`<div style="--i:${i}"><b>${v}</b><small>${k}</small></div>`).join("")}</div>${o.note||""}
 ${o.body}<div class="hist">Hra č. ${o.runs}${avg?` · průměr posledních ${L.length} her ${fmt(avg)}`:""}</div>
 <div class="row"><button class="btn" id="nx" type="button">Ponořit se znovu</button><button class="btn g" id="cp" type="button">Sdílet</button></div><button class="skip" id="md" type="button">Jiný režim</button></div>`,()=>{
  if(rec){burst("#ffd36e",70);buzz([30,50,30,50,90])}
  $("nx").onclick=o.again;$("md").onclick=home;shareBtn($("cp"),o.share(z,rec))});
 ascendLater()}
// čipy průběhu hry: barva = obtížnost nebo vzácnost, ✕ = chyba
const chip=(i,c,t,title)=>`<span style="--i:${i};${c?`background:${c}2e;box-shadow:inset 0 0 0 1.5px ${c};color:#fff`:"background:rgba(0,10,30,.25);color:rgba(255,255,255,.55)"}"${title?` title="${title}"`:""}>${t}</span>`;
const LVC={1:"#8ef0c6",2:"#63b6ff",3:"#c9a8ff",4:"#ffd36e"};
const pct=r=>r<2?`${Math.max(5,Math.round((r-1)*100))} %`:`${fmtR(r)}×`;
// sekundy navíc na přečtení dlouhého zadání: (délka textu − základ) / znaků za sekundu, nejvýš max
const readT=(len,base,per,max)=>Math.min(max,Math.max(0,Math.round((len-base)/per)));
// stupnice odhadu (logaritmická): uprostřed skutečnost, okraje = 1 000× míň / víc; pásma ±25 %, 2×, 10×
function gauge(g,t,c){if(!(g>0))return"";const x=50+Math.max(-1,Math.min(1,Math.log10(g/t)/3))*50;
 return`<div class="gauge" role="img" aria-label="Tvůj tip ${esc(estDiff(g,t))}"><span>1 000× míň</span><span>přesně</span><span>1 000× víc</span><i style="left:${x.toFixed(1)}%;background:${c};box-shadow:0 0 10px ${c}"></i></div>`}
