/**
 * score.js
 * Puntuación competitiva: combo, multiplicadores y récords por dificultad.
 * Los top-5 se guardan en localStorage separados por dificultad.
 */

const SCORES_KEY = 'snake_scores_v2';
const MAX_STORED = 5;

// ── Configuraciones de dificultad ─────────────────────────────────
export const DIFFICULTY_CONFIGS = {
  easy: {
    name:              'Fácil',
    baseSpeed:         200,   // ms por tick al inicio
    speedDec:          1,     // ms que se restan por cada comida
    minSpeed:          130,   // ms mínimo (velocidad máxima)
    basePoints:        10,    // puntos base por comida
    wallWrap:          true,  // la culebra atraviesa paredes
    comboTimeout:      6000,  // ms sin comer para resetear combo
    specialChance:     0.15,  // probabilidad de comida especial
    specialDuration:   8000,  // ms que dura la comida especial
    specialMultiplier: 3,     // multiplicador extra para comida especial
  },
  normal: {
    name:              'Normal',
    baseSpeed:         150,
    speedDec:          2,
    minSpeed:          70,
    basePoints:        15,
    wallWrap:          false,
    comboTimeout:      4000,
    specialChance:     0.25,
    specialDuration:   6000,
    specialMultiplier: 4,
  },
  hard: {
    name:              'Difícil',
    baseSpeed:         100,
    speedDec:          3,
    minSpeed:          45,
    basePoints:        25,
    wallWrap:          false,
    comboTimeout:      2500,
    specialChance:     0.35,
    specialDuration:   4000,
    specialMultiplier: 5,
  },
};

// ── Persistencia ──────────────────────────────────────────────────
function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(SCORES_KEY)) || { easy: [], normal: [], hard: [] };
  } catch {
    return { easy: [], normal: [], hard: [] };
  }
}

function saveAll(data) {
  localStorage.setItem(SCORES_KEY, JSON.stringify(data));
}

// ── Score de partida ──────────────────────────────────────────────
/** Crea un objeto de puntaje limpio para una nueva partida. */
export function createScore(difficulty) {
  const all = loadAll();
  return {
    current:    0,
    best:       all[difficulty][0] || 0,
    combo:      1,
    maxCombo:   1,
    difficulty,
  };
}

/**
 * Calcula los puntos obtenidos al comer, con bonus de combo, tamaño y rapidez.
 * @param {object} score            estado actual del puntaje
 * @param {object} config           configuración de la dificultad
 * @param {number} snakeLength      longitud actual de la serpiente
 * @param {number} msSinceLastFood  milisegundos desde la última comida
 */
export function calcPoints(score, config, snakeLength, msSinceLastFood) {
  const timeRatio = Math.max(0, 1 - msSinceLastFood / config.comboTimeout);
  const comboMult = score.combo;
  const sizeMult  = 1 + snakeLength * 0.04;
  const timeMult  = 1 + timeRatio * 0.6;
  return Math.round(config.basePoints * comboMult * sizeMult * timeMult);
}

/** Suma puntos e incrementa el combo. Actualiza el mejor puntaje en memoria. */
export function addPoints(score, pts) {
  score.current += pts;
  score.combo    = Math.min(score.combo + 1, 10);
  score.maxCombo = Math.max(score.maxCombo, score.combo);
  if (score.current > score.best) score.best = score.current;
}

/** Resetea el combo a 1 (sin comer demasiado tiempo). */
export function resetCombo(score) {
  score.combo = 1;
}

/** ¿El puntaje actual supera el récord histórico guardado? */
export function isNewRecord(score) {
  const all = loadAll();
  const top = all[score.difficulty][0] || 0;
  return score.current > 0 && score.current > top;
}

/** Guarda el puntaje en el top-5 y devuelve el top-5 actualizado. */
export function saveScore(score) {
  const all = loadAll();
  all[score.difficulty].push(score.current);
  all[score.difficulty].sort((a, b) => b - a);
  all[score.difficulty] = all[score.difficulty].slice(0, MAX_STORED);
  saveAll(all);
  return all[score.difficulty];
}
