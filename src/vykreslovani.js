// Krillion – Rozvržení, vibrace a vykreslování oceánu: živočichové, krajina podle hloubky, potápěč, loď, seskok, smyčka draw.
// Skripty se načítají v pořadí z index.html a sdílejí horní const/let/function (klasické skripty, bez build kroku).
/* ---------- klávesnice a sklo ---------- */
const stage=$("stage"),hud=$("hud"),vv=window.visualViewport;let vTop=0,vH=innerHeight;
/* poloha a výška karty pro kreslení (loď, potápěč): čte se z DOM jen po změně (ResizeObserver / MutationObserver), ne v každém snímku */
const CG={top:150,h:0,play:false,dirty:true};
function geo(){if(CG.dirty){CG.dirty=!window.ResizeObserver;CG.top=card.offsetTop;CG.h=card.offsetHeight;CG.play=stage.classList.contains("play")}return CG}
if(window.ResizeObserver){const dirty=()=>{CG.dirty=true};const ro=new ResizeObserver(dirty);ro.observe(card);ro.observe(stage);const mo=new MutationObserver(dirty);mo.observe(stage,{attributes:true,attributeFilter:["class","style"]});mo.observe(document.body,{attributes:true,attributeFilter:["class"]})}
function fit(){CG.dirty=true;vH=vv?vv.height:innerHeight;vTop=vv?vv.offsetTop:0;stage.style.top=vTop+"px";stage.style.height=vH+"px";hud.style.transform=`translateY(${vTop}px)`;document.body.classList.toggle("kb",!!vv&&innerHeight-vH>140)}
if(vv){vv.addEventListener("resize",fit);vv.addEventListener("scroll",fit)}addEventListener("resize",fit);fit();
addEventListener("scroll",()=>{if(!document.body.classList.contains("kb"))scrollTo(0,0)});
// odlesk skla za myší: nejvýš jednou za snímek a nejdřív všechna měření, pak zápisy (střídání čtení a zápisu nutí prohlížeč přepočítávat layout)
if(!matchMedia("(pointer: coarse)").matches){let pe=null,praf=0;addEventListener("pointermove",e=>{pe=e;if(!praf)praf=requestAnimationFrame(()=>{praf=0;const gs=[...document.querySelectorAll(".glass")],rs=gs.map(g=>g.getBoundingClientRect());
 gs.forEach((g,i)=>{const r=rs[i];if(!r.width||!r.height)return;g.style.setProperty("--mx",((pe.clientX-r.left)/r.width*100).toFixed(1)+"%");g.style.setProperty("--my",((pe.clientY-r.top)/r.height*100).toFixed(1)+"%")})})},{passive:true})}

/* ---------- oceán ---------- */
const cv=$("sea"),cx=cv.getContext("2d");let W=0,H=0;
const dk=document.createElement("canvas"),dx=dk.getContext("2d");
// méně pohybu: systémové omezení pohybu (prefers-reduced-motion) nebo vypnuté animace v nastavení hry
const OSRM=matchMedia("(prefers-reduced-motion: reduce)");let RM=false;
function applyMotion(){RM=OSRM.matches||!SET.anim;document.documentElement.classList.toggle("no-anim",!SET.anim)}
applyMotion();try{OSRM.addEventListener("change",applyMotion)}catch(e){}
const MOBILE=matchMedia("(pointer: coarse)").matches;let SBK=MOBILE?0:1,Q=MOBILE?1:2,frameAvg=16;const Q0=Q;
/* jemné vibrace (podle nastavení): Android přes Vibration API; iPhone (Safari 18+) umí jen krátké ťuknutí přes skrytý
   přepínač – použije se jen tehdy, když není otevřená klávesnice (kliknutí nesmí vzít inputu fokus) */
const IOS=/iP(hone|ad|od)/.test(navigator.userAgent)||navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1;
const HAPT=!navigator.vibrate&&IOS?(()=>{const l=document.createElement("label"),i=document.createElement("input");i.type="checkbox";i.setAttribute("switch","");i.tabIndex=-1;l.setAttribute("aria-hidden","true");l.style.cssText="position:fixed;left:-100px;top:0;width:1px;height:1px;opacity:0;overflow:hidden;pointer-events:none";l.appendChild(i);document.body.appendChild(l);return l})():null;
const CANBUZZ=MOBILE&&!!navigator.vibrate||!!HAPT;
function buzz(p){if(!SET.vib||!CANBUZZ)return;try{if(navigator.vibrate){navigator.vibrate(p);return}const a=document.activeElement;if(!(a&&a.tagName==="INPUT"))HAPT.click()}catch(e){}}
function coolQ(){draw.cool=1;setTimeout(()=>draw.cool=0,3000);rs()}
// gradienty se vytvoří jednou a pak se jen posouvají přes translate (na iPhonu je vytváření gradientů v každém snímku drahé)
let WG=null,WGK="";const GC=new Map();const gcache=(k,f)=>{let g=GC.get(k);if(!g){g=f();GC.set(k,g)}return g};
{const d=Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype,"shadowBlur");Object.defineProperty(cx,"shadowBlur",{get(){return d.get.call(this)},set(v){d.set.call(this,v*SBK)}})}
const BUB=document.createElement("canvas");BUB.width=BUB.height=48;{const b=BUB.getContext("2d"),gg=b.createRadialGradient(17,17,0,24,24,24);gg.addColorStop(0,"rgba(255,255,255,.85)");gg.addColorStop(.7,"rgba(255,255,255,.08)");gg.addColorStop(.92,"rgba(255,255,255,.55)");gg.addColorStop(1,"rgba(255,255,255,0)");b.fillStyle=gg;b.fillRect(0,0,48,48)}
let VIG=null;function vignette(){VIG=document.createElement("canvas");VIG.width=Math.ceil(W/2);VIG.height=Math.ceil(H/2);const v=VIG.getContext("2d"),gg=v.createRadialGradient(W/4,H/5,Math.min(W,H)*.17,W/4,H/4,Math.max(W,H)*.4);gg.addColorStop(0,"rgba(0,6,18,0)");gg.addColorStop(1,"rgba(0,6,18,1)");v.fillStyle=gg;v.fillRect(0,0,W,H)}
function rs(){GC.clear();WGK="";const d=Math.min(devicePixelRatio||1,MOBILE?1.25:2)*(Q<1?.85:1);W=innerWidth;H=innerHeight;cv.width=W*d;cv.height=H*d;cx.setTransform(d,0,0,d,0,0);dk.width=Math.ceil(W/2);dk.height=Math.ceil(H/2);dx.setTransform(.5,0,0,.5,0,0);vignette()}
addEventListener("resize",rs);rs();
const CS=[[0,[96,214,238]],[120,[34,152,200]],[500,[14,88,145]],[1500,[8,44,86]],[4000,[4,17,40]],[7000,[1,4,13]],[12000,[0,2,6]]];
function col(m){for(let i=1;i<CS.length;i++)if(m<=CS[i][0]){const[a,ca]=CS[i-1],[b,cb]=CS[i],t=(m-a)/(b-a);return ca.map((v,k)=>Math.round(v+(cb[k]-v)*t))}return CS.at(-1)[1]}
const rgb=(c,a=1)=>`rgba(${c[0]},${c[1]},${c[2]},${a})`;
// barva vody od horního po dolní okraj: nový gradient jen když se barvy opravdu změní (na místě se nemění vůbec)
function waterG(a,b){const k=a[0]+","+a[1]+","+a[2]+"|"+b[0]+","+b[1]+","+b[2]+"|"+H;if(k!==WGK){WGK=k;WG=cx.createLinearGradient(0,0,0,H);WG.addColorStop(0,rgb(a));WG.addColorStop(1,rgb(b))}return WG}
const snow=Array.from({length:150},(_,i)=>({x:Math.random(),y:Math.random(),r:i<110?Math.random()*1.1+.3:Math.random()*2+1.4,w:Math.random()*6,z:i<110?.5:1.3}));
const glow=Array.from({length:55},()=>({x:Math.random(),y:Math.random(),p:Math.random()*6,c:Math.random()<.5?"#8ff7ff":"#a9ffcf"}));
const bub=[],sparks=[];
// [druh, hloubka, x (0–1), rychlost driftu px/s (0 = vlní se na místě)]
const LIFE=[["school",60,.2,22],["barracuda",130,.75,-30],["turtle",200,.8,-12],["manta",300,.3,16],["school",380,.7,-26],["shark",480,.6,-34],["whale",650,.4,10],["jelly",880,.22,0],["lantern",1150,.6,20],["jelly",1300,.8,0],["hatchet",1700,.3,-14],["squid",2050,.34,0],["vampire",2600,.72,0],["eel",3100,.25,18],["siph",3500,.25,0],["dumbo",3900,.7,0],["angler",4300,.3,0],["lantern",4700,.55,-18],["jelly",5000,.8,0],["angler",5500,.74,0],["snail",6400,.38,8],["dumbo",7000,.25,0],["siph",7400,.7,0],["eel",8200,.6,-16],["jelly",8800,.26,0],["angler",9300,.66,0],["snail",10200,.3,6],["siph",11200,.6,0],["angler",12400,.3,0],["vampire",13300,.7,0],["dumbo",14600,.4,0]];
// další druhy: útesové rybky, hlubinná ryba s průhlednou hlavou, vorvaň, přízračnice, různonožci v příkopu
LIFE.push(["reeffish",70,.16,0],["reeffish",185,.2,0],["barreleye",760,.68,-10],["sperm",1250,.32,14],["chimera",2300,.7,-12],["amphipod",8600,.5,0],["amphipod",10500,.42,0]);
let depth=0,target=0,lastT=0,kick=0,hurt=0,ease=1000,nextBreath=0,dyS=170,tiltV=0;
function px(xf,spd,t,d){if(!spd)return W*xf+Math.sin(t/2800+d)*W*.06;const span=W+520;return((W*xf+spd*t/1000)%span+span)%span-260}
// rybka (hejna, svítilky): hotový sprite pro každou barvu a směr, pak už jen drawImage – žádné cesty a gradienty v každém snímku
const FS=new Map();function fishSpr(a,dir,c1,c2){const k=a+"|"+dir+"|"+c1+"|"+c2;let c=FS.get(k);if(c)return c;const K=3;c=document.createElement("canvas");c.width=32*K;c.height=12*K;const b=c.getContext("2d");b.setTransform(K*dir,0,0,K,16*K,6*K);
 const g=b.createLinearGradient(0,-4,0,4);g.addColorStop(0,c1||`rgba(235,252,255,${a})`);g.addColorStop(1,c2||`rgba(130,185,215,${a*.75})`);b.fillStyle=g;b.beginPath();b.moveTo(11,0);b.quadraticCurveTo(6,-4.5,-4,-3.6);b.quadraticCurveTo(-8,-1.5,-9,0);b.quadraticCurveTo(-8,1.5,-4,3.6);b.quadraticCurveTo(6,4.5,11,0);b.fill();b.beginPath();b.moveTo(-8,0);b.lineTo(-15,-5);b.lineTo(-13,0);b.lineTo(-15,5);b.fill();b.fillStyle=`rgba(255,255,255,${a*.5})`;b.fillRect(-4,-.6,12,.9);b.fillStyle=`rgba(5,20,35,${a})`;b.beginPath();b.arc(7,-1,1,0,7);b.fill();FS.set(k,c);return c}
