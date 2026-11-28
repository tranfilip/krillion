// Krillion – Režimy „Vyšší, nebo nižší?“ a „Odhad“ (otázky, odpovědi, konec hry), spuštění hry a napojení zvuků (src/audio.js) a přístupnosti.
// Skripty se načítají v pořadí z index.html a sdílejí horní const/let/function (klasické skripty, bez build kroku).
/* ---------- režim „Vyšší, nebo nižší?“ ---------- */
function startHL(){run={mode:"hl",o2:3,pts:0,n:0,ok:0,res:[],items:new Set(),vc:{},lastV:[],streak:0,bestStreak:0};
 launch(`<div class="prog" id="prog"><i id="bar"></i></div><div class="panel hlq" id="pn"></div><div class="duel" id="duel"></div><div class="hint hln" id="h"></div>`,null,askHL)}
function askHL(){busy=false;advT=null;card.onclick=null;run.n++;const p=pickPair(ms,run);saveM();if(!p){endHL();return}run.p=p;
 const[a,b]=p.side,V=p.q?[p.q]:HLD.V[p.v]||["Čeho je víc?",""],cat=a.c===b.c?a.c:a.c+" × "+b.c;
 const L=hlLvl(run.n);if(run.n>1&&L!==hlLvl(run.n-1))toast(`Obtížnost: ${LVN[L]} · ×${fmtR(HL_MULT[L])} hloubky`);
 const pn=$("pn");pn.className="panel hlq";pn.innerHTML=`<div style="animation:fade .45s both"><div class="qn">#${run.n} · <span class="lvl l${p.lvl}">${LVN[p.lvl]}</span> · ${esc(cat)}</div><div class="q">${esc(V[0])}</div></div>`;
 $("duel").innerHTML=[a,b].map((x,i)=>`<button class="opt" type="button" id="o${i}" style="--i:${i}"><b>${esc(x.n)}</b><span class="val" id="v${i}"></span></button>${i?"":'<span class="vs">nebo</span>'}`).join("");
 $("o0").onclick=()=>pickHL(0);$("o1").onclick=()=>pickHL(1);$("h").textContent="";
 tick(HL_T+readT(V[0].length+a.n.length+b.n.length,50,12,3),()=>pickHL(-1))}
// hodnota se „načítá“ od nuly (krátká animace po odpovědi)
function countUp(el,x){const D=RM?0:750,t0=performance.now(),round=Number.isInteger(x.val)||x.val>=10;
 const f=t=>{const k=D?Math.min(1,Math.max(0,(t-t0)/D)):1,e=1-(1-k)**3,v=k>=1?x.val:round?Math.round(x.val*e):x.val*e;el.textContent=fmtHL(x,v);if(k<1)requestAnimationFrame(f)};requestAnimationFrame(f)}
