/* ================================================================
   HORROR.JS — Master Engine v2
   Audio · Cursor · Particles · Scares · Scroll Reveal · Utils
   ================================================================ */

'use strict';

/* ================================================================
   AUDIO ENGINE — Rich Horror Sounds via Web Audio API
   ================================================================ */
const HorrorAudio = (() => {
  let ctx = null;
  let masterGain = null;
  let ambientNodes = [];
  let unlocked = false;

  /* ── Init ── */
  function init() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 1.0;
      masterGain.connect(ctx.destination);
    } catch (e) { console.warn('Web Audio not available'); }
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  }

  function now() { return ctx ? ctx.currentTime : 0; }

  /* ── Low-level builders ── */
  function makeGain(val) {
    const g = ctx.createGain();
    g.gain.value = val;
    g.connect(masterGain);
    return g;
  }

  function osc(type, freq, gainNode, start, stop, slideFreq) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    if (slideFreq !== undefined) o.frequency.exponentialRampToValueAtTime(slideFreq, stop);
    o.connect(gainNode);
    o.start(start); o.stop(stop);
    return o;
  }

  function noise(duration, vol, filterFreq = 1000, filterQ = 1) {
    if (!ctx) return;
    const len  = Math.ceil(ctx.sampleRate * duration);
    const buf  = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    const src    = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain   = ctx.createGain();
    src.buffer         = buf;
    filter.type        = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value     = filterQ;
    gain.gain.setValueAtTime(vol, now());
    gain.gain.exponentialRampToValueAtTime(0.0001, now() + duration);
    src.connect(filter); filter.connect(gain); gain.connect(masterGain);
    src.start(); src.stop(now() + duration);
  }

  /* ── SOUND LIBRARY ── */

  /* 1. SCREAM — loud multi-layer burst */
  function playScream() {
    if (!ctx) return; resume();
    const t = now();

    // Layer 1: white noise burst (main scare hit)
    const len1 = Math.ceil(ctx.sampleRate * 1.2);
    const buf1 = ctx.createBuffer(1, len1, ctx.sampleRate);
    const d1   = buf1.getChannelData(0);
    for (let i = 0; i < len1; i++) d1[i] = (Math.random() * 2 - 1);
    const ns1  = ctx.createBufferSource();
    const f1   = ctx.createBiquadFilter();
    const g1   = ctx.createGain();
    ns1.buffer = buf1;
    f1.type    = 'highpass'; f1.frequency.value = 400;
    g1.gain.setValueAtTime(0, t);
    g1.gain.linearRampToValueAtTime(1.8, t + 0.04);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    ns1.connect(f1); f1.connect(g1); g1.connect(masterGain);
    ns1.start(t); ns1.stop(t + 1.2);

    // Layer 2: low sub boom
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.8, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    g2.connect(masterGain);
    osc('sawtooth', 55, g2, t, t + 0.6, 20);

    // Layer 3: mid screech
    const g3 = ctx.createGain();
    g3.gain.setValueAtTime(0, t);
    g3.gain.linearRampToValueAtTime(0.5, t + 0.05);
    g3.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    g3.connect(masterGain);
    osc('sawtooth', 900, g3, t, t + 0.8, 200);

    // Layer 4: high-pitched shriek
    setTimeout(() => {
      if (!ctx) return;
      const g4 = ctx.createGain();
      g4.gain.setValueAtTime(0.4, now());
      g4.gain.exponentialRampToValueAtTime(0.001, now() + 0.5);
      g4.connect(masterGain);
      osc('square', 1400, g4, now(), now() + 0.5, 300);
    }, 60);

    // Layer 5: second noise punch at 100ms
    setTimeout(() => noise(0.6, 1.2, 1800, 2), 100);
  }

  /* 2. AMBIENT DRONE — constant creepy background */
  function startAmbient() {
    if (!ctx || ambientNodes.length > 0) return;
    resume();

    // Sub drone
    const gA = ctx.createGain(); gA.gain.value = 0.04; gA.connect(masterGain);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lfg = ctx.createGain(); lfg.gain.value = 12;
    const drn = ctx.createOscillator(); drn.type = 'sawtooth'; drn.frequency.value = 48;
    lfo.connect(lfg); lfg.connect(drn.frequency);
    drn.connect(gA); lfo.start(); drn.start();

    // Second harmonic shimmer
    const gB = ctx.createGain(); gB.gain.value = 0.025; gB.connect(masterGain);
    const lfo2 = ctx.createOscillator(); lfo2.frequency.value = 0.13;
    const lfg2 = ctx.createGain(); lfg2.gain.value = 8;
    const drn2 = ctx.createOscillator(); drn2.type = 'sine'; drn2.frequency.value = 96;
    lfo2.connect(lfg2); lfg2.connect(drn2.frequency);
    drn2.connect(gB); lfo2.start(); drn2.start();

    // Tremolo noise bed
    const bufLen = ctx.sampleRate * 4;
    const nBuf   = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const nData  = nBuf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) nData[i] = Math.random() * 2 - 1;
    const nSrc   = ctx.createBufferSource();
    nSrc.buffer  = nBuf; nSrc.loop = true;
    const nFilt  = ctx.createBiquadFilter(); nFilt.type = 'lowpass'; nFilt.frequency.value = 200;
    const nGain  = ctx.createGain(); nGain.gain.value = 0.015;
    nSrc.connect(nFilt); nFilt.connect(nGain); nGain.connect(masterGain);
    nSrc.start();

    ambientNodes = [lfo, drn, lfo2, drn2, nSrc];
  }

  /* 3. COUNTDOWN TICK — escalating beeps */
  function playTick(n) {
    if (!ctx) return; resume();
    const freqs = { 3: 280, 2: 420, 1: 680 };
    const f = freqs[n] || 280;
    const t = now();
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    g.connect(masterGain);
    osc('square', f, g, t, t + 0.25);
    // Click transient
    noise(0.05, 0.1, 3000, 3);
  }

  /* 4. HEARTBEAT — for sustained tension */
  function playHeartbeat(times = 3) {
    if (!ctx) return; resume();
    for (let i = 0; i < times; i++) {
      setTimeout(() => {
        if (!ctx) return;
        const t = now();
        // Thud 1
        const g1 = ctx.createGain();
        g1.gain.setValueAtTime(0.6, t); g1.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        g1.connect(masterGain);
        osc('sine', 60, g1, t, t + 0.15, 30);
        noise(0.1, 0.3, 80, 0.5);
        // Thud 2
        setTimeout(() => {
          const t2 = now();
          const g2 = ctx.createGain();
          g2.gain.setValueAtTime(0.4, t2); g2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.12);
          g2.connect(masterGain);
          osc('sine', 55, g2, t2, t2 + 0.12, 25);
        }, 180);
      }, i * 900);
    }
  }

  /* 5. WHISPER — eerie high-frequency texture */
  function playWhisper() {
    if (!ctx) return; resume();
    const t = now();
    const dur = 1.5;
    const len = Math.ceil(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f1  = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 3200; f1.Q.value = 6;
    const f2  = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 4800; f2.Q.value = 4;
    const g   = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f1); f1.connect(f2); f2.connect(g); g.connect(masterGain);
    src.start(t); src.stop(t + dur);
  }

  /* 6. DOOR CREAK — slow metallic scrape */
  function playCreak() {
    if (!ctx) return; resume();
    const t = now();
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.25, t + 0.2);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
    g.connect(masterGain);
    osc('sawtooth', 180, g, t, t + 1.8, 60);
    // Harmonics
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.08, t + 0.1);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    g2.connect(masterGain);
    osc('triangle', 360, g2, t + 0.1, t + 1.5, 90);
  }

  /* 7. GHOST MOAN — haunting tone */
  function playGhostMoan() {
    if (!ctx) return; resume();
    const t = now();
    [[220, 0.06, 2.5], [330, 0.04, 2], [440, 0.03, 1.5]].forEach(([f, v, d]) => {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(v, t + 0.4);
      g.gain.exponentialRampToValueAtTime(0.001, t + d);
      g.connect(masterGain);
      osc('sine', f, g, t, t + d, f * 0.85);
    });
    noise(2, 0.04, 500, 2);
  }

  /* 8. STINGER — sharp hit for sudden scares */
  function playStinger() {
    if (!ctx) return; resume();
    const t = now();
    // Impact
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(1.5, t); g1.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    g1.connect(masterGain);
    osc('sawtooth', 120, g1, t, t + 0.08);
    noise(0.08, 2.0, 2000, 1);
    // Tail reverb-like decay
    setTimeout(() => {
      if (!ctx) return;
      noise(0.8, 0.3, 600, 0.8);
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0.3, now()); g2.gain.exponentialRampToValueAtTime(0.001, now() + 0.7);
      g2.connect(masterGain);
      osc('triangle', 80, g2, now(), now() + 0.7, 30);
    }, 80);
  }

  /* 9. CANDLE FLICKER sound */
  function playCandle() {
    if (!ctx) return; resume();
    const t = now();
    const g = ctx.createGain(); g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    g.connect(masterGain);
    osc('sine', 520, g, t, t + 0.2);
    noise(0.15, 0.03, 6000, 4);
  }

  /* 10. RITUAL COMPLETE — dark chord */
  function playRitualComplete() {
    if (!ctx) return; resume();
    const t = now();
    [55, 82, 110, 146, 165].forEach((f, i) => {
      setTimeout(() => {
        if (!ctx) return;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now()); g.gain.linearRampToValueAtTime(0.1, now() + 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, now() + 3);
        g.connect(masterGain);
        osc('sawtooth', f, g, now(), now() + 3);
      }, i * 250);
    });
    setTimeout(() => noise(2, 0.6, 600, 1), 1000);
  }

  /* 11. GHOST (gallery hover) */
  function playGhost() {
    if (!ctx) return; resume();
    playGhostMoan();
  }

  /* 12. RANDOM AMBIENT EVENT */
  function randomEvent() {
    if (!ctx) return; resume();
    const events = [
      () => playWhisper(),
      () => playCreak(),
      () => { const g = ctx.createGain(); g.gain.value = 0.04; g.connect(masterGain);
               osc('sine', [40,55,70][Math.floor(Math.random()*3)], g, now(), now()+2, 25); },
      () => noise(0.4, 0.04, 300 + Math.random()*400, 0.8),
      () => playGhostMoan(),
    ];
    events[Math.floor(Math.random() * events.length)]();
  }

  /* 13. TONE helper (for external use) */
  function playTone(freq = 80, duration = 1, type = 'sine', vol = 0.06, slide = null) {
    if (!ctx) return; resume();
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, now());
    g.gain.exponentialRampToValueAtTime(0.001, now() + duration);
    g.connect(masterGain);
    osc(type, freq, g, now(), now() + duration, slide || undefined);
  }

  /* 14. NOISE helper */
  function playNoise(duration = 0.5, vol = 0.1, freq = 1000) {
    if (!ctx) return; resume();
    noise(duration, vol, freq, 1.5);
  }

  /* ── Unlock (must be called from user gesture) ── */
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    init();
    resume();
    startAmbient();
    // Schedule random ambient events
    function schedNext() {
      setTimeout(() => { if (ctx) { randomEvent(); schedNext(); } }, 7000 + Math.random() * 8000);
    }
    schedNext();
    // Heartbeat pulse every 30 seconds
    setInterval(() => { if (ctx) playHeartbeat(2); }, 30000);
  }

  return {
    init, unlock,
    playScream, playTick, playHeartbeat, playWhisper,
    playCreak, playGhostMoan, playStinger, playCandle,
    playRitualComplete, playGhost,
    playTone, playNoise, randomEvent
  };
})();