function fish(x,y,s,a,dir,c1,c2){cx.drawImage(fishSpr(a,dir,c1,c2),x-16*s,y-6*s,32*s,12*s)}
function creature(k,x,y,t,d,lum,dir){
 if(k==="school"){for(let i=0;i<22;i++){const a=i*2.4,r=18+(i*13)%46;fish(x+Math.cos(a+t/2400)*r*1.4,y+Math.sin(a+t/2400)*r*.55+Math.sin(t/500+i)*2,.85+(i%3)*.15,.6,dir)}}
 else if(k==="barracuda"){for(let i=0;i<4;i++){cx.save();cx.translate(x+i*34,y+i*16+Math.sin(t/700+i)*3);cx.scale(dir,1);cx.fillStyle=gcache("baracuda",()=>{const g=cx.createLinearGradient(0,-5,0,5);g.addColorStop(0,"rgba(120,150,170,.85)");g.addColorStop(1,"rgba(220,235,240,.75)");return g});cx.beginPath();cx.moveTo(40,1);cx.lineTo(30,-4);cx.quadraticCurveTo(0,-6,-30,-2);cx.lineTo(-30,2);cx.quadraticCurveTo(0,6,30,4);cx.fill();cx.beginPath();cx.moveTo(-28,0);cx.lineTo(-40,-8);cx.lineTo(-36,0);cx.lineTo(-40,8);cx.fill();cx.fillStyle="rgba(40,60,80,.5)";for(let j=0;j<6;j++)cx.fillRect(-18+j*7,-4,2,4);cx.fillStyle="#0a1520";cx.beginPath();cx.arc(30,-1,1.2,0,7);cx.fill();cx.restore()}}
 else if(k==="turtle"){cx.save();cx.translate(x,y);cx.scale(dir,1);cx.rotate(Math.sin(t/2000)*.06);const f=Math.sin(t/600)*.5;cx.fillStyle="rgba(60,110,95,.85)";cx.save();cx.translate(10,-14);cx.rotate(-.9+f);cx.beginPath();cx.ellipse(0,-10,6,16,0,0,7);cx.fill();cx.restore();cx.save();cx.translate(10,14);cx.rotate(.9-f);cx.beginPath();cx.ellipse(0,10,6,16,0,0,7);cx.fill();cx.restore();cx.beginPath();cx.ellipse(-24,-10,4,8,-.8,0,7);cx.ellipse(-24,10,4,8,.8,0,7);cx.fill();cx.fillStyle=gcache("turtle",()=>{const tg=cx.createRadialGradient(-6,-8,2,0,0,30);tg.addColorStop(0,"rgba(150,190,120,.95)");tg.addColorStop(.6,"rgba(90,130,80,.95)");tg.addColorStop(1,"rgba(50,85,60,.95)");return tg});cx.beginPath();cx.ellipse(0,0,28,20,0,0,7);cx.fill();cx.strokeStyle="rgba(30,50,30,.45)";cx.lineWidth=1.2;cx.beginPath();cx.moveTo(-14,-10);cx.lineTo(-4,-14);cx.lineTo(8,-12);cx.lineTo(16,-4);cx.lineTo(16,4);cx.lineTo(8,12);cx.lineTo(-4,14);cx.lineTo(-14,10);cx.lineTo(-18,0);cx.closePath();cx.moveTo(-4,-14);cx.lineTo(0,0);cx.lineTo(8,-12);cx.moveTo(0,0);cx.lineTo(16,4);cx.moveTo(0,0);cx.lineTo(-4,14);cx.moveTo(0,0);cx.lineTo(-18,0);cx.stroke();cx.fillStyle="rgba(110,150,110,.95)";cx.beginPath();cx.ellipse(34,0,10,7,0,0,7);cx.fill();cx.fillStyle="#102010";cx.beginPath();cx.arc(39,-2.5,1.4,0,7);cx.fill();cx.restore()}
 else if(k==="manta"){cx.save();cx.translate(x,y);cx.scale(dir,1);const f=Math.sin(t/800)*14;cx.fillStyle=gcache("manta",()=>{const mg=cx.createLinearGradient(0,-70,0,70);mg.addColorStop(0,"rgba(16,40,64,.9)");mg.addColorStop(.5,"rgba(30,62,90,.85)");mg.addColorStop(1,"rgba(16,40,64,.9)");return mg});cx.beginPath();cx.moveTo(46,-6);cx.quadraticCurveTo(14,-24-f,-24,-78-f);cx.quadraticCurveTo(-18,-26,-42,0);cx.quadraticCurveTo(-18,26,-24,78+f);cx.quadraticCurveTo(14,24+f,46,6);cx.fill();cx.fillStyle="rgba(16,40,64,.9)";cx.beginPath();cx.ellipse(48,-9,8,3,.5,0,7);cx.ellipse(48,9,8,3,-.5,0,7);cx.fill();cx.strokeStyle="rgba(16,40,64,.8)";cx.lineWidth=1.6;cx.beginPath();cx.moveTo(-42,0);cx.quadraticCurveTo(-80,4,-115,Math.sin(t/500)*7);cx.stroke();cx.fillStyle="rgba(220,240,255,.12)";cx.beginPath();cx.ellipse(6,0,18,10,0,0,7);cx.fill();cx.restore()}
 else if(k==="shark"){cx.save();cx.translate(x,y);cx.scale(dir,1);const sw=Math.sin(t/380)*.14;cx.fillStyle=gcache("shark",()=>{const sg=cx.createLinearGradient(0,-24,0,24);sg.addColorStop(0,"rgba(50,78,100,.95)");sg.addColorStop(.55,"rgba(78,110,135,.92)");sg.addColorStop(.62,"rgba(200,215,225,.9)");sg.addColorStop(1,"rgba(225,235,240,.85)");return sg});cx.beginPath();cx.moveTo(84,4);cx.quadraticCurveTo(70,-16,30,-18);cx.quadraticCurveTo(-30,-14,-70,-3);cx.lineTo(-70,3);cx.quadraticCurveTo(-30,14,30,16);cx.quadraticCurveTo(70,16,84,4);cx.fill();cx.save();cx.translate(-68,0);cx.rotate(sw);cx.fillStyle="rgba(55,82,104,.95)";cx.beginPath();cx.moveTo(4,-2);cx.quadraticCurveTo(-14,-16,-28,-38);cx.quadraticCurveTo(-18,-8,-14,0);cx.quadraticCurveTo(-18,8,-26,24);cx.quadraticCurveTo(-10,10,4,2);cx.fill();cx.restore();cx.fillStyle="rgba(50,78,100,.95)";cx.beginPath();cx.moveTo(16,-16);cx.quadraticCurveTo(4,-34,-10,-50);cx.quadraticCurveTo(-8,-26,-16,-14);cx.fill();cx.beginPath();cx.moveTo(26,10);cx.quadraticCurveTo(10,26,-4,36);cx.quadraticCurveTo(0,20,4,12);cx.fill();cx.strokeStyle="rgba(20,35,50,.5)";cx.lineWidth=1;for(let i=0;i<4;i++){cx.beginPath();cx.moveTo(44-i*5,-8);cx.quadraticCurveTo(42-i*5,-2,44-i*5,4);cx.stroke()}cx.fillStyle="#050a10";cx.beginPath();cx.arc(64,-3,2.3,0,7);cx.fill();cx.fillStyle="rgba(255,255,255,.6)";cx.beginPath();cx.arc(64.7,-3.7,.7,0,7);cx.fill();cx.restore()}
 else if(k==="whale"){cx.save();cx.translate(x,y);cx.scale(dir,1);const tf=Math.sin(t/1100)*8;cx.fillStyle=gcache("whale",()=>{const wg=cx.createLinearGradient(0,-44,0,44);wg.addColorStop(0,"rgba(20,62,98,.8)");wg.addColorStop(.6,"rgba(12,44,76,.8)");wg.addColorStop(1,"rgba(70,110,140,.6)");return wg});cx.beginPath();cx.moveTo(180,6);cx.quadraticCurveTo(170,-36,80,-42);cx.quadraticCurveTo(-60,-40,-170,-6);cx.lineTo(-170,6);cx.quadraticCurveTo(-60,36,80,40);cx.quadraticCurveTo(170,40,180,6);cx.fill();cx.beginPath();cx.moveTo(-165,0);cx.quadraticCurveTo(-200,-10,-238,-44+tf);cx.quadraticCurveTo(-218,-6,-226,0);cx.quadraticCurveTo(-218,6,-240,42+tf);cx.quadraticCurveTo(-200,10,-165,4);cx.fill();cx.beginPath();cx.moveTo(60,30);cx.quadraticCurveTo(30,70,-10,80);cx.quadraticCurveTo(20,50,30,34);cx.fill();cx.strokeStyle="rgba(150,190,215,.18)";cx.lineWidth=1.2;for(let i=0;i<7;i++){cx.beginPath();cx.moveTo(150-i*12,20);cx.quadraticCurveTo(110-i*12,34,60-i*12,36);cx.stroke()}cx.fillStyle="#04101c";cx.beginPath();cx.arc(140,8,3,0,7);cx.fill();cx.restore()}
 else if(k==="jelly"){const p=Math.sin(t/520+d)*.13;cx.save();cx.translate(x,y);cx.shadowBlur=lum?30:8;cx.shadowColor=lum?"#9ff4ff":"rgba(255,255,255,.5)";cx.fillStyle=gcache("jelly"+(lum?1:0),()=>{const jg=cx.createRadialGradient(0,-8,2,0,0,28);jg.addColorStop(0,lum?"rgba(230,255,255,.9)":"rgba(255,255,255,.6)");jg.addColorStop(.6,lum?"rgba(140,230,255,.45)":"rgba(255,255,255,.25)");jg.addColorStop(1,lum?"rgba(120,220,255,.2)":"rgba(255,255,255,.1)");return jg});cx.beginPath();cx.ellipse(0,0,26*(1+p),20*(1-p),0,Math.PI,0);cx.quadraticCurveTo(13,6,0,3);cx.quadraticCurveTo(-13,6,-26*(1+p),0);cx.fill();cx.fillStyle=lum?"rgba(255,180,240,.6)":"rgba(255,200,230,.4)";cx.beginPath();for(let i=0;i<4;i++){const ax=Math.cos(i*1.57)*7,ay=-8+Math.sin(i*1.57)*4;cx.moveTo(ax+3.2,ay);cx.arc(ax,ay,3.2,0,7)}cx.fill();cx.strokeStyle=lum?"rgba(170,240,255,.55)":"rgba(255,255,255,.35)";cx.lineWidth=1.1;cx.beginPath();for(let i=-4;i<=4;i++){cx.moveTo(i*5.5,3);for(let j=1;j<10;j++)cx.lineTo(i*5.5+Math.sin(t/380+j*.7+i)*(3+j*.4),3+j*9)}cx.stroke();cx.lineWidth=3;cx.strokeStyle=lum?"rgba(255,190,240,.35)":"rgba(255,220,240,.25)";cx.beginPath();for(let i=-1;i<=1;i++){cx.moveTo(i*6,3);for(let j=1;j<6;j++)cx.lineTo(i*6+Math.sin(t/500+j+i)*6,3+j*10)}cx.stroke();cx.restore()}
 else if(k==="lantern"){cx.save();for(let i=0;i<18;i++){const a=i*2.4,r=14+(i*11)%40,fx=x+Math.cos(a+t/2600)*r*1.5,fy=y+Math.sin(a+t/2600)*r*.6;fish(fx,fy,.8,.5,dir,"rgba(60,80,110,.8)","rgba(30,40,60,.8)");cx.fillStyle="rgb(140,240,255)";cx.globalAlpha=.5+.5*Math.sin(t/300+i);cx.shadowBlur=10;cx.shadowColor="#8ff7ff";cx.beginPath();for(let j=0;j<3;j++){const lx=fx+dir*(-3+j*4);cx.moveTo(lx+.9,fy+2.6);cx.arc(lx,fy+2.6,.9,0,7)}cx.fill();cx.globalAlpha=1;cx.shadowBlur=0}cx.restore()}
 else if(k==="hatchet"){cx.save();for(let i=0;i<6;i++){const fx=x+(i%3)*40,fy=y+Math.floor(i/3)*34+Math.sin(t/600+i)*4;cx.save();cx.translate(fx,fy);cx.scale(dir,1);cx.fillStyle=gcache("hatchet",()=>{const g=cx.createLinearGradient(0,-10,0,10);g.addColorStop(0,"rgba(190,210,230,.85)");g.addColorStop(1,"rgba(110,140,170,.75)");return g});cx.beginPath();cx.moveTo(10,-6);cx.lineTo(-6,-7);cx.lineTo(-10,0);cx.quadraticCurveTo(-2,14,8,6);cx.closePath();cx.fill();cx.beginPath();cx.moveTo(-9,0);cx.lineTo(-15,-4);cx.lineTo(-15,4);cx.fill();cx.fillStyle="#fff";cx.beginPath();cx.arc(6,-3,2.4,0,7);cx.fill();cx.fillStyle="#000";cx.beginPath();cx.arc(6.4,-3,1.3,0,7);cx.fill();cx.fillStyle="rgba(150,240,255,.85)";cx.shadowBlur=8;cx.shadowColor="#8ff7ff";cx.beginPath();for(let j=0;j<4;j++){cx.moveTo(4.9-j*3,6-j*1.4);cx.arc(4-j*3,6-j*1.4,.9,0,7)}cx.fill();cx.restore()}cx.restore()}
 else if(k==="squid"){cx.save();cx.translate(x,y);cx.rotate(-.5+Math.sin(t/1600)*.12);cx.shadowBlur=18;cx.shadowColor="#ff8a7a";cx.fillStyle=gcache("squid",()=>{const g2=cx.createLinearGradient(-14,0,14,0);g2.addColorStop(0,"rgba(220,90,80,.55)");g2.addColorStop(.5,"rgba(255,160,140,.75)");g2.addColorStop(1,"rgba(220,90,80,.55)");return g2});cx.beginPath();cx.moveTo(0,-56);cx.quadraticCurveTo(20,-12,13,36);cx.lineTo(-13,36);cx.quadraticCurveTo(-20,-12,0,-56);cx.fill();cx.beginPath();cx.moveTo(0,-56);cx.lineTo(16,-38);cx.lineTo(-16,-38);cx.fill();cx.fillStyle="rgba(255,255,255,.7)";cx.beginPath();cx.arc(-7,28,3,0,7);cx.arc(7,28,3,0,7);cx.fill();cx.strokeStyle="rgba(255,150,130,.6)";cx.lineWidth=2.2;cx.lineCap="round";for(let i=-3;i<=3;i++){cx.beginPath();cx.moveTo(i*3,36);cx.quadraticCurveTo(i*6+Math.sin(t/300+i)*7,64,i*5+Math.sin(t/400+i)*4,88);cx.stroke()}cx.lineWidth=1.4;for(const s of[-1,1]){cx.beginPath();cx.moveTo(s*4,36);cx.bezierCurveTo(s*14,80,s*4+Math.sin(t/350)*10,110,s*16,128);cx.stroke()}cx.restore()}
 else if(k==="vampire"){cx.save();cx.translate(x,y);const p=Math.sin(t/900);cx.shadowBlur=14;cx.shadowColor="#5ff";cx.fillStyle=gcache("vampire",()=>{const vg=cx.createRadialGradient(0,-6,2,0,0,40);vg.addColorStop(0,"rgba(150,40,50,.85)");vg.addColorStop(1,"rgba(70,10,20,.8)");return vg});cx.beginPath();cx.ellipse(0,-14,14,18,0,0,7);cx.fill();cx.beginPath();cx.moveTo(-12,-2);for(let i=0;i<=8;i++){const a=Math.PI*(i/8),r=34+p*8+(i%2)*6;cx.lineTo(Math.cos(a)*r*-1,Math.sin(a)*r*.7+4)}cx.lineTo(12,-2);cx.fill();cx.beginPath();cx.ellipse(-12,-28,6,3,-.6,0,7);cx.ellipse(12,-28,6,3,.6,0,7);cx.fill();cx.fillStyle="rgba(120,255,255,.9)";cx.beginPath();cx.arc(-6,-14,2.4,0,7);cx.arc(6,-14,2.4,0,7);cx.fill();cx.restore()}
 else if(k==="eel"){cx.save();cx.translate(x,y);cx.scale(dir,1);cx.strokeStyle="rgba(15,15,22,.9)";cx.lineCap="round";for(let w=6;w>0;w-=2){cx.lineWidth=w;cx.beginPath();for(let i=0;i<=30;i++){const xx=-i*7,yy=Math.sin(t/300-i*.35)*(4+i*.5);i?cx.lineTo(xx,yy):cx.moveTo(xx,yy)}cx.stroke()}cx.fillStyle="rgba(20,18,28,.95)";cx.beginPath();cx.moveTo(0,0);cx.quadraticCurveTo(22,-22,34,-6);cx.lineTo(4,2);cx.quadraticCurveTo(24,24,34,10);cx.lineTo(4,4);cx.fill();const tx=-210,ty=Math.sin(t/300-30*.35)*19;cx.fillStyle=`rgba(255,120,190,${.6+.4*Math.sin(t/250)})`;cx.shadowBlur=14;cx.shadowColor="#ff7ac8";cx.beginPath();cx.arc(tx,ty,3,0,7);cx.fill();cx.restore()}
 else if(k==="siph"){cx.save();cx.shadowBlur=16;cx.shadowColor="#8ff7ff";for(let i=0;i<26;i++){const ppx=x+Math.sin(t/900+i*.35)*30+i*9,ppy=y+Math.sin(i*.5+t/1100)*14;cx.fillStyle=`rgba(160,250,255,${.25+.45*Math.max(0,Math.sin(t/300-i*.4))})`;cx.beginPath();cx.arc(ppx,ppy,2.4,0,7);cx.fill();if(i%3===0){cx.strokeStyle="rgba(160,250,255,.18)";cx.lineWidth=.8;cx.beginPath();cx.moveTo(ppx,ppy);cx.lineTo(ppx+Math.sin(t/400+i)*5,ppy+26);cx.stroke()}}cx.restore()}
 else if(k==="dumbo"){cx.save();cx.translate(x,y+Math.sin(t/900)*8);const e=Math.sin(t/350)*.5;cx.fillStyle=gcache("dumbo",()=>{const dg=cx.createRadialGradient(-4,-8,2,0,0,26);dg.addColorStop(0,"rgba(255,200,190,.9)");dg.addColorStop(1,"rgba(220,120,120,.8)");return dg});cx.save();cx.translate(-16,-10);cx.rotate(-.6+e);cx.beginPath();cx.ellipse(0,0,10,5,0,0,7);cx.fill();cx.restore();cx.save();cx.translate(16,-10);cx.rotate(.6-e);cx.beginPath();cx.ellipse(0,0,10,5,0,0,7);cx.fill();cx.restore();cx.beginPath();cx.ellipse(0,-4,17,15,0,0,7);cx.fill();cx.beginPath();cx.moveTo(-16,2);for(let i=0;i<=8;i++){const xx=-16+i*4;cx.lineTo(xx,14+Math.sin(t/300+i)*3+(i%2)*4)}cx.lineTo(16,2);cx.fill();cx.fillStyle="#2a0a0a";cx.beginPath();cx.arc(-6,-4,2.2,0,7);cx.arc(6,-4,2.2,0,7);cx.fill();cx.restore()}
 else if(k==="angler"){cx.save();cx.translate(x,y);cx.scale(dir||1,1);cx.fillStyle=gcache("angler",()=>{const ag=cx.createRadialGradient(6,-6,4,0,0,40);ag.addColorStop(0,"rgba(50,44,58,.95)");ag.addColorStop(1,"rgba(8,8,12,.92)");return ag});cx.beginPath();cx.moveTo(36,6);cx.quadraticCurveTo(34,-26,0,-26);cx.quadraticCurveTo(-30,-22,-34,0);cx.quadraticCurveTo(-30,22,0,24);cx.quadraticCurveTo(26,24,36,10);cx.fill();cx.beginPath();cx.moveTo(-30,0);cx.lineTo(-56,-18);cx.quadraticCurveTo(-48,0,-56,18);cx.fill();cx.fillStyle="rgba(12,10,16,.95)";cx.beginPath();cx.moveTo(36,6);cx.lineTo(10,10);cx.lineTo(34,14);cx.fill();cx.strokeStyle="rgba(240,240,230,.75)";cx.lineWidth=1.1;for(let i=0;i<6;i++){cx.beginPath();cx.moveTo(14+i*3.6,7);cx.lineTo(15+i*3.6,1);cx.moveTo(14+i*3.6,11);cx.lineTo(15+i*3.6,16);cx.stroke()}cx.fillStyle="rgba(200,220,255,.35)";cx.beginPath();cx.arc(16,-8,3.4,0,7);cx.fill();cx.strokeStyle="rgba(255,255,255,.25)";cx.beginPath();cx.moveTo(14,-22);cx.quadraticCurveTo(30,-56,52,-38);cx.stroke();cx.restore()}
 else if(k==="snail"){cx.save();cx.translate(x,y);cx.scale(dir||1,1);cx.fillStyle=gcache("snail",()=>{const sg=cx.createLinearGradient(0,-12,0,12);sg.addColorStop(0,"rgba(255,230,240,.5)");sg.addColorStop(1,"rgba(230,180,200,.35)");return sg});cx.beginPath();cx.ellipse(0,0,32,12,0,0,7);cx.fill();cx.beginPath();cx.moveTo(-28,-3);cx.quadraticCurveTo(-58,-6+Math.sin(t/420)*7,-76,0);cx.quadraticCurveTo(-58,6,-28,5);cx.fill();cx.fillStyle="rgba(20,0,10,.6)";cx.beginPath();cx.arc(20,-3,2,0,7);cx.fill();cx.restore()}}