function pickHL(i){if(busy||!run||run.mode!=="hl")return;busy=true;stopT();
 const{side:[a,b],r}=run.p,w=a.val>b.val?0:1,ok=i===w,W=[a,b][w];
 [a,b].forEach((x,k)=>{const o=$("o"+k);o.disabled=true;o.classList.add(k===w?"ok":k===i?"bad":"dim");countUp($("v"+k),x)});
 const lv=run.p.lvl,mult=HL_MULT[lv];let head;
 if(ok){const m=hlPoints(lv);run.pts+=m;run.ok++;run.streak++;run.bestStreak=Math.max(run.bestStreak,run.streak);const bonus=streakBonus(run.streak);run.pts+=bonus;setDepth(run.pts);
  const line=`${LVN[lv]} ×${fmtR(mult)} · <b>+${fmt(m)}</b> · rozdíl ${pct(r)}`;
  if(bonus){streakFx();o2({hot:1});head=`<div class="tier" style="color:#ffd36e;text-shadow:0 0 40px #ffd36e">Série ${run.streak}! +${fmt(bonus)}</div><div class="sub">Správně · ${line}</div>`}
  else{o2();burst("#8ef0c6",10+lv*6);buzz(12);const k=run.streak,left=6-k%6;
   head=`<div class="tier" style="color:#8ef0c6;text-shadow:0 0 34px #8ef0c688">Správně</div><div class="sub">${line}</div>${k>=2?`<div class="sub s2">Série ${k} · do bonusu ještě ${left} ${left===1?"správná":left<5?"správné":"správných"}</div>`:""}`}}
 else{const lost=run.streak;run.streak=0;run.o2--;o2({i:run.o2,c:"pop"});ouch();const d=$("duel");d.classList.remove("shake");void d.offsetWidth;d.classList.add("shake");
  head=`<div class="tier" style="color:#ffb0a5;text-shadow:0 0 30px #ff7a6a77">${run.o2<=0?"Došel kyslík":i<0?"Došel čas":"−1 kyslík"}</div><div class="sub">${i<0?(run.o2>0?"−1 kyslík · ":"došel čas · "):""}víc má <b>${esc(W.n)}</b> · rozdíl ${pct(r)}${lost>=3?` · série ${lost} skončila`:""}</div>`}
 run.res.push({ok,r,lv});
 const pn=$("pn");pn.className="panel hlq res";pn.innerHTML=`<div>${head}</div>`;
 const notes=run.p.fact?[]:a.note===b.note?[a.note]:[a.note&&`${a.n}: ${a.note}`,b.note&&`${b.n}: ${b.note}`];
 $("h").innerHTML=(run.p.fact?`<div class="fact"><b>Zajímavost:</b> ${esc(run.p.fact)}</div>`:"")+notes.filter(Boolean).map(n=>`<div class="src">${esc(n)}</div>`).join("");
 run.tapAt=performance.now()+450;card.onclick=()=>{if(advT&&performance.now()>run.tapAt)advHL()};
 clearTimeout(advT);advT=setTimeout(advHL,(ok?2500:3000)+(run.p.fact?1800:0))}
function streakFx(){const f=$("flash");f.classList.add("gold","on");setTimeout(()=>f.classList.remove("on"),90);setTimeout(()=>f.classList.remove("gold"),900);
 burst("#ffd36e",MOBILE?50:80);ease=450;let k=0;const t=setInterval(()=>{kick=1;if(++k>8)clearInterval(t)},150);buzz([30,40,30,40,60])}
function advHL(){if(!advT)return;clearTimeout(advT);advT=null;card.onclick=null;if(run.o2<=0)endHL();else askHL()}
function endHL(){stopT();card.onclick=null;stage.classList.remove("play");const h=ms.hl,m=run.pts,prev=h.best;if(m>h.best)h.best=m;h.runs++;pushScore(h,m);saveM();
 const r0=run,okR=r0.res.filter(x=>x.ok).map(x=>x.r),tight=okR.length?Math.min(...okR):0,rs=r0.res.slice(-40),acc=r0.res.length?Math.round(r0.ok/r0.res.length*100):0;
 endCard({title:"Vyšší, nebo nižší? · došel kyslík",m,prev,runs:h.runs,scores:h.scores,again:startHL,
  stats:[["správně",r0.ok],["úspěšnost",acc+" %"],["nejdelší série",r0.bestStreak],["nejtěsnější rozdíl",tight?pct(tight):"–"]],
  body:`<div class="tcap">Odpovědi podle obtížnosti: ${[1,2,3,4].map(l=>`<i class="lg" style="color:${LVC[l]}">●</i> ${LVN[l].toLowerCase()}`).join(" ")} · ✕ chyba</div><div class="chips">${rs.map((x,i)=>chip(i,x.ok?LVC[x.lv]:"",x.ok?"✓":"✕",LVN[x.lv])).join("")}</div>`,
  share:(z,rec)=>{const sq={1:"🟩",2:"🟦",3:"🟪",4:"🟨"};return`🤿 Krillion · Vyšší, nebo nižší?\n🌊 ${fmt(m)} · ${z}${rec?" · 🏆 nový rekord":""}\n✅ ${r0.ok} správně · 🔥 nejdelší série ${r0.bestStreak}\n${rs.map(x=>x.ok?sq[x.lv]:"⬛").join("")}`}})}
