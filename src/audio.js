/**
 * audio.js
 * Todos los sonidos del juego con Web Audio API.
 * Control de volumen independiente para música y efectos.
 */

const VOL_MUSIC_KEY = 'snake_vol_music';
const VOL_SFX_KEY   = 'snake_vol_sfx';

let _ctx      = null;
let bgGain    = null;
let sfxMaster = null; // nodo maestro para efectos
let bgActive  = false;
let bgTimer   = null;
let bgStep    = 0;

let musicVol = parseFloat(localStorage.getItem(VOL_MUSIC_KEY) ?? '0.5');
let sfxVol   = parseFloat(localStorage.getItem(VOL_SFX_KEY)   ?? '0.8');

// ── AudioContext ──────────────────────────────────────────────────
export function unlockAudio() {
  if (_ctx) { if (_ctx.state === 'suspended') _ctx.resume(); return; }
  try {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
    _ctx.resume();

    // Nodo maestro para SFX
    sfxMaster = _ctx.createGain();
    sfxMaster.gain.value = sfxVol;
    sfxMaster.connect(_ctx.destination);
  } catch (e) { console.warn('[audio]', e); }
}

function ac() {
  if (!_ctx) return null;
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

// ── Volumen ───────────────────────────────────────────────────────
export function getMusicVol() { return musicVol; }
export function getSfxVol()   { return sfxVol; }

export function setMusicVol(v) {
  musicVol = Math.max(0, Math.min(1, v));
  localStorage.setItem(VOL_MUSIC_KEY, String(musicVol));
  if (bgGain) bgGain.gain.value = musicVol * 0.1;
}

export function setSfxVol(v) {
  sfxVol = Math.max(0, Math.min(1, v));
  localStorage.setItem(VOL_SFX_KEY, String(sfxVol));
  if (sfxMaster) sfxMaster.gain.value = sfxVol;
}

// ── Primitiva: tono ───────────────────────────────────────────────
function tone(freq, dur, type = 'sine', vol = 0.25, delay = 0) {
  const ctx = ac();
  if (!ctx || !sfxMaster) return;

  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(sfxMaster);

  osc.type            = type;
  osc.frequency.value = freq;

  const t0 = ctx.currentTime + delay + 0.06;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.start(t0);
  osc.stop(t0 + dur + 0.06);
}

// ── Efectos ───────────────────────────────────────────────────────
export function playEat()       { tone(440, 0.07, 'sine', 0.22); tone(554, 0.10, 'sine', 0.17, 0.055); }
export function playSpecialEat(){ [523,659,784,1047].forEach((f,i) => tone(f, i===3?0.22:0.09, 'sine', 0.28-i*0.03, i*0.09)); }
export function playSlowEat()   { tone(330, 0.12, 'sine', 0.18); tone(220, 0.16, 'sine', 0.14, 0.10); }
export function playShieldEat() { tone(660, 0.08, 'sine', 0.22); tone(880, 0.12, 'sine', 0.18, 0.07); tone(1100, 0.15, 'sine', 0.14, 0.14); }
export function playCombo(lvl)  { tone(329.6 * Math.pow(2, (lvl-1)/12), 0.07, 'sine', 0.12); }

/** Subida de nivel: acorde ascendente más elaborado. */
export function playLevelUp() {
  [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.14, 'sine', 0.2 - i * 0.02, i * 0.08));
}

export function playShieldBlock() {
  tone(880, 0.05, 'square', 0.15);
  tone(440, 0.18, 'sine',   0.12, 0.06);
}

export function playCountTick() { tone(660, 0.06, 'sine', 0.2); }
export function playCountGo()   { tone(880,0.12,'sine',0.28); tone(1108,0.16,'sine',0.20,0.03); tone(1320,0.20,'sine',0.16,0.06); }

export function playDeath() {
  const ctx = ac();
  if (!ctx || !sfxMaster) return;
  const t0  = ctx.currentTime + 0.06;
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.connect(gain); gain.connect(sfxMaster);
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(290, t0);
  osc.frequency.exponentialRampToValueAtTime(38, t0 + 0.52);
  gain.gain.setValueAtTime(0.32, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.62);
  osc.start(t0); osc.stop(t0 + 0.68);

  const samples = ctx.sampleRate * 0.13;
  const buf = ctx.createBuffer(1, samples, ctx.sampleRate);
  const d   = buf.getChannelData(0);
  for (let i = 0; i < samples; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(), ng = ctx.createGain();
  src.buffer = buf; src.connect(ng); ng.connect(sfxMaster);
  ng.gain.setValueAtTime(0.14, t0);
  ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.13);
  src.start(t0);
}

// ── Música de fondo ───────────────────────────────────────────────
const BG_SEQ = [
  {f:220,d:2.2},{f:329.6,d:2.0},{f:293.7,d:1.8},{f:261.6,d:2.2},
  {f:164.8,d:2.6},{f:196,d:2.0},{f:220,d:2.4},{f:261.6,d:2.0},
];

function scheduleNextNote() {
  if (!bgActive || !bgGain) return;
  const ctx = ac(); if (!ctx) return;
  const {f, d} = BG_SEQ[bgStep % BG_SEQ.length]; bgStep++;
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.connect(gain); gain.connect(bgGain);
  osc.type = 'sine'; osc.frequency.value = f;
  const t0 = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(0.55, t0 + 0.45);
  gain.gain.setValueAtTime(0.55, t0 + d - 0.55);
  gain.gain.linearRampToValueAtTime(0.0001, t0 + d);
  osc.start(t0); osc.stop(t0 + d + 0.1);
  bgTimer = setTimeout(scheduleNextNote, (d - 0.3) * 1000);
}

export function startBgMusic() {
  if (bgActive) return;
  const ctx = ac(); if (!ctx) return;
  bgActive = true; bgStep = 0;
  bgGain   = ctx.createGain();
  bgGain.gain.setValueAtTime(0.0001, ctx.currentTime);
  bgGain.gain.linearRampToValueAtTime(musicVol * 0.1, ctx.currentTime + 2.0);
  bgGain.connect(ctx.destination);
  scheduleNextNote();
}

export function stopBgMusic() {
  if (!bgActive) return;
  bgActive = false;
  clearTimeout(bgTimer);
  if (bgGain) {
    const ctx = ac();
    if (ctx) {
      bgGain.gain.cancelScheduledValues(ctx.currentTime);
      bgGain.gain.setValueAtTime(bgGain.gain.value, ctx.currentTime);
      bgGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    }
    const ref = bgGain; bgGain = null;
    setTimeout(() => { try { ref.disconnect(); } catch { /* ignorar */ } }, 600);
  }
}