function lure(x,y,t,dir){const lx=x+(dir||1)*52,gl=.65+Math.sin(t/280)*.35;cx.save();cx.shadowBlur=36;cx.shadowColor="#ffd36e";cx.fillStyle=`rgba(255,228,150,${gl})`;cx.beginPath();cx.arc(lx,y-38,5,0,7);cx.fill();cx.globalAlpha=gl*.15;cx.beginPath();cx.arc(lx,y-38,30,0,7);cx.fill();cx.restore()}
/* ---------- další živočichové (bez úprav původní funkce creature: neznámé druhy obslouží CR2) ---------- */
// barevné rybky útesu: sprite pro každou barvu a směr, pak jen drawImage
const TFS=new Map();function tinySpr(c,dir){const k=c+dir;let s=TFS.get(k);if(s)return s;s=document.createElement("canvas");s.width=60;s.height=30;const b=s.getContext("2d");b.setTransform(3*dir,0,0,3,30,15);
 b.fillStyle=c;b.beginPath();b.moveTo(7,0);b.quadraticCurveTo(3,-4.5,-3,-3.2);b.quadraticCurveTo(-6,-1,-6,0);b.quadraticCurveTo(-6,1,-3,3.2);b.quadraticCurveTo(3,4.5,7,0);b.fill();
 b.beginPath();b.moveTo(-5,0);b.lineTo(-9.5,-3.6);b.lineTo(-9.5,3.6);b.fill();b.fillStyle="rgba(255,255,255,.55)";b.fillRect(-1,-3.2,1.3,6.4);b.fillStyle="#0a1520";b.beginPath();b.arc(4.2,-.8,.8,0,7);b.fill();TFS.set(k,s);return s}