addEventListener("keydown",e=>{if(!run||run.mode!=="hl"||!stage.classList.contains("play")||stage.classList.contains("intro")||e.metaKey||e.ctrlKey||e.altKey)return;
 if(advT&&(e.key==="Enter"||e.key===" ")){e.preventDefault();advHL();return}
 const i={ArrowLeft:0,"1":0,ArrowRight:1,"2":1}[e.key];if(i!==undefined&&!busy){e.preventDefault();pickHL(i)}});
/* přístupnost: výsledek odpovědi a nová otázka se čtou čtečce obrazovky (aria-live), na počítači dostane po výměně karty
   fokus první tlačítko (Enter / mezerník hned funguje), šipky nahoru a dolů procházejí karty režimů */
new MutationObserver(()=>{const pn=$("pn");if(pn&&!pn.hasAttribute("aria-live")){pn.setAttribute("aria-live","polite");pn.setAttribute("aria-atomic","true")}
 const d=$("duel");if(d)d.setAttribute("aria-label","Vyber jednu z možností");
 if(MOBILE||stage.classList.contains("play"))return;const a=document.activeElement;if(a&&a!==document.body&&card.contains(a))return;
 const b=card.querySelector(".mode,.btn");if(b)try{b.focus({preventScroll:true})}catch(e){}}).observe(card,{childList:true});
addEventListener("keydown",e=>{if(stage.classList.contains("play")||!(e.key==="ArrowDown"||e.key==="ArrowUp"))return;const m=[...card.querySelectorAll(".mode")],i=m.indexOf(document.activeElement);
 if(i<0)return;e.preventDefault();m[(i+(e.key==="ArrowDown"?1:m.length-1))%m.length].focus()});

/* ---------- režim „Odhad“ ---------- */
const ESTT=[{n:"Přesně!",c:"#ffd36e"},{n:"Skoro!",c:"#8ef0c6"},{n:"Blízko",c:"#63b6ff"},{n:"Daleko",c:"#c9a8ff"},{n:"Úplně vedle",c:"#ffb0a5"},{n:"Bez odpovědi",c:"#ffb0a5"}];
const SHORTU=new Set(["m","km","cm","kg","g","mg","t","l","%","°C","km²","m²","ha","km/h","s","kcal","USD","€","SHU","BTC"]);
const withU=(v,u)=>fmtNum(v)+(u?" "+u:"");
// tip = číslo z inputu × násobitel z tlačítek tis./mil./mld. (na mobilu numerická klávesnice písmena nemá)
const hasWordMul=t=>/\d\s*[.,]?\s*(k|tis|mil|mio|mld|md|miliard|bil)/i.test(t);
const estVal=()=>{const t=$("a").value,v=parseNum(t);return v>0?v*(hasWordMul(t)?1:run.mul||1):NaN};
function estPreview(){const g=estVal(),h=$("h");if(!h||advT)return;h.textContent=g>0&&(g>=1e4||run.mul>1)?"= "+(g>=1e15?fmtNum(g):Math.round(g).toLocaleString("cs-CZ"))+(run.q&&SHORTU.has(run.q.u)?" "+run.q.u:""):""}
function startEst(){run={mode:"est",n:0,pts:0,res:[],qs:new Set(),cats:[],mul:1};
 launch(`<div class="prog" id="prog"><i id="bar"></i></div><div class="panel" id="pn"></div>
 <form class="glass field" id="f" autocomplete="off"><input id="a" inputmode="decimal" placeholder="Tvůj odhad" aria-label="Tvůj odhad" enterkeyhint="send" autocomplete="off" autocorrect="off" spellcheck="false"><span class="unit" id="un"></span><button class="go" id="sb" aria-label="Odeslat">${ARROW}</button></form>
 <div class="mults" id="mu">${[["tis.",1e3],["mil.",1e6],["mld.",1e9]].map(([t,k])=>`<button type="button" data-k="${k}">${t}</button>`).join("")}</div><div class="hint" id="h"></div>`,()=>{
  const a=$("a");$("f").onsubmit=e=>{e.preventDefault();if(advT){advEst();return}submitEst(false)};
  a.addEventListener("input",()=>{if(advT){a.value="";return}estPreview()});
  // tlačítka nesmí vzít inputu fokus, jinak se na telefonu zavře klávesnice
  $("sb").onmousedown=e=>e.preventDefault();
  for(const b of card.querySelectorAll("#mu button")){b.onmousedown=e=>e.preventDefault();b.onclick=()=>{if(advT||busy)return;const k=+b.dataset.k;run.mul=run.mul===k?1:k;if(hasWordMul(a.value))a.value=a.value.replace(/\s*[.,]?\s*(k|tis|mil|mio|mld|md|miliard|bil)\S*\s*$/i,"");
   for(const o of card.querySelectorAll("#mu button"))o.classList.toggle("on",+o.dataset.k===run.mul);estPreview();try{a.focus({preventScroll:true})}catch(e){}}}
  return a},askEst)}
