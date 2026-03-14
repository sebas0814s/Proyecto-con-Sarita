/**
 * audio.js
 * Responsabilidad: todos los sonidos del juego.
 * Usa exclusivamente Web Audio API (sin archivos externos).
 *
 * IMPORTANTE: el AudioContext sólo puede crearse tras un gesto del usuario.
 * Las funciones son seguras de llamar en cualquier momento; crean el contexto
 * de forma diferida cuando el navegador ya lo permite.
 */

let _ctx     = null;  // AudioContext compartido
let bgGain   = null;  // nodo de ganancia para la música de fondo
let bgActive = false;
let bgTimer  = null;
let bgStep   = 0;

// ── AudioContext ──────────────────────────────────────────────────
function ac() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

// ── Primitiva: tono con envelope ──────────────────────────────────
/**
 * Toca un tono simple.
 * @param {number}  freq   frecuencia en Hz
 * @param {number}  dur    duración en segundos
 * @param {string}  type   tipo de onda: 'sine' | 'square' | 'sawtooth' | 'triangle'
 * @param {number}  vol    volumen pico (0-1)
 * @param {number}  delay  segundos de retraso desde ahora
 * @param {AudioNode} dest nodo destino (por defecto: ac().destination)
 */
function tone(freq, dur, type = 'sine', vol = 0.25, delay = 0, dest = null) {
  const ctx  = ac();
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(dest ?? ctx.destination);

  osc.type          = type;
  osc.frequency.value = freq;

  const t0 = ctx.currentTime + delay;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// ── Efectos de juego ──────────────────────────────────────────────

/** Comer comida normal: blip ascendente breve. */
export function playEat() {
  tone(440, 0.07, 'sine', 0.22);
  tone(554, 0.10, 'sine', 0.17, 0.055);
}

/** Comer comida especial: arpeggio brillante de 4 notas. */
export function playSpecialEat() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((f, i) => {
    tone(f, i === 3 ? 0.22 : 0.09, 'sine', 0.28 - i * 0.03, i * 0.09);
  });
}

/**
 * Combo: ping cuya altura sube con el nivel.
 * @param {number} level nivel de combo (1-10)
 */
export function playCombo(level) {
  // Cada nivel sube un semitono a partir de E4 (329.6 Hz)
  const freq = 329.6 * Math.pow(2, (level - 1) / 12);
  tone(freq, 0.07, 'sine', 0.12);
}

/** Colisión / muerte: tono descendente + ráfaga de ruido. */
export function playDeath() {
  const ctx  = ac();

  // Tono sawtooth que cae
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(290, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 0.52);
  gain.gain.setValueAtTime(0.32, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.62);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.68);

  // Ráfaga de ruido blanco
  const samples = ctx.sampleRate * 0.13;
  const buffer  = ctx.createBuffer(1, samples, ctx.sampleRate);
  const data    = buffer.getChannelData(0);
  for (let i = 0; i < samples; i++) data[i] = Math.random() * 2 - 1;

  const src  = ctx.createBufferSource();
  const ng   = ctx.createGain();
  src.buffer = buffer;
  src.connect(ng);
  ng.connect(ctx.destination);
  ng.gain.setValueAtTime(0.14, ctx.currentTime);
  ng.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.13);
  src.start(ctx.currentTime);
}

/** Tick de countdown (3, 2, 1): clic suave y seco. */
export function playCountTick() {
  tone(660, 0.06, 'sine', 0.2);
}

/** "¡GO!" del countdown: acorde brillante. */
export function playCountGo() {
  tone(880, 0.12, 'sine', 0.28);
  tone(1108, 0.16, 'sine', 0.20, 0.03);
  tone(1320, 0.20, 'sine', 0.16, 0.06);
}

// ── Música de fondo (pantalla de inicio) ──────────────────────────
//  Secuencia Am pentatónica lenta y ambiental
const BG_SEQ = [
  { f: 220,   d: 2.2 }, // A3
  { f: 329.6, d: 2.0 }, // E4
  { f: 293.7, d: 1.8 }, // D4
  { f: 261.6, d: 2.2 }, // C4
  { f: 164.8, d: 2.6 }, // E3
  { f: 196,   d: 2.0 }, // G3
  { f: 220,   d: 2.4 }, // A3
  { f: 261.6, d: 2.0 }, // C4
];

function scheduleNextNote() {
  if (!bgActive || !bgGain) return;

  const ctx           = ac();
  const { f, d }      = BG_SEQ[bgStep % BG_SEQ.length];
  bgStep++;

  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(bgGain);
  osc.type          = 'sine';
  osc.frequency.value = f;

  const t0 = ctx.currentTime;
  const attack  = 0.45;
  const release = 0.55;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(0.55, t0 + attack);
  gain.gain.setValueAtTime(0.55, t0 + d - release);
  gain.gain.linearRampToValueAtTime(0, t0 + d);

  osc.start(t0);
  osc.stop(t0 + d + 0.1);

  // Programa la siguiente nota ligeramente antes de que termine ésta
  bgTimer = setTimeout(scheduleNextNote, (d - 0.3) * 1000);
}

/**
 * Inicia la música ambiental de fondo.
 * Idempotente: no hace nada si ya está activa.
 */
export function startBgMusic() {
  if (bgActive) return;
  bgActive = true;
  bgStep   = 0;

  const ctx = ac();
  bgGain    = ctx.createGain();

  // Fade-in muy suave (volumen final muy bajo para no molestar)
  bgGain.gain.setValueAtTime(0, ctx.currentTime);
  bgGain.gain.linearRampToValueAtTime(0.048, ctx.currentTime + 1.8);
  bgGain.connect(ctx.destination);

  scheduleNextNote();
}

/**
 * Detiene la música de fondo con un fade-out.
 * Idempotente: no hace nada si ya está inactiva.
 */
export function stopBgMusic() {
  if (!bgActive) return;
  bgActive = false;
  clearTimeout(bgTimer);

  if (bgGain) {
    const ctx = ac();
    bgGain.gain.cancelScheduledValues(ctx.currentTime);
    bgGain.gain.setValueAtTime(bgGain.gain.value, ctx.currentTime);
    bgGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    const nodeRef = bgGain;
    bgGain = null;
    setTimeout(() => { try { nodeRef.disconnect(); } catch { /* ya desconectado */ } }, 600);
  }
}