/* ================================================================
   CURSOR ENGINE
   ================================================================ */
const HorrorCursor = (() => {
  let mx = 0, my = 0, dx = 0, dy = 0;
  let cursorEl = null, dotEl = null;

  function init() {
    cursorEl = document.getElementById('cursor');
    dotEl    = document.getElementById('cursor-dot');
    if (!cursorEl) return;

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      cursorEl.style.left = mx + 'px';
      cursorEl.style.top  = my + 'px';
    });

    document.querySelectorAll('a,button,.horror-card,.scare-card,.gallery-item,.candle,.asylum-cell,.scare-btn').forEach(el => {
      el.addEventListener('mouseenter', () => cursorEl.classList.add('hovering'));
      el.addEventListener('mouseleave', () => cursorEl.classList.remove('hovering'));
    });

    animateDot();
  }

  function animateDot() {
    dx += (mx - dx) * 0.15;
    dy += (my - dy) * 0.15;
    if (dotEl) { dotEl.style.left = dx + 'px'; dotEl.style.top = dy + 'px'; }
    requestAnimationFrame(animateDot);
  }

  return { init };
})();

/* ================================================================
   PARTICLE ENGINE
   ================================================================ */
const HorrorParticles = (() => {
  const TYPES = [
    { emoji: '🩸', size: 14 },
    { emoji: '💀', size: 16 },
    { emoji: '👻', size: 16 },
    { emoji: '🕷️', size: 14 },
    { emoji: '🦇', size: 14 },
    { emoji: '🕯️', size: 14 },
    { dot: true }, { dot: true }, { dot: true },
  ];
  let container = null;

  function spawn() {
    if (!container) return;
    const type = TYPES[Math.floor(Math.random() * TYPES.length)];
    const p    = document.createElement('div');
    p.classList.add('particle');
    const startX   = Math.random() * 100;
    const duration = 6 + Math.random() * 10;
    const delay    = Math.random() * 3;
    const size     = 4 + Math.random() * 6;

    if (type.dot) {
      p.style.cssText = `
        width:${size}px;height:${size}px;
        background:hsl(${Math.random()<.7?0:30},100%,${20+Math.random()*20}%);
        box-shadow:0 0 ${size*2}px rgba(255,0,0,.6);
        left:${startX}vw;
        animation-duration:${duration}s;animation-delay:${delay}s;
      `;
    } else {
      p.style.cssText = `
        background:transparent;font-size:${type.size+Math.random()*6}px;line-height:1;
        left:${startX}vw;animation-duration:${duration}s;animation-delay:${delay}s;
        width:auto;height:auto;border-radius:0;
      `;
      p.textContent = type.emoji;
    }
    container.appendChild(p);
    setTimeout(() => p.remove(), (duration + delay) * 1000 + 500);
  }

  function init() {
    container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 8; i++) setTimeout(spawn, i * 300);
    setInterval(spawn, 700);
  }

  return { init };
})();