const REEFC=["#ffb347","#5fd0ff","#ff7aa8","#ffe066","#8ef0c6"];
const CR2={
 // hejnko barevných útesových ryb, které kličkuje u korálů
 reeffish(x,y,t,d,lum,dir){if(S.m!=="dive"&&S.m!=="roll")return;for(let i=0;i<11;i++){const a=i*1.9+t/1700,r=10+(i*17)%34,fx=x+Math.cos(a)*r*1.3,fy=y+Math.sin(a*1.3)*r*.5,dr=Math.cos(a)>0?-1:1;cx.drawImage(tinySpr(REEFC[i%5],dr),fx-10,fy-5,20,10)}},
 // hlubinná ryba s průhlednou hlavou (Macropinna): zelené oči uvnitř skleněné kopule
 barreleye(x,y,t,d,lum,dir){cx.save();cx.translate(x,y+Math.sin(t/900)*4);cx.scale(dir,1);cx.fillStyle="rgba(70,80,95,.92)";cx.beginPath();cx.moveTo(14,2);cx.quadraticCurveTo(8,-7,-10,-5);cx.quadraticCurveTo(-18,-1,-22,0);cx.quadraticCurveTo(-18,4,-10,6);cx.quadraticCurveTo(6,9,14,2);cx.fill();
  cx.beginPath();cx.moveTo(-20,0);cx.lineTo(-30,-7+Math.sin(t/300)*2);cx.lineTo(-27,0);cx.lineTo(-30,7+Math.sin(t/300)*2);cx.fill();
  cx.fillStyle="rgba(200,240,255,.16)";cx.strokeStyle="rgba(210,245,255,.45)";cx.lineWidth=1;cx.beginPath();cx.ellipse(6,-7,10,7,0,Math.PI,0);cx.closePath();cx.fill();cx.stroke();
  cx.fillStyle="#7dff9a";cx.beginPath();cx.arc(5,-8,2.4,0,7);cx.arc(9,-8,2.4,0,7);cx.fill();cx.fillStyle="rgba(140,90,70,.8)";cx.fillRect(-2,4,9,3);cx.restore()},
 // vorvaň: hranatá hlava, vrásčitá kůže; loví v hloubce kolem 1 000 m
 sperm(x,y,t,d,lum,dir){cx.save();cx.translate(x,y);cx.scale(dir,1);cx.rotate(.12+Math.sin(t/2600)*.03);const tf=Math.sin(t/1200)*9;
  cx.fillStyle=gcache2("sperm",()=>{const g=cx.createLinearGradient(0,-40,0,40);g.addColorStop(0,"rgba(58,62,72,.95)");g.addColorStop(.6,"rgba(40,44,52,.95)");g.addColorStop(1,"rgba(80,86,96,.85)");return g});
  cx.beginPath();cx.moveTo(150,-30);cx.quadraticCurveTo(160,-31,160,-14);cx.lineTo(158,18);cx.quadraticCurveTo(150,34,110,30);cx.quadraticCurveTo(10,30,-90,12);cx.quadraticCurveTo(-140,4,-170,2);cx.lineTo(-170,-4);cx.quadraticCurveTo(-120,-16,-60,-26);cx.quadraticCurveTo(40,-38,150,-30);cx.fill();
  cx.beginPath();cx.moveTo(-166,0);cx.quadraticCurveTo(-188,-8,-214,-30+tf);cx.quadraticCurveTo(-200,-4,-206,0);cx.quadraticCurveTo(-200,4,-216,28+tf);cx.quadraticCurveTo(-188,8,-166,3);cx.fill();
  cx.beginPath();cx.moveTo(70,20);cx.quadraticCurveTo(52,44,30,46);cx.quadraticCurveTo(46,30,50,22);cx.fill();
  cx.strokeStyle="rgba(150,160,175,.18)";cx.lineWidth=1.2;cx.beginPath();for(let i=0;i<9;i++){const xx=40-i*22;cx.moveTo(xx,-24+i*.8);cx.quadraticCurveTo(xx-6,-4,xx+2,14-i*.6)}cx.stroke();
  cx.strokeStyle="rgba(15,18,22,.55)";cx.lineWidth=1.6;cx.beginPath();cx.moveTo(156,16);cx.quadraticCurveTo(120,22,92,20);cx.stroke();
  cx.fillStyle="#0b0d10";cx.beginPath();cx.arc(104,6,2.6,0,7);cx.fill();cx.restore()},
 // přízračnice (chiméra): stříbrná „duchová“ ryba s velkýma očima a bičovitým ocasem
 chimera(x,y,t,d,lum,dir){cx.save();cx.translate(x,y+Math.sin(t/1100)*5);cx.scale(dir,1);const w=Math.sin(t/420);
  cx.fillStyle="rgba(196,206,218,.85)";cx.beginPath();cx.moveTo(34,0);cx.quadraticCurveTo(30,-12,10,-10);cx.quadraticCurveTo(-20,-7,-40,-1);cx.lineTo(-40,2);cx.quadraticCurveTo(-10,8,12,9);cx.quadraticCurveTo(30,9,34,0);cx.fill();
  cx.beginPath();cx.moveTo(8,4);cx.quadraticCurveTo(-4,22+w*4,-22,26+w*5);cx.quadraticCurveTo(-8,12,-4,5);cx.fill();cx.beginPath();cx.moveTo(4,-9);cx.lineTo(-2,-22);cx.lineTo(-8,-8);cx.fill();
  cx.strokeStyle="rgba(196,206,218,.7)";cx.lineWidth=1.6;cx.beginPath();cx.moveTo(-40,0);cx.quadraticCurveTo(-60,4*w,-82,-2*w);cx.quadraticCurveTo(-96,-5*w,-108,2);cx.stroke();
  cx.fillStyle="#e9fbff";cx.beginPath();cx.arc(22,-3,4.2,0,7);cx.fill();cx.fillStyle="#0b1622";cx.beginPath();cx.arc(23,-3,2.6,0,7);cx.fill();cx.restore()},
 // trojnožka (tripod fish): stojí na dně na třech dlouhých ploutvích a čeká na potravu
 tripod(x,y,t,d,lum,dir){cx.save();cx.translate(x,y);cx.scale(dir,1);cx.strokeStyle="rgba(200,190,170,.7)";cx.lineWidth=1.1;cx.beginPath();cx.moveTo(4,0);cx.lineTo(8,26);cx.moveTo(-2,1);cx.lineTo(-5,26);cx.moveTo(-14,0);cx.lineTo(-24,25);cx.moveTo(14,-3);cx.lineTo(30,-16);cx.moveTo(12,-3);cx.lineTo(26,-22);cx.stroke();
  cx.fillStyle="rgba(150,140,125,.92)";cx.beginPath();cx.moveTo(16,-2);cx.quadraticCurveTo(10,-8,-6,-5);cx.quadraticCurveTo(-18,-3,-28,-1);cx.lineTo(-28,1);cx.quadraticCurveTo(-12,4,4,3);cx.quadraticCurveTo(14,3,16,-2);cx.fill();cx.fillStyle="#1a1410";cx.beginPath();cx.arc(11,-3,1.2,0,7);cx.fill();cx.restore()},
 // sumýš (mořská okurka) na dně
 cuke(x,y,t,d,lum,dir){cx.save();cx.translate(x,y);const p=Math.sin(t/1400+d)*.06;cx.fillStyle="rgba(235,140,170,.6)";cx.beginPath();cx.ellipse(0,0,22*(1+p),8*(1-p),0,0,7);cx.fill();
  cx.fillStyle="rgba(255,190,210,.55)";cx.beginPath();for(let i=0;i<6;i++){const xx=-15+i*6;cx.moveTo(xx+2,-7);cx.arc(xx,-7-Math.sin(t/500+i)*1.5,2,0,7)}cx.fill();cx.restore()},
 // roj hadalních různonožců (drobní korýši v nejhlubších příkopech)
 amphipod(x,y,t,d,lum,dir){cx.fillStyle="rgba(240,225,200,.75)";cx.beginPath();for(let i=0;i<26;i++){const a=i*2.39+t/(900+(i%5)*120),r=8+(i*13)%60,fx=x+Math.cos(a)*r*1.4,fy=y+Math.sin(a*1.1)*r*.7;cx.moveTo(fx+2.2,fy);cx.ellipse(fx,fy,2.2,1.1,a,0,7)}cx.fill()}};