function askEst(){busy=false;advT=null;run.n++;run.mul=1;o2();const q=pickEst(ms,run);saveM();run.q=q;
 const pn=$("pn");pn.className="panel";pn.onclick=null;pn.innerHTML=`<div style="animation:fade .45s both"><div class="qn">${run.n} / ${EST_N} · ${esc(q.c)}</div><div class="q">${esc(q.q)}</div></div>`;
 const a=$("a");a.value="";$("f").classList.remove("dim");$("h").textContent="";$("un").textContent=SHORTU.has(q.u)?q.u:"";$("mu").style.visibility="";
 for(const o of card.querySelectorAll("#mu button"))o.classList.remove("on");
 try{a.focus({preventScroll:true})}catch(e){}
 tick(EST_T+readT(q.q.length,80,10,5),()=>submitEst(true))}
function submitEst(timeout){const a=$("a");if(!a||busy||!run||run.mode!=="est")return;const g=estVal();
 if(!timeout&&!(g>0)){$("h").textContent="Napiš kladné číslo, třeba 1 500, 2,5 tis. nebo 3 mil.";const f=$("f");f.classList.remove("shake");void f.offsetWidth;f.classList.add("shake");try{a.focus({preventScroll:true})}catch(e){}return}
 busy=true;stopT();const q=run.q,s=estScore(g,q.v),T=ESTT[s.k];run.pts+=s.m;run.res.push({q,g,s});
 if(s.m){setDepth(run.pts);burst(T.c,Math.max(4,6+(3-s.k)*12));buzz(s.k<=1?[15,30,15]:12)}else{ouch();const f=$("f");f.classList.remove("shake");void f.offsetWidth;f.classList.add("shake")}
 const pn=$("pn");pn.className="panel res";pn.innerHTML=`<div><div class="tier" style="color:${T.c};text-shadow:0 0 30px ${T.c}77">${T.n}</div>
 <div class="sub">Skutečnost <b>${esc(withU(q.v,q.u))}</b></div>
 <div class="sub">${g>0?`Tvůj tip ${esc(fmtNum(g))} · ${esc(estDiff(g,q.v))}`:"Došel čas"} · <b>+${fmt(s.m)}</b></div>${gauge(g,q.v,T.c)}${q.note?`<div class="src">${esc(q.note)}</div>`:""}</div>`;
 pn.onclick=advEst;$("f").classList.add("dim");$("mu").style.visibility="hidden";$("h").textContent="";
 try{a.focus({preventScroll:true})}catch(e){}
 clearTimeout(advT);advT=setTimeout(advEst,5500)}