/* ================================================================
   SCREEN FX
   ================================================================ */
const HorrorFX = (() => {
  let shaking = false;

  function shake(intensity = 12, duration = 600) {
    if (shaking) return;
    shaking = true;
    const el = document.body;
    const start = Date.now();
    const iv = setInterval(() => {
      if (Date.now() - start > duration) {
        el.style.transform = ''; shaking = false; clearInterval(iv); return;
      }
      const d = intensity * (1 - (Date.now() - start) / duration);
      el.style.transform = `translate(${(Math.random()-.5)*d}px,${(Math.random()-.5)*d}px)`;
    }, 20);
  }

  function flash(color = '#ff0000', duration = 100) {
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;inset:0;background:${color};z-index:9000;pointer-events:none;opacity:0.8;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), duration);
  }

  function staticEffect(duration = 400) {
    const el = document.createElement('canvas');
    el.style.cssText = 'position:fixed;inset:0;z-index:8999;pointer-events:none;opacity:0.35;width:100%;height:100%;';
    el.width = 320; el.height = 240;
    document.body.appendChild(el);
    const c = el.getContext('2d');
    const iv = setInterval(() => {
      const id = c.createImageData(320, 240);
      for (let i = 0; i < id.data.length; i += 4) {
        const v = Math.random() * 255;
        id.data[i] = id.data[i+1] = id.data[i+2] = v; id.data[i+3] = 255;
      }
      c.putImageData(id, 0, 0);
    }, 50);
    setTimeout(() => { clearInterval(iv); el.remove(); }, duration);
  }

  /* Random mini scares */
  let scareTimer = null;
  function scheduleRandom() {
    clearTimeout(scareTimer);
    scareTimer = setTimeout(() => {
      const r = Math.floor(Math.random() * 5);
      if (r === 0) { shake(8,400);   HorrorAudio.playCreak(); }
      if (r === 1) { flash('#ff0000',80);  HorrorAudio.playStinger(); }
      if (r === 2) { staticEffect(350);    HorrorAudio.playWhisper(); }
      if (r === 3) { shake(5,300);  flash('rgba(80,0,0,.4)',150); HorrorAudio.playGhostMoan(); }
      if (r === 4) { HorrorAudio.playHeartbeat(2); }
      scheduleRandom();
    }, 10000 + Math.random() * 15000);
  }

  return { shake, flash, staticEffect, scheduleRandom };
})();