const gcache2=(k,f)=>{const m=gcache2.m||(gcache2.m=new Map());let g=m.get(k);if(!g){g=f();m.set(k,g)}return g};
{const base=creature;creature=function(k,x,y,t,d,lum,dir){const f=CR2[k];if(f)f(x,y,t,d,lum,dir);else base(k,x,y,t,d,lum,dir)}}

/* ---------- krajina podle hloubky (kreslí se za živočichy): korálový útes, šelf s vrakem, hydrotermální průduchy,
   vrak zaoceánské lodi, propastná pláň a hadalský příkop. Statické části jsou předkreslené sprity, v každém snímku
   se jen posouvají; zdi příkopu jsou jeden polygon na stranu. ---------- */
let SCN=null;const SCNK={k:""};
const srand=s=>()=>((s=(s*16807)%2147483647)/2147483647);
function sceneSprites(){const k=W+"x"+H;if(SCNK.k===k)return SCN;SCNK.k=k;const mp=H/900,rnd=srand(7);
 const mk=(w,h,f)=>{const c=document.createElement("canvas");c.width=Math.ceil(w);c.height=Math.ceil(h);f(c.getContext("2d"),c.width,c.height);return c};
 // útes vlevo: 20–270 m
 const RW=Math.min(270,W*.46),RH=250*mp;
 const reef=mk(RW,RH,(b,w,h)=>{const g=b.createLinearGradient(0,0,w,0);g.addColorStop(0,"rgba(10,40,62,.95)");g.addColorStop(1,"rgba(22,78,100,.9)");b.fillStyle=g;
  b.beginPath();b.moveTo(0,0);for(let i=0;i<=24;i++){const yy=h*i/24,bulge=Math.sin(i*.55)*.18+Math.sin(i*1.7)*.06,xx=w*(.28+.5*Math.sin(Math.PI*i/24)+bulge*(.4+i/40));b.lineTo(Math.max(6,Math.min(w-4,xx)),yy)}b.lineTo(0,h);b.closePath();b.fill();
  // korály a houby po okraji útesu
  for(let i=1;i<24;i++){const yy=h*i/24,edge=w*(.28+.5*Math.sin(Math.PI*i/24)+(Math.sin(i*.55)*.18+Math.sin(i*1.7)*.06)*(.4+i/40)),ex=Math.max(10,Math.min(w-8,edge))-6,kind=i%4,fade=1-i/30;
   if(kind===0){b.strokeStyle=`rgba(255,${140+(i*9)%60},120,${.8*fade})`;b.lineWidth=2.2;b.lineCap="round";b.beginPath();for(let j=0;j<5;j++){const a=-Math.PI/2+(j-2)*.42;b.moveTo(ex,yy);const mx=ex+Math.cos(a)*9,my=yy+Math.sin(a)*9;b.lineTo(mx,my);b.lineTo(mx+Math.cos(a-.4)*6,my+Math.sin(a-.4)*6);b.moveTo(mx,my);b.lineTo(mx+Math.cos(a+.4)*6,my+Math.sin(a+.4)*6)}b.stroke()}
   else if(kind===1){b.fillStyle=`rgba(230,190,120,${.85*fade})`;b.beginPath();b.ellipse(ex,yy,9,6.5,0,0,7);b.fill();b.strokeStyle=`rgba(150,110,60,${.6*fade})`;b.lineWidth=1;b.beginPath();for(let j=-2;j<=2;j++){b.moveTo(ex-7,yy+j*2.2);b.quadraticCurveTo(ex,yy+j*2.2-2,ex+7,yy+j*2.2)}b.stroke()}
   else if(kind===2){b.strokeStyle=`rgba(190,120,230,${.7*fade})`;b.lineWidth=1;b.beginPath();for(let j=0;j<9;j++){const a=-Math.PI/2+(j-4)*.17;b.moveTo(ex,yy);b.lineTo(ex+Math.cos(a)*18,yy+Math.sin(a)*18)}b.stroke();b.beginPath();b.arc(ex,yy,18,-Math.PI/2-.7,-Math.PI/2+.7);b.stroke()}
   else{b.fillStyle=`rgba(255,220,90,${.75*fade})`;for(let j=0;j<3;j++){b.beginPath();b.roundRect(ex-6+j*5,yy-10-j*3,4,10+j*3,2);b.fill()}}}
  // světlé skvrny od slunce (kaustika) na horní části útesu
  b.globalCompositeOperation="source-atop";const lg=b.createLinearGradient(0,0,0,h);lg.addColorStop(0,"rgba(180,240,255,.25)");lg.addColorStop(.5,"rgba(120,200,240,.05)");lg.addColorStop(1,"rgba(0,20,40,.4)");b.fillStyle=lg;b.fillRect(0,0,w,h)});
 // šelf s vrakem malé lodi vpravo: 240–420 m
 const SW=Math.min(330,W*.52),SH=180*mp;
 const shelf=mk(SW,SH,(b,w,h)=>{const top=h*.28;b.fillStyle="rgba(14,52,80,.92)";b.beginPath();b.moveTo(w,top-6);for(let i=0;i<=16;i++){const xx=w-w*i/16,yy=top+Math.sin(i*1.3)*3+(i>12?(i-12)*h*.05:0);b.lineTo(xx,yy)}b.lineTo(w*.02,h);b.lineTo(w,h);b.closePath();b.fill();
  b.fillStyle="rgba(150,170,160,.35)";b.fillRect(w*.2,top-2,w*.8,3);
  // vrak: nakloněný trup, zlomený stěžeň, okénka
  b.save();b.translate(w*.6,top-8);b.rotate(-.16);b.fillStyle="rgba(40,58,68,.95)";b.beginPath();b.moveTo(-w*.28,0);b.lineTo(w*.26,0);b.quadraticCurveTo(w*.33,-2,w*.35,-14);b.lineTo(w*.2,-18);b.lineTo(-w*.24,-16);b.quadraticCurveTo(-w*.3,-10,-w*.28,0);b.fill();
  b.fillStyle="rgba(60,80,90,.95)";b.fillRect(-w*.1,-28,w*.16,12);b.strokeStyle="rgba(60,80,90,.95)";b.lineWidth=3;b.beginPath();b.moveTo(w*.12,-18);b.lineTo(w*.17,-52);b.lineTo(w*.22,-46);b.stroke();
  b.fillStyle="rgba(0,10,20,.7)";for(let j=0;j<5;j++){b.beginPath();b.arc(-w*.18+j*w*.08,-9,2.2,0,7);b.fill()}
  b.strokeStyle="rgba(140,110,80,.55)";b.lineWidth=1;b.beginPath();b.moveTo(-w*.28,-2);b.lineTo(w*.26,-2);b.stroke();b.fillStyle="rgba(120,170,120,.5)";for(let j=0;j<7;j++){b.beginPath();b.ellipse(-w*.25+j*w*.08,-16+Math.sin(j)*2,3,1.6,0,0,7);b.fill()}b.restore()});
 // hydrotermální průduchy vlevo: 2 450–2 650 m
 const VW=Math.min(230,W*.42),VH=200*mp;
 const vents=mk(VW,VH,(b,w,h)=>{b.fillStyle="rgba(22,24,30,.96)";b.beginPath();b.moveTo(0,h*.35);b.quadraticCurveTo(w*.5,h*.38,w*.9,h*.7);b.lineTo(w,h);b.lineTo(0,h);b.closePath();b.fill();
  for(const[cxp,ch,cw]of[[.22,.34,10],[.42,.24,8],[.6,.17,7]]){const bx=w*cxp,by=h*(.38+cxp*.42);b.fillStyle="rgba(34,30,32,.98)";b.beginPath();b.moveTo(bx-cw,by);b.lineTo(bx-cw*.45,by-h*ch);b.lineTo(bx+cw*.45,by-h*ch);b.lineTo(bx+cw,by);b.fill();
   b.fillStyle="rgba(200,120,60,.4)";b.fillRect(bx-cw*.45,by-h*ch,cw*.9,2);
   for(let j=0;j<6;j++){const tx=bx-cw-8+j*6+(j>2?cw*2:0),tl=8+((j*7)%9);b.strokeStyle="rgba(235,235,225,.85)";b.lineWidth=2;b.beginPath();b.moveTo(tx,by);b.lineTo(tx+Math.sin(j)*2,by-tl);b.stroke();b.fillStyle="#e0303a";b.beginPath();b.ellipse(tx+Math.sin(j)*2,by-tl-2,2.2,3.2,0,0,7);b.fill()}}});
 // vrak zaoceánské lodi vpravo: 3 740–3 860 m (příď zabořená do sedimentu)
 const LW=Math.min(380,W*.6),LH=150*mp;
 const liner=mk(LW,LH,(b,w,h)=>{const top=h*.62;b.fillStyle="rgba(30,30,34,.96)";b.beginPath();b.moveTo(0,top+10);b.quadraticCurveTo(w*.5,top-6,w,top);b.lineTo(w,h);b.lineTo(0,h);b.closePath();b.fill();
  b.save();b.translate(w*.12,top+4);b.rotate(-.05);b.fillStyle="rgba(46,42,40,.97)";b.beginPath();b.moveTo(0,0);b.lineTo(w*.08,-h*.38);b.lineTo(w*.9,-h*.42);b.lineTo(w*.92,-h*.05);b.lineTo(w*.9,6);b.closePath();b.fill();
  b.fillStyle="rgba(120,60,40,.55)";b.fillRect(w*.1,-h*.12,w*.8,h*.05);
  b.fillStyle="rgba(10,10,12,.8)";for(let j=0;j<16;j++){b.beginPath();b.arc(w*.16+j*w*.045,-h*.24,1.8,0,7);b.fill()}
  b.fillStyle="rgba(46,42,40,.97)";b.fillRect(w*.35,-h*.56,w*.2,h*.15);b.strokeStyle="rgba(150,90,50,.5)";b.lineWidth=1;b.beginPath();b.moveTo(w*.08,-h*.38);b.lineTo(w*.04,-h*.66);b.stroke();
  b.fillStyle="rgba(170,90,50,.45)";for(let j=0;j<22;j++){const xx=w*(.1+((j*37)%80)/100),yy=-h*(.05+((j*13)%30)/100);b.beginPath();b.moveTo(xx,yy);b.lineTo(xx+1.5,yy+6+(j%4)*2);b.lineTo(xx+3,yy);b.fill()}b.restore()});
 SCN={reef,shelf,vents,liner,RW,SW,VW,LW};return SCN}
