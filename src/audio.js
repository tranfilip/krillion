// Zvuky hry: všechno se generuje v kódu přes Web Audio API (žádné soubory ani externí služby).
// Výchozí stav je vypnuto; zapíná se ikonou reproduktoru vlevo nahoře (nebo v nastavení hry, pokud existuje).
// Stav se ukládá do localStorage „krillion-nastaveni“ → klíč „snd“ (stejný klíč používá nastavení hry).
// Hra volá window.KRILLION_SFX.play(název): splash, plop, bubble, ok, rare, bad, streak, record, tick.
(function () {
  const KEY = "krillion-nastaveni";
  const read = () => { try { const r = JSON.parse(localStorage.getItem(KEY) || "null"); return r && typeof r === "object" ? r : {}; } catch (e) { return {}; } };
  let on = read().snd === true, ctx = null, out = null, noise = null, lastPlay = {};

  function init() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 4;
    out = ctx.createGain(); out.gain.value = 0.32;
    out.connect(comp); comp.connect(ctx.destination);
    // bílý šum pro šplouchnutí (jednou, 1 s)
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }
  // tón s obálkou: typ, frekvence od → do, začátek, délka, hlasitost
  function tone(type, f0, f1, at, dur, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + at;
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
  }
  // šum přes pásmovou propust, která klesá (voda)
  function hiss(at, dur, fA, fB, vol, q) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), t = ctx.currentTime + at;
    s.buffer = noise; f.type = "bandpass"; f.Q.value = q || 1.2;
    f.frequency.setValueAtTime(fA, t); f.frequency.exponentialRampToValueAtTime(fB, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + dur + 0.05);
  }
  const N = (n) => 440 * Math.pow(2, (n - 69) / 12); // MIDI → Hz
  const SND = {
    splash() { hiss(0, 0.7, 2400, 300, 0.9, 0.8); tone("sine", 140, 60, 0, 0.35, 0.5); for (let i = 0; i < 5; i++) SND.bubble(0.25 + i * 0.09 + Math.random() * 0.05, 0.12); },
    plop() { tone("sine", 700, 180, 0, 0.12, 0.35); hiss(0, 0.25, 1800, 500, 0.25); },
    bubble(at = 0, vol = 0.18) { const f = 280 + Math.random() * 260; tone("sine", f, f * 2.6, at, 0.07 + Math.random() * 0.04, vol); },
    ok() { tone("triangle", N(76), N(76), 0, 0.22, 0.28); tone("triangle", N(83), N(83), 0.08, 0.32, 0.24); },
    rare() { [79, 83, 86, 91].forEach((n, i) => tone("triangle", N(n), N(n), i * 0.07, 0.45, 0.22)); tone("sine", N(103), N(103), 0.28, 0.6, 0.06); },
    bad() { tone("sawtooth", N(52), N(47), 0, 0.32, 0.09); tone("sine", N(40), N(35), 0, 0.35, 0.3); },
    streak() { [72, 76, 79, 84, 88].forEach((n, i) => tone("triangle", N(n), N(n), i * 0.06, 0.35, 0.22)); for (let i = 0; i < 4; i++) SND.bubble(0.1 + i * 0.07, 0.1); },
    record() { [72, 76, 79, 84, 79, 84, 88].forEach((n, i) => tone("triangle", N(n), N(n), i * 0.11, i === 6 ? 0.8 : 0.3, 0.24)); },
    tick() { tone("sine", 1400, 1400, 0, 0.03, 0.05); },
  };
  function play(name, ...a) {
    if (!on || !SND[name]) return;
    const now = performance.now(); if (now - (lastPlay[name] || 0) < 60) return; lastPlay[name] = now; // stejný zvuk nejvýš jednou za 60 ms
    if (!init()) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    try { SND[name](...a); } catch (e) {}
  }
  function set(v) {
    on = !!v; const s = read(); s.snd = on; try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
    if (on) { init(); if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {}); play("ok"); }
    paint();
  }
  // přepínač s reproduktorem (vlevo nahoře, mimo kartu)
  const ICON_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12"/></svg>';
  const ICON_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>';
  let btn = null;
  function paint() { if (!btn) return; btn.innerHTML = on ? ICON_ON : ICON_OFF; btn.setAttribute("aria-pressed", String(on)); btn.setAttribute("aria-label", on ? "Vypnout zvuky" : "Zapnout zvuky"); btn.title = on ? "Zvuky zapnuté" : "Zvuky vypnuté"; }
  function mount() {
    btn = document.createElement("button"); btn.type = "button"; btn.className = "sndb glass"; btn.id = "sndb";
    btn.addEventListener("click", () => set(!on)); document.body.appendChild(btn); paint();
  }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
  window.KRILLION_SFX = { play, set, get on() { return on; } };
})();