/* ================================================================
   JUMP SCARE ENGINE  — fixed active flag reset
   ================================================================ */
const HorrorScare = (() => {
  const FACES = ['😱','👹','💀','👺','🤡','👽','🕷️','😈'];
  const TEXTS = ['BOO!','RUN!','GOTCHA!','SCREAM!','IT FOUND YOU!'];
  let active  = false;

  /* Make sure aftermath close button always resets active */
  function bindAftermath() {
    const el = document.getElementById('aftermath-screen');
    if (!el) return;
    // Reset active whenever aftermath is hidden
    const observer = new MutationObserver(() => {
      if (!el.classList.contains('show')) active = false;
    });
    observer.observe(el, { attributes: true, attributeFilter: ['class'] });
  }

  function run(face, text) {
    if (active) { active = false; } // force reset on re-click

    HorrorAudio.unlock();
    active = true;

    const overlay   = document.getElementById('countdown-overlay');
    const numEl     = document.getElementById('countdown-num');
    const labelEl   = document.getElementById('countdown-label');
    const scareEl   = document.getElementById('jumpscare-screen');
    const emojiEl   = document.getElementById('scare-emoji');
    const textEl    = document.getElementById('scare-text');
    const aftermath = document.getElementById('aftermath-screen');

    if (!overlay || !scareEl) { active = false; return; }

    // Hide aftermath if showing
    if (aftermath) aftermath.classList.remove('show');

    HorrorFX.shake(4, 300);
    HorrorAudio.playHeartbeat(3);

    let count = 3;
    numEl.textContent = count;
    if (labelEl) labelEl.textContent = 'BRACE YOURSELF…';
    overlay.classList.add('show');
    HorrorAudio.playTick(count);

    const iv = setInterval(() => {
      HorrorFX.shake(count * 5, 700);
      count--;
      if (count <= 0) {
        clearInterval(iv);
        overlay.classList.remove('show');
        emojiEl.textContent = face || FACES[Math.floor(Math.random() * FACES.length)];
        textEl.textContent  = text || TEXTS[Math.floor(Math.random() * TEXTS.length)];
        scareEl.classList.add('show');
        HorrorAudio.playScream();
        HorrorFX.shake(35, 800);
        HorrorFX.flash('#ff0000', 80);
        setTimeout(() => {
          scareEl.classList.remove('show');
          if (aftermath) aftermath.classList.add('show');
          active = false;           // ← FIXED: always reset here
        }, 2600);
      } else {
        numEl.textContent = count;
        numEl.style.animation = 'none';
        void numEl.offsetWidth;
        numEl.style.animation = 'cdPop 0.8s ease-out';
        HorrorAudio.playTick(count);
        // Escalating creepy sound per tick
        if (count === 2) HorrorAudio.playWhisper();
        if (count === 1) HorrorAudio.playStinger();
      }
    }, 1000);
  }

  function runInstant(face, text) {
    if (active) { active = false; }

    HorrorAudio.unlock();
    active = true;

    const scareEl   = document.getElementById('jumpscare-screen');
    const emojiEl   = document.getElementById('scare-emoji');
    const textEl    = document.getElementById('scare-text');
    const aftermath = document.getElementById('aftermath-screen');

    if (!scareEl) { active = false; return; }
    if (aftermath) aftermath.classList.remove('show');

    emojiEl.textContent = face || FACES[Math.floor(Math.random() * FACES.length)];
    textEl.textContent  = text || TEXTS[Math.floor(Math.random() * TEXTS.length)];
    scareEl.classList.add('show');
    HorrorAudio.playScream();
    HorrorFX.shake(30, 700);
    HorrorFX.flash('#ff0000', 80);

    setTimeout(() => {
      scareEl.classList.remove('show');
      if (aftermath) aftermath.classList.add('show');
      active = false;               // ← FIXED
    }, 2600);
  }

  return { run, runInstant, bindAftermath };
})();