// zdi příkopu: deterministický profil (součet sinů), šířka mezery se s hloubkou zužuje
const TOP_PLAIN=5980,trenchGap=d=>W*Math.max(.34,.62-(d-6000)/5000*.28);
const wallNoise=(d,s)=>Math.sin(d/90+s*3)*14+Math.sin(d/230+s)*22+Math.sin(d/37+s*7)*5;
let WG2=null,WG2K="";
const ZB=[[200,"Soumraková zóna"],[1000,"Půlnoční zóna"],[4000,"Propastná zóna"],[6000,"Hadalská zóna"],[11000,"Hlouběji než Mariánský příkop"]];
let toldWreck=false;
function scenery(t,yOf,sY){const mp=H/900,vis=(a,b)=>yOf(b)>-40&&yOf(a)<H+40,S2=sceneSprites();
 const under=y=>y>sY+6; // nic se nekreslí nad hladinou
 // korálový útes s chaluhami
 const diving=S.m==="dive"||S.m==="roll"; // u lodi (úvod, konec) se útes nekreslí – za kartou by rušil čitelnost textu
 if(diving&&vis(20,270)){const y0=yOf(20);if(under(y0+S2.reef.height))cx.drawImage(S2.reef,0,y0);
  cx.strokeStyle="rgba(90,170,90,.55)";cx.lineWidth=3;cx.lineCap="round";cx.beginPath();for(let i=0;i<5;i++){const by=yOf(120+i*28),bx=S2.RW*(.55+.12*Math.sin(i*2.1)),hgt=60+i*9;if(by<sY+hgt)continue;cx.moveTo(bx,by);
   const sw=Math.sin(t/1300+i*1.3)*10;cx.bezierCurveTo(bx+sw*.4,by-hgt*.35,bx-sw,by-hgt*.65,bx+sw,by-hgt)}cx.stroke()}
 // šelf a vrak malé lodi
 if(diving&&vis(240,420)){const y0=yOf(240);cx.drawImage(S2.shelf,W-S2.SW,y0)}
 // hydrotermální průduchy a černý kouř
 if(vis(2450,2650)){const y0=yOf(2450),vh=S2.vents.height;cx.drawImage(S2.vents,0,y0);cx.fillStyle="rgba(20,20,24,.35)";cx.beginPath();
  for(const[cxp,ch]of[[.22,.34],[.42,.24],[.6,.17]]){const bx=S2.VW*cxp,by=y0+vh*(.38+cxp*.42)-vh*ch;for(let j=0;j<6;j++){const k=((t/2600+j/6+cxp)%1),r=4+k*16,yy=by-k*vh*.55,xx=bx+Math.sin(t/900+j*2)*k*12+k*8;cx.moveTo(xx+r,yy);cx.arc(xx,yy,r,0,7)}}cx.fill()}
 // vrak zaoceánské lodi
 if(vis(3740,3860)){const y0=yOf(3740);cx.drawImage(S2.liner,W-S2.LW,y0);
  if(!toldWreck&&S.m==="dive"&&depth>3700&&depth<3900&&target>depth){toldWreck=true;toast("V téhle hloubce (3 800 m) leží vrak Titanicu")}}
 if(depth<3000)toldWreck=false;
 // propastná pláň a hadalský příkop
 const yp=yOf(TOP_PLAIN);if(yp<H+40){if(WG2K!==W+"x"+H){WG2K=W+"x"+H;WG2=cx.createLinearGradient(0,0,W*.5,0);WG2.addColorStop(0,"#0c141c");WG2.addColorStop(1,"#2a3d4b")}
  const step=14,yS=Math.max(yp,-20),dAt=y=>depth+(y-yOf(depth))/mp;
  for(const side of[0,1]){cx.save();if(side){cx.translate(W,0);cx.scale(-1,1)}cx.fillStyle=WG2;cx.beginPath();cx.moveTo(-2,H+2);
   // rovná pláň s nerovnostmi až k okraji příkopu (jen když je vidět), pak dolů po stěně
   const ed=d=>W*.5-trenchGap(Math.max(d,6000))/2+wallNoise(d,side),xe=ed(6000);if(yp>-50){cx.lineTo(-2,yp);for(let x=0;x<xe;x+=24)cx.lineTo(x,yp+Math.sin(x/31+side*5)*2.5)}else cx.lineTo(-2,-20);
   for(let y=Math.max(yS,yp+6);y<=H+step;y+=step)cx.lineTo(ed(dAt(y)),y);cx.lineTo(-2,H+2);cx.closePath();cx.fill();
   cx.strokeStyle="rgba(160,195,210,.22)";cx.lineWidth=1.5;cx.beginPath();for(let y=Math.max(yS,yp+6),f=1;y<=H+step;y+=step){const x=ed(dAt(y));f?cx.moveTo(x,y):cx.lineTo(x,y);f=0}cx.stroke();
   // lilijice a skleněné houby na římsách stěny (pevné hloubky, střídavě vlevo a vpravo)
   for(let d=Math.ceil(Math.max(6100,dAt(-40))/320)*320;d<dAt(H+40);d+=320){if((d/320)%2!==side)continue;const y=yOf(d),x=ed(d)-6;
    if((d/640)%2<1){cx.strokeStyle="rgba(220,200,160,.6)";cx.lineWidth=1.2;cx.beginPath();cx.moveTo(x,y);cx.lineTo(x+10,y-20);const sw=Math.sin(t/900+d)*.3;for(let j=0;j<7;j++){const a=-1.9+j*.5+sw;cx.moveTo(x+10,y-20);cx.lineTo(x+10+Math.cos(a)*11,y-20+Math.sin(a)*11)}cx.stroke()}
    else{cx.fillStyle="rgba(210,225,230,.45)";cx.beginPath();cx.moveTo(x-1,y);cx.quadraticCurveTo(x+8,y-12,x+5,y-24);cx.lineTo(x+11,y-24);cx.quadraticCurveTo(x+12,y-10,x+5,y);cx.fill()}}
   cx.restore()}
  // život na pláni: jen u horní hrany příkopu
  if(yp>-30&&yp<H+30){CR2.cuke(W*.14,yp-4,t,1,false,1);CR2.cuke(W*.9,yp-3,t,2,false,-1);CR2.tripod(W*.08,yp-26,t,0,false,1);CR2.tripod(W*.95,yp-26,t,0,false,-1)}}}
/* po tmě (kreslí se přes ztmavení hlubiny): popisky zón, čelovka, světélkující žilky ve stěnách za Mariánským příkopem */
let LAMPS=null;
function afterDark(t,deep,swim,hx,hy,yOf,sY){
 for(const[b,n]of ZB){const y=yOf(b);if(y<0||y>H||y<sY+30)continue;cx.fillStyle="rgba(255,255,255,.07)";cx.fillRect(0,y,W,1);cx.font="700 10.5px -apple-system,Inter,sans-serif";cx.textAlign="center";cx.fillStyle="rgba(225,245,255,.42)";cx.fillText(n.toUpperCase()+" · "+b.toLocaleString("cs-CZ")+" m",W/2,y-9);cx.textAlign="start"}
 if(deep>0&&swim){if(!LAMPS){LAMPS=document.createElement("canvas");LAMPS.width=LAMPS.height=64;const b=LAMPS.getContext("2d"),g=b.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,"rgba(255,252,230,1)");g.addColorStop(.18,"rgba(255,246,200,.8)");g.addColorStop(.5,"rgba(255,240,190,.18)");g.addColorStop(1,"rgba(255,240,190,0)");b.fillStyle=g;b.fillRect(0,0,64,64)}
  cx.save();cx.globalCompositeOperation="lighter";const s=22+Math.sin(t/170)*1.2;cx.globalAlpha=Math.min(1,deep*1.6);cx.drawImage(LAMPS,hx-s,hy-s,s*2,s*2);cx.restore()}
 if(depth>10600){const mp=H/900;cx.save();cx.globalCompositeOperation="lighter";cx.fillStyle="#7ff0ff";for(const side of[0,1]){for(let i=0;i<14;i++){const d=Math.floor(depth/60)*60+(i-6)*60;if(d<11000)continue;const y=yOf(d),gp=trenchGap(d),x=side?W*.5+gp/2-wallNoise(d,side)+8:W*.5-gp/2+wallNoise(d,side)-8;
  cx.globalAlpha=Math.min(1,(depth-10600)/600)*(.35+.35*Math.sin(t/600+i+side*3));cx.beginPath();cx.arc(x,y,1.8+(i%3),0,7);cx.fill()}}cx.restore();cx.globalAlpha=1}}