function advEst(){if(!advT)return;clearTimeout(advT);advT=null;if(run.n>=EST_N)endEst();else askEst()}
function endEst(){stopT();const a=$("a");a&&a.blur();card.onclick=null;stage.classList.remove("play");const e=ms.est,m=run.pts,prev=e.best;if(m>e.best)e.best=m;e.runs++;pushScore(e,m);saveM();
 const r0=run,ex=r0.res.filter(x=>x.s.k===0).length,good=r0.res.filter(x=>x.s.k<=1).length,ans=r0.res.filter(x=>x.g>0),dev=ans.length?Math.exp(ans.reduce((s,x)=>s+Math.log(x.s.q),0)/ans.length):0;
 endCard({title:"Odhad · ponor dokončen",m,prev,runs:e.runs,scores:e.scores,again:startEst,
  stats:[["přesně (±5 %)",ex],["do ±25 %",good],["průměrná odchylka",dev?(dev<1.05?"pod 5 %":pct(dev)):"–"]],
  body:`<div class="elist">${r0.res.map((x,i)=>{const T=ESTT[x.s.k];return`<div class="er" style="--i:${i}"><span class="eq">${i+1}. ${esc(x.q.q)}</span><b class="em" style="color:${T.c}">+${fmt(x.s.m)}</b><span class="ev">tip <b>${x.g>0?esc(fmtNum(x.g)):"—"}</b> · skutečnost <b>${esc(withU(x.q.v,x.q.u))}</b>${x.g>0?" · "+esc(estDiff(x.g,x.q.v)):""}</span></div>`}).join("")}</div>`,
  share:(z,rec)=>`🤿 Krillion · Odhad\n🌊 ${fmt(m)} · ${z}${rec?" · 🏆 nový rekord":""}\n🎯 přesně ${ex} · do ±25 % ${good}\n${r0.res.map(x=>["🟨","🟩","🟦","🟪","⬛","⬛"][x.s.k]).join("")}`})}
o2();home();
/* ---------- zvuky (src/audio.js): napojení na události hry obalem funkcí – herní logika zůstává beze změny ---------- */
{const A=window.KRILLION_SFX;if(A){const after=(f,g)=>function(...a){const pre={hl:ms.hl.best,est:ms.est.best,kr:st.best,n:run&&run.res?run.res.length:0};const r=f.apply(this,a);try{g(pre,...a)}catch(e){}return r};
 splash=after(splash,(p,x,big)=>A.play(big?"splash":"plop"));
 win=after(win,(p,r)=>A.play(r.tier>=3?"rare":"ok"));
 lose=after(lose,()=>A.play("bad"));
 pickHL=after(pickHL,p=>{if(!run||!run.res||run.res.length===p.n)return;const x=run.res[run.res.length-1];if(!x.ok)A.play("bad");else if(!streakBonus(run.streak))A.play(x.lv>=3?"rare":"ok")});
 streakFx=after(streakFx,()=>A.play("streak"));
 submitEst=after(submitEst,p=>{if(!run||!run.res||run.res.length===p.n)return;const k=run.res[run.res.length-1].s.k;A.play(k<=1?"rare":k<=3?"ok":"bad")});
 setDepth=after(setDepth,(p,m)=>{if(m>0&&Math.random()<.8)A.play("bubble")});
 end=after(end,p=>{if(st.best>p.kr)setTimeout(()=>A.play("record"),400)});
 endHL=after(endHL,p=>{if(ms.hl.best>p.hl)setTimeout(()=>A.play("record"),400)});
 endEst=after(endEst,p=>{if(ms.est.best>p.est)setTimeout(()=>A.play("record"),400)})}}
