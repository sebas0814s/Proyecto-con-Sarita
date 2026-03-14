/**
 * audio.js
 * Responsabilidad: todos los sonidos del juego.
 * Usa exclusivamente Web Audio API (sin archivos externos).
 *
 * Patrón correcto para autoplay policy:
 *  1. Llamar a unlockAudio() en el primer gesto del usuario.
 *  2. El AudioContext se crea y resume de forma síncrona en ese gesto.
 *  3. A partir de ahí, cualquier función de sonido puede usarse libremente.
 */

let _ctx = null;

// ── Desbloqueo ────────────────────────────────────────────────────
/**
 * Crea y desbloquea el AudioContext.
 * DEBE llamarse directamente dentro de un handler de click/touch.
 * Idempotente: varias llamadas no crean varios contextos.
 */
export function unlockAudio() {
  if (_ctx) {
    if (_ctx.state === 'suspended') _ctx.resume();
    return;
  }
  try {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
    _ctx.resume(); // algunos navegadores lo crean suspendido incluso dentro del gesto
  } catch (e) {
    console.warn('[audio] Web Audio API no disponible:', e);
  }
}

/** Devuelve el contexto si está disponible, o null. */
function ac() {
  if (!_ctx) return null;
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

// ── Primitiva: tono con envelope ──────────────────────────────────
/**
 * Programa un tono breve.
 * @param {number}    freq    frecuencia Hz
 * @param {number}    dur     duración en segundos
 * @param {string}    type    tipo de onda ('sine' | 'sawtooth' | ...)
 * @param {number}    vol     volumen pico 0-1
 * @param {number}    delay   segundos de retraso adicional
 * @param {AudioNode} dest    nodo destino (por defecto: ctx.destination)
 */
function tone(freq, dur, type = 'sine', vol = 0.25, delay = 0, dest = null) {
  const ctx = ac();
  if (!ctx) return;

  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(dest ?? ctx.destination);

  osc.type            = type;
  osc.frequency.value = freq;

  // Pequeño buffer de 0.06s para que el contexto esté seguro de estar corriendo
  const t0 = ctx.currentTime + delay + 0.06;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  osc.start(t0);
  osc.stop(t0 + dur + 0.06);
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
  const freq = 329.6 * Math.pow(2, (level - 1) / 12);
  tone(freq, 0.07, 'sine', 0.12);
}

/** Colisión / muerte: tono descendente + ráfaga de ruido. */
export function playDeath() {
  const ctx = ac();
  if (!ctx) return;

  const t0 = ctx.currentTime + 0.06;

  // Tono sawtooth que cae
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(290, t0);
  osc.frequency.exponentialRampToValueAtTime(38, t0 + 0.52);
  gain.gain.setValueAtTime(0.32, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.62);
  osc.start(t0);
  osc.stop(t0 + 0.68);

  // Ráfaga de ruido blanco
  const samples = ctx.sampleRate * 0.13;
  const buffer  = ctx.createBuffer(1, samples, ctx.sampleRate);
  const data    = buffer.getChannelData(0);
  for (let i = 0; i < samples; i++) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  const ng  = ctx.createGain();
  src.buffer = buffer;
  src.connect(ng);
  ng.connect(ctx.destination);
  ng.gain.setValueAtTime(0.14, t0);
  ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.13);
  src.start(t0);
}

/** Tick de countdown (3, 2, 1). */
export function playCountTick() {
  tone(660, 0.06, 'sine', 0.2);
}

/** Acorde del ¡GO!. */
export function playCountGo() {
  tone(880,  0.12, 'sine', 0.28);
  tone(1108, 0.16, 'sine', 0.20, 0.03);
  tone(1320, 0.20, 'sine', 0.16, 0.06);
}

// ── Música de fondo (pantalla de inicio) ──────────────────────────
// Secuencia Am pentatónica lenta y ambiental
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

let bgGain   = null;
let bgActive = false;
let bgTimer  = null;
let bgStep   = 0;

function scheduleNextNote() {
  if (!bgActive || !bgGain) return;

  const ctx = ac();
  if (!ctx) return;

  const { f, d } = BG_SEQ[bgStep % BG_SEQ.length];
  bgStep++;

  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(bgGain);
  osc.type            = 'sine';
  osc.frequency.value = f;

  const t0      = ctx.currentTime;
  const attack  = 0.45;
  const release = 0.55;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(0.55, t0 + attack);
  gain.gain.setValueAtTime(0.55, t0 + d - release);
  gain.gain.linearRampToValueAtTime(0.0001, t0 + d);

  osc.start(t0);
  osc.stop(t0 + d + 0.1);

  bgTimer = setTimeout(scheduleNextNote, (d - 0.3) * 1000);
}

/**
 * Inicia la música ambiental de fondo.
 * Solo funciona si unlockAudio() fue llamado antes.
 * Idempotente.
 */
export function startBgMusic() {
  if (bgActive) return;
  const ctx = ac();
  if (!ctx) return; // audio no desbloqueado aún

  bgActive = true;
  bgStep   = 0;
  bgGain   = ctx.createGain();
  bgGain.gain.setValueAtTime(0.0001, ctx.currentTime);
  bgGain.gain.linearRampToValueAtTime(0.048, ctx.currentTime + 2.0);
  bgGain.connect(ctx.destination);

  scheduleNextNote();
}

/**
 * Detiene la música de fondo con fade-out suave.
 * Idempotente.
 */
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
    const ref = bgGain;
    bgGain    = null;
    setTimeout(() => { try { ref.disconnect(); } catch { /* ignorar */ } }, 600);
  }
}