// detaily potápěče navíc (odlesk na láhvi, manometr na hadici) – kreslí se přes původní postavu ve stejné soustavě souřadnic
{const base=diver;diver=function(x,y,t,tilt,P){base(x,y,t,tilt,P);cx.save();cx.translate(x,y);cx.rotate(tilt);cx.scale(1.18,1.18);
 cx.strokeStyle="rgba(255,255,255,.5)";cx.lineWidth=1.1;cx.beginPath();cx.moveTo(-16,-21.2);cx.lineTo(12,-21.2);cx.stroke();
 const sw=Math.sin(t/700)*1.2*(P?1-P.leg:1);cx.strokeStyle="#1b1f24";cx.lineWidth=1.3;cx.beginPath();cx.moveTo(19,-15);cx.bezierCurveTo(12,-3,3,3,-2,9+sw);cx.stroke();
 cx.fillStyle="#2b3036";cx.beginPath();cx.arc(-2.6,10.6+sw,3.3,0,7);cx.fill();cx.fillStyle="#e6edf1";cx.beginPath();cx.arc(-2.6,10.6+sw,2.1,0,7);cx.fill();
 cx.strokeStyle="#d0303a";cx.lineWidth=.8;cx.beginPath();cx.moveTo(-2.6,10.6+sw);cx.lineTo(-1.5,9.3+sw);cx.stroke();cx.restore()}}
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
  cx.save();cx.translate(fx,fy);cx.rotate(Math.atan2(fy-ky,fx-kx)+Math.PI+kk*.35*(1-leg)-leg*.4);cx.fillStyle=gcache("fin"+sh,()=>{const fg=cx.createLinearGradient(-30,0,0,0);fg.addColorStop(0,sh<1?"rgba(200,95,75,.75)":"rgba(255,140,110,.8)");fg.addColorStop(1,sh<1?"#c8644e":acc);return fg});cx.beginPath();cx.moveTo(2,-3.5);cx.quadraticCurveTo(-14,-11,-34,-10);cx.quadraticCurveTo(-28,0,-34,10);cx.quadraticCurveTo(-14,11,2,3.5);cx.fill();cx.strokeStyle="rgba(255,255,255,.25)";cx.lineWidth=.8;cx.beginPath();cx.moveTo(-4,-1);cx.lineTo(-30,-3);cx.moveTo(-4,1);cx.lineTo(-30,3);cx.stroke();cx.restore()}
 // láhev
 cx.fillStyle=gcache("tank",()=>{const tg=cx.createLinearGradient(0,-24,0,-10);tg.addColorStop(0,"#fff4c8");tg.addColorStop(.35,"#f4cb55");tg.addColorStop(1,"#a97a14");return tg});cx.beginPath();cx.roundRect(-22,-23,40,11,5.5);cx.fill();cx.fillStyle="rgba(0,0,0,.25)";cx.fillRect(-12,-23,2,11);cx.fillRect(6,-23,2,11);cx.fillStyle="#3b3f45";cx.beginPath();cx.roundRect(17,-21,6,7,2);cx.fill();cx.fillStyle="#d9dee3";cx.beginPath();cx.arc(24,-17.5,2.2,0,7);cx.fill();
 // trup
 cx.fillStyle=gcache("torso",()=>{const bg=cx.createLinearGradient(0,-13,0,11);bg.addColorStop(0,suit2);bg.addColorStop(.5,suit);bg.addColorStop(1,"#0a0f15");return bg});cx.beginPath();cx.moveTo(20,-9);cx.quadraticCurveTo(4,-14,-18,-8);cx.quadraticCurveTo(-24,0,-18,7);cx.quadraticCurveTo(4,12,20,7);cx.quadraticCurveTo(26,-1,20,-9);cx.fill();
 // vesta BCD
 cx.fillStyle=gcache("bcd",()=>{const vg=cx.createLinearGradient(0,-12,0,10);vg.addColorStop(0,"#3c5470");vg.addColorStop(1,"#1d2b3c");return vg});cx.beginPath();cx.moveTo(18,-9);cx.quadraticCurveTo(6,-12,-6,-10);cx.lineTo(-8,6);cx.quadraticCurveTo(6,10,18,6);cx.closePath();cx.fill();cx.fillStyle=acc;cx.fillRect(-6,-3,24,2.4);cx.fillStyle="#9aa4ad";cx.beginPath();cx.roundRect(-14,4,6,5,1.2);cx.fill();cx.fillStyle="#2b2f34";cx.fillRect(-18,3,30,2.2);
 // hadice k automatice (konec se otáčí s hlavou)
 const[rx0,ry0]=rot2(7.5,7,neck),rx=30+rx0,ry=-6+ry0;
 cx.strokeStyle="#1b1f24";cx.lineWidth=2;cx.beginPath();cx.moveTo(22,-16);cx.bezierCurveTo(30,-18,rx-1,ry-9,rx-.5,ry-1);cx.stroke();cx.strokeStyle="#ffcc4d";cx.lineWidth=1.6;cx.beginPath();cx.moveTo(20,-14);cx.bezierCurveTo(14,4,22,12,26,10);cx.stroke();
 // zadní paže
 const ax=Math.sin(t/900)*2,bx2=30+(-12-30)*leg,by2=10+ax+(-8-10-ax)*leg;limb(14,-2,bx2,by2,-3+leg*7,5.5,"#0d141c");cx.fillStyle="#0d141c";cx.beginPath();cx.arc(bx2,by2,3,0,7);cx.fill();
 // hlava (s krkem: v sedu se dívá dopředu, při plavání před sebe)
 cx.save();if(neck){cx.translate(30,-6);cx.rotate(neck);cx.translate(-30,6)}
 cx.fillStyle=gcache("hood",()=>{const hg=cx.createRadialGradient(28,-9,1,30,-6,10);hg.addColorStop(0,suit2);hg.addColorStop(1,suit);return hg});cx.beginPath();cx.arc(30,-6,9,0,7);cx.fill();cx.strokeStyle="#0a0e13";cx.lineWidth=1.4;cx.beginPath();cx.arc(30,-6,8,-2.2,-.6);cx.stroke();
 cx.fillStyle="#111";cx.beginPath();cx.roundRect(31,-13.5,11,10,3.5);cx.fill();cx.fillStyle=gcache("mask",()=>{const mg=cx.createLinearGradient(32,-13,41,-3);mg.addColorStop(0,"#e5fdff");mg.addColorStop(.35,"#6fd8ef");mg.addColorStop(1,"#155d80");return mg});cx.beginPath();cx.roundRect(32.3,-12.3,8.6,7.6,2.6);cx.fill();cx.fillStyle="rgba(255,255,255,.85)";cx.beginPath();cx.moveTo(33.4,-11.4);cx.lineTo(36,-11.4);cx.lineTo(34,-7);cx.lineTo(33.4,-7);cx.fill();
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
 // sloupky zábradlí, záchranný kruh, anténa a jméno lodi
 cx.lineWidth=1.2;cx.beginPath();for(let x=-.24;x<.33;x+=.12){cx.moveTo(L*x,-H1);cx.lineTo(L*x,-H1-L*.07)}cx.stroke();
 cx.strokeStyle="#ff6a3d";cx.lineWidth=L*.012;cx.beginPath();cx.arc(-L*.3,-H1-L*.035,L*.026,0,7);cx.stroke();cx.strokeStyle="#fff";cx.beginPath();for(let a=0;a<4;a++){cx.moveTo(-L*.3+Math.cos(a*1.57)*L*.026,-H1-L*.035+Math.sin(a*1.57)*L*.026);cx.arc(-L*.3,-H1-L*.035,L*.026,a*1.57,a*1.57+.45)}cx.stroke();
 cx.strokeStyle="#9fb0bd";cx.lineWidth=1.2;cx.beginPath();cx.moveTo(L*.05,-H1-L*.185);cx.lineTo(L*.02,-H1-L*.42);cx.stroke();cx.fillStyle="#f4f8fb";cx.beginPath();cx.ellipse(L*.17,-H1-L*.198,L*.025,L*.014,0,Math.PI,0);cx.fill();
 cx.fillStyle="rgba(30,55,80,.85)";cx.font=`800 ${Math.max(7,L*.042)}px -apple-system,Inter,sans-serif`;cx.textBaseline="middle";cx.fillText("KRILLION",-L*.33,-H1*.72);
 // žebřík na zádi (po něm potápěč vyleze zpátky)
 cx.strokeStyle="#b9c7d1";cx.lineWidth=1.8;cx.beginPath();cx.moveTo(-L*.47,-H1-L*.025);cx.quadraticCurveTo(-L*.53,-H1-L*.03,-L*.53,-H1+L*.01);cx.lineTo(-L*.53,L*.07);cx.stroke();
 cx.lineWidth=1.4;cx.beginPath();for(let y=-H1+L*.03;y<L*.07;y+=L*.03){cx.moveTo(-L*.53,y);cx.lineTo(-L*.555,y)}cx.stroke();
 // pěna u trupu na čáře vody
 cx.fillStyle=`rgba(255,255,255,${.45+Math.sin(t/300)*.15})`;cx.beginPath();cx.ellipse(L*.36,1,L*.07,2.2,0,0,7);cx.ellipse(-L*.48,1,L*.05,1.8,0,0,7);cx.fill();
 // ponořená část trupu prosvítá vodou
 cx.save();cx.beginPath();cx.rect(-L,0,L*2,L*.2);cx.clip();cx.fillStyle=G.under;hull();cx.fill();cx.restore();
 cx.restore()}