/* ================================================================
   SCROLL REVEAL
   ================================================================ */
const HorrorReveal = (() => {
  function init() {
    const els = document.querySelectorAll('.reveal,.story-chapter,.path-node,.horror-card,.asylum-cell');
    if (!els.length) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
  }
  return { init };
})();

/* ================================================================
   UTILITIES
   ================================================================ */
function copyPrankLink() {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    const el = document.getElementById('copy-feedback');
    if (el) { el.textContent = '✅ Link copied! Go scare someone!'; el.style.opacity = 1; setTimeout(() => el.style.opacity = 0, 3000); }
  }).catch(() => prompt('Copy this link:', url));
}

function initNav() {
  const burger = document.getElementById('nav-burger');
  const links  = document.getElementById('nav-links');
  if (burger && links) {
    burger.addEventListener('click', () => {
      links.classList.toggle('open');
      HorrorAudio.unlock();
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  }
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });
}

function initCounters() {
  const victims = document.getElementById('stat-victims');
  const screams = document.getElementById('stat-screams');
  if (!victims) return;
  let v = 847293 + Math.floor(Math.random() * 5000);
  let s = 2341887 + Math.floor(Math.random() * 8000);
  victims.textContent = v.toLocaleString();
  screams.textContent = s.toLocaleString();
  setInterval(() => {
    v += Math.floor(Math.random() * 3);
    s += Math.floor(Math.random() * 7);
    victims.textContent = v.toLocaleString();
    screams.textContent = s.toLocaleString();
  }, 2500);
}