/* místo, kde je na úvodní / koncové obrazovce hladina a jak velká je loď: v prostoru mezi HUD a kartou */
function deckLayout(){const top=vTop+64,ct=vTop+Math.max(geo().top,150),free=ct-top,L=Math.max(130,Math.min(W*.6,300,free*1.25));
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
function draw(t){const dt=Math.min(t-lastT,50)||16,t0=FPS?performance.now():0;lastT=t;frameAvg=frameAvg*.95+dt*.05;
 // adaptivní kvalita: při dlouhodobě pomalých snímcích sníží, po 15 s plynulého běhu ji (nejvýš dvakrát) zase vrátí
 if(t>8000&&!draw.cool){if(frameAvg>24&&Q>0){Q--;SBK=0;draw.good=0;coolQ()}
  else if(Q<Q0&&draw.ups<2){if(frameAvg<17.4){if((draw.good+=dt)>15000){Q++;draw.ups++;draw.good=0;if(Q===Q0)SBK=MOBILE?0:1;coolQ()}}else draw.good=0}}
 const prev=depth;if(S.m==="asc"){S.e+=dt;depth=S.aD*(1-eIO(seg(S.e,0,S.aT)));if(S.e>=S.aT){depth=0;S.m="surf";S.e=0;S.s0=null;S.pop=false}}else depth+=(target-depth)*(RM?1:Math.min(1,dt/ease));const v=depth-prev;
 kick=Math.max(0,kick-dt/1400);hurt=Math.max(0,hurt-dt/700);
 // potápěč v prostoru mezi HUD a kartou
 const g0=geo(),freeTop=vTop+66,freeBot=vTop+Math.max(g0.top,140);const playing=g0.play;const want=playing?Math.min(vTop+g0.top+g0.h+95,H-70):Math.max(freeTop+40,Math.min(freeTop+(freeBot-freeTop)*.42,vTop+230));dyS+=(want-dyS)*Math.min(1,dt/350);
 const dxp=W*.5+Math.sin(t/3100)*W*.04,dyp=dyS+Math.sin(t/900)*6+hurt*Math.sin(t/30)*4;
 tiltV+=((dt>0?v/dt*1000:0)-tiltV)*Math.min(1,dt/220); // rychlost klesání v m/s, vyhlazená (stejně při 60 i 120 Hz)
 const tilt=.16+Math.sin(t/1300)*.05+Math.max(-.4,Math.min(tiltV*.0005,.55))+kick*.22-(target<depth-5?1:0);
 const sY=sceneStep(t,dt,dxp,dyp,tilt),co=S.co,dco=co-S.coP;S.coP=co;
 if(dco){for(const b of bub)b.y+=dco;for(const s of snow)s.y=((s.y+dco/H)%1+1)%1}
 const yOf=d=>dyp+40+(d-depth)*(H/900)+co;
 cx.fillStyle=waterG(col(Math.max(0,depth-160)),col(depth+750));cx.fillRect(0,0,W,H);
 cx.save();cx.globalCompositeOperation="lighter";
 // paprsky světla: jeden uložený gradient, jas každého paprsku přes globalAlpha
 const ra=Math.max(0,1-depth/700)*.15,r0=Math.max(0,sY);if(ra>.002&&r0<H){cx.translate(0,r0);cx.fillStyle=gcache("ray"+H,()=>{const g=cx.createLinearGradient(0,0,0,H*.95);g.addColorStop(0,"rgba(255,255,255,1)");g.addColorStop(1,"rgba(255,255,255,0)");return g});const hb=H-r0;
  for(let i=0;i<7;i++){const x=W*(i/6)+Math.sin(t/3400+i*1.7)*70,w=50+(i*37)%90;cx.globalAlpha=ra*(1+Math.sin(t/1800+i)*.4);cx.beginPath();cx.moveTo(x-w/2,0);cx.lineTo(x+w/2,0);cx.lineTo(x+w*1.7-W*.12,hb);cx.lineTo(x-w*1.3-W*.12,hb);cx.fill()}cx.globalAlpha=1;cx.translate(0,-r0)}
 const ca=Q>=1?Math.max(0,1-depth/260)*.1:0;if(ca>.002){cx.strokeStyle="#fff";cx.globalAlpha=ca;cx.lineWidth=2;for(let j=0;j<5;j++){cx.beginPath();for(let x=0;x<=W;x+=14){const y=vTop+H*.04+j*28+Math.sin(x/53+t/900+j)*9+Math.sin(x/21-t/700)*4-depth*(H/900)+co;x?cx.lineTo(x,y):cx.moveTo(x,y)}cx.stroke()}cx.globalAlpha=1}
 cx.restore();
 scenery(t,yOf,sY); // útes, vraky, průduchy, dno a příkop (za živočichy)
 cx.font="600 11px -apple-system,Inter,sans-serif";cx.textBaseline="middle";
 for(let m=Math.max(500,Math.floor((depth-500)/500)*500);m<depth+900;m+=500){const y=yOf(m);if(y<0||y>H)continue;cx.strokeStyle="rgba(255,255,255,.12)";cx.setLineDash([3,6]);cx.beginPath();cx.moveTo(0,y);cx.lineTo(W*.22,y);cx.stroke();cx.setLineDash([]);cx.fillStyle="rgba(255,255,255,.35)";cx.fillText(mLabel(m),10,y-9)}
 const deep=Math.min(1,Math.max(0,(depth-600)/1800));
 // živočichové: pole objektů se nealokuje v každém snímku, jen se přepočítá poloha
 for(const c of LIVE){c.y=yOf(c.d);c.on=c.y>-260&&c.y<H+260&&c.y>sY+40;if(c.on)c.x=px(c.xf,c.s,t,c.d)}
 for(const c of LIVE){if(!c.on||deep>.4&&GLOWY.has(c.k))continue;creature(c.k,c.x,c.y,t,c.d,depth>900,c.dir)}
 const sp=v*.9+.12,SN=Q>=2?snow.length:Q>=1?100:60;cx.fillStyle=depth>900?"rgba(200,245,255,.32)":"rgba(255,255,255,.22)";cx.beginPath();for(let i=0;i<SN;i++){const s=snow[i];s.y-=(sp*s.r*.004*s.z)+.00018*s.r;if(s.y<0){s.y=1;s.x=Math.random()}if(s.y>1)s.y=0;const x=s.x*W+Math.sin(t/2100+s.w)*6,y=s.y*H;if(y<sY+4)continue;cx.moveTo(x+s.r,y);cx.arc(x,y,s.r,0,7)}cx.fill();
 const swim=S.m==="dive"||S.m==="asc";
 const[hx,hy]=head(dxp,dyp,tilt);
 // tma v hlubině s kuželem čelovky (poloviční rozlišení); gradienty jsou uložené a posouvají se na hlavu / tělo potápěče
 if(deep>0){dx.globalCompositeOperation="copy";dx.fillStyle="rgb(0,3,10)";dx.globalAlpha=.84*deep;dx.fillRect(0,0,W,H);dx.globalAlpha=1;dx.globalCompositeOperation="destination-out";
  const ang=tilt+.32+Math.sin(t/2300)*.08,len=Math.max(W,H)*.8,spr=.34;dx.save();dx.translate(hx,hy);dx.fillStyle=gcache("lamp"+len,()=>{const lg=dx.createRadialGradient(0,0,0,0,0,len);lg.addColorStop(0,"rgba(0,0,0,1)");lg.addColorStop(.5,"rgba(0,0,0,.78)");lg.addColorStop(1,"rgba(0,0,0,0)");return lg});dx.beginPath();dx.moveTo(0,0);dx.arc(0,0,len,ang-spr,ang+spr);dx.closePath();dx.fill();dx.restore();
  dx.save();dx.translate(dxp,dyp);dx.fillStyle=gcache("halo",()=>{const hg=dx.createRadialGradient(0,0,0,0,0,130);hg.addColorStop(0,"rgba(0,0,0,.92)");hg.addColorStop(1,"rgba(0,0,0,0)");return hg});dx.beginPath();dx.arc(0,0,130,0,7);dx.fill();dx.restore();
  cx.drawImage(dk,0,0,W,H);
  cx.save();cx.globalCompositeOperation="lighter";cx.translate(hx,hy);cx.globalAlpha=deep;cx.fillStyle=gcache("beam"+len,()=>{const g=cx.createRadialGradient(0,0,0,0,0,len*.85);g.addColorStop(0,"rgba(225,250,255,.17)");g.addColorStop(1,"rgba(225,250,255,0)");return g});cx.beginPath();cx.moveTo(0,0);cx.arc(0,0,len*.85,ang-spr*.8,ang+spr*.8);cx.closePath();cx.fill();
  cx.fillStyle="#fff";for(let i=0;i<14;i++){const a=ang+(((i*.37)%1)-.5)*spr*1.4,r=((t/40+i*61)%(len*.7))+30;cx.globalAlpha=.35*deep*(1-r/(len*.7));cx.beginPath();cx.arc(Math.cos(a)*r,Math.sin(a)*r,1.2,0,7);cx.fill()}cx.restore()}
 if(deep>.05){cx.save();cx.globalCompositeOperation="lighter";cx.globalAlpha=deep*.55;for(const col of["#8ff7ff","#a9ffcf"]){cx.fillStyle=col;cx.beginPath();for(const p of glow){if(p.c!==col||Math.sin(t/700+p.p)<0)continue;const x=p.x*W,y=((p.y-depth/4000)%1+1)%1*H;cx.moveTo(x+1.7,y);cx.arc(x,y,1.7,0,7)}cx.fill()}cx.restore();cx.globalAlpha=1}
 for(const c of LIVE){if(!c.on)continue;if(deep>.4&&GLOWY.has(c.k))creature(c.k,c.x,c.y,t,c.d,true,c.dir);if(c.k==="angler")lure(c.x,c.y,t,c.dir)}
 // dech: bubliny z automatiky, jen když je potápěč pod vodou
 const dv=S.dv;let mx,my;if(dv){const[a,b]=rot2(38*1.18*dv.sc,1.18*dv.sc,dv.rot);mx=dv.x+a;my=dv.y+b}else[mx,my]=mouth(dxp,dyp,tilt);
 if(t>nextBreath&&my>sY+12&&S.m!=="deck"){nextBreath=t+1500+Math.random()*900;for(let i=0;i<6;i++)bub.push({x:mx,y:my,r:Math.random()*3+1.4,vy:Math.random()*.8+1,d:i*80,w:Math.random()*6})}
 if(swim&&v>1&&bub.length<90&&Math.random()<.5)bub.push({x:dxp-40+(Math.random()-.5)*16,y:dyp,r:Math.random()*2.5+1.2,vy:Math.random()*1.2+1.4,d:0,w:Math.random()*6});
 for(let i=bub.length-1;i>=0;i--){const b=bub[i];if(b.d>0){b.d-=dt;continue}b.y-=b.vy*dt/16;b.x+=Math.sin(b.y/18+b.w)*.5;if(b.y<sY+3||b.y<-10){bub.splice(i,1);continue}cx.drawImage(BUB,b.x-b.r,b.y-b.r,b.r*2,b.r*2)}
 if(sY>-90)surfaceLayer(t,sY);
 if(dv){cx.save();cx.translate(dv.x,dv.y);cx.scale(dv.sc,dv.sc);diver(0,0,t,dv.rot,dv.P);cx.restore()}else diver(dxp,dyp,t,tilt);
 if(sY>-120)splashFx(t,dt,sY);
 afterDark(t,deep,swim,hx,hy,yOf,sY); // popisky zón, záře čelovky, světélkování za Mariánským příkopem
 if(deep>0&&swim){cx.save();cx.globalCompositeOperation="lighter";cx.fillStyle="rgba(255,250,220,.95)";cx.beginPath();cx.arc(hx,hy,2.6,0,7);cx.fill();cx.restore()}
 cx.save();cx.globalCompositeOperation="lighter";for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];s.x+=s.vx*dt/16;s.y+=s.vy*dt/16;s.vy+=.02;s.l-=dt/950;if(s.l<=0){sparks.splice(i,1);continue}cx.globalAlpha=s.l;cx.fillStyle=s.c;cx.shadowBlur=12;cx.shadowColor=s.c;cx.beginPath();cx.arc(s.x,s.y,s.r*s.l+.4,0,7);cx.fill()}cx.restore();
 cx.globalAlpha=.22*Math.min(1,Math.max(.25,(vTop-sY)/H))+deep*.3;cx.drawImage(VIG,0,0,W,H);cx.globalAlpha=1;
 // HUD: text a značka hloubky se přepíšou jen při změně (formátování čísla i zápis do DOM stojí čas)
 const dr=Math.round(depth);if(dr!==hudD){hudD=dr;dmEl.textContent=fmt(dr)}
 const mk=Math.round(Math.min(depth/11000,1)*1000);if(mk!==hudM){hudM=mk;markEl.style.top=mk/10+"%"}
 if(FPS)fpsMeter(t,performance.now()-t0);
 requestAnimationFrame(draw)}
/* měřič plynulosti: adresa s ?fps ukáže snímky za sekundu, nejpomalejší snímek, čas kreslení a úroveň kvality Q */
const FPS=/[?&]fps\b/.test(location.search);let fpsEl=null,fpsN=0,fpsT0=0,fpsMax=0,fpsJs=0;
function fpsMeter(t,js){if(!fpsEl){fpsEl=document.createElement("div");fpsEl.style.cssText="position:fixed;left:8px;bottom:8px;z-index:9;font:600 11px/1.3 ui-monospace,monospace;color:#fff;background:rgba(0,0,0,.55);padding:4px 7px;border-radius:7px;pointer-events:none;white-space:pre";document.body.appendChild(fpsEl);fpsT0=t}
 fpsN++;fpsJs+=js;fpsMax=Math.max(fpsMax,t-(fpsMeter.l||t));fpsMeter.l=t;
 if(t-fpsT0>=1000){fpsEl.textContent=`${Math.round(fpsN*1000/(t-fpsT0))} fps · max ${Math.round(fpsMax)} ms\nkreslení ${(fpsJs/fpsN).toFixed(1)} ms · Q${Q}`;fpsN=0;fpsJs=0;fpsMax=0;fpsT0=t}}
let hudD=-1,hudM=-1;const dmEl=$("dm"),markEl=$("mark");
const GLOWY=new Set(["jelly","siph","lantern","hatchet","eel","vampire"]);
const LIVE=LIFE.map(([k,d,xf,s])=>({k,d,xf,s,x:0,y:0,on:false,dir:s<0?-1:1}));
const MLB=new Map();const mLabel=m=>{let s=MLB.get(m);if(!s){s=m.toLocaleString("cs-CZ")+" m";MLB.set(m,s)}return s};
draw.good=0;draw.ups=0;
requestAnimationFrame(draw);
function burst(c,n){if(RM)return;const x=card.offsetLeft+card.offsetWidth/2,y=vTop+card.offsetTop+60;for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=Math.random()*4+1.5;sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,r:Math.random()*2.6+1,l:1,c})}}