function initIdleScare() {
  let idleTimer = null;
  const reset = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      HorrorAudio.playCreak();
      HorrorFX.shake(5, 300);
    }, 18000);
  };
  ['mousemove','keydown','scroll','click','touchstart'].forEach(e => document.addEventListener(e, reset));
  reset();
}

/* Page returns from background — play stinger */
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && HorrorAudio) {
    setTimeout(() => { HorrorAudio.playGhostMoan(); HorrorFX.shake(5, 300); }, 500);
  }
});

/* ================================================================
   AFTERMATH BUTTON HELPER — call from any "Try Another" onclick
   ================================================================ */
function closeAftermath() {
  const el = document.getElementById('aftermath-screen');
  if (el) el.classList.remove('show');
  // active is already reset inside HorrorScare timers
}

/* ================================================================
   GLOBAL INIT
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  HorrorCursor.init();
  HorrorParticles.init();
  HorrorReveal.init();
  initNav();
  initCounters();
  initIdleScare();
  HorrorScare.bindAftermath();   // watches aftermath visibility to reset active flag

  // Unlock audio on very first interaction
  const unlock = () => {
    HorrorAudio.unlock();
    HorrorFX.scheduleRandom();
  };
  ['click','touchstart','keydown'].forEach(e =>
    document.addEventListener(e, unlock, { once: true })
  );
});

/* ── Expose globals for inline onclick ── */
window.HorrorScare   = HorrorScare;
window.HorrorAudio   = HorrorAudio;
window.HorrorFX      = HorrorFX;
window.copyPrankLink = copyPrankLink;
window.closeAftermath = closeAftermath;
