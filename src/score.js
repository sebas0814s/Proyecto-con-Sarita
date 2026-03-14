/**
 * score.js
 * Puntuación competitiva: combo, niveles, nombres, racha diaria y récords por dificultad.
 */

const SCORES_KEY    = 'snake_scores_v3';
const PLAYER_KEY    = 'snake_player_name';
const STREAK_KEY    = 'snake_streak';
const LAST_PLAY_KEY = 'snake_last_play';

const MAX_STORED      = 5;
export const FOODS_PER_LEVEL = 5; // comidas para subir de nivel

// ── Configuraciones de dificultad ─────────────────────────────────
export const DIFFICULTY_CONFIGS = {
  easy: {
    name:              'Fácil',
    baseSpeed:         200,
    speedDec:          1,
    minSpeed:          130,
    basePoints:        10,
    wallWrap:          true,
    comboTimeout:      6000,
    specialChance:     0.15,
    specialDuration:   8000,
    specialMultiplier: 3,
    powerupChance:     0.10,
    powerupDuration:   8000,
    obstacleCount:     0,
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
    powerupChance:     0.15,
    powerupDuration:   6000,
    obstacleCount:     0,
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
    powerupChance:     0.20,
    powerupDuration:   5000,
    obstacleCount:     4,   // paredes iniciales
  },
};

// ── Nombre del jugador ────────────────────────────────────────────
export function getPlayerName() {
  return localStorage.getItem(PLAYER_KEY) || '';
}
export function setPlayerName(name) {
  localStorage.setItem(PLAYER_KEY, (name ?? '').trim().slice(0, 14));
}

// ── Racha diaria ──────────────────────────────────────────────────
export function getStreak() {
  return parseInt(localStorage.getItem(STREAK_KEY) || '0', 10);
}

/** Actualiza la racha al iniciar una partida. Devuelve la racha nueva. */
export function updateStreak() {
  const today    = new Date().toISOString().split('T')[0];
  const lastPlay = localStorage.getItem(LAST_PLAY_KEY);
  const streak   = getStreak();

  let next = 1;
  if (lastPlay) {
    const diff = Math.round((new Date(today) - new Date(lastPlay)) / 86400000);
    if (diff === 0) next = streak;         // mismo día
    else if (diff === 1) next = streak + 1; // día siguiente
    // else: racha rota → 1
  }

  localStorage.setItem(STREAK_KEY, String(next));
  localStorage.setItem(LAST_PLAY_KEY, today);
  return next;
}

// ── Persistencia de scores ────────────────────────────────────────
function loadAll() {
  try { return JSON.parse(localStorage.getItem(SCORES_KEY)) || { easy: [], normal: [], hard: [] }; }
  catch { return { easy: [], normal: [], hard: [] }; }
}
function saveAll(data) { localStorage.setItem(SCORES_KEY, JSON.stringify(data)); }

function entryScore(e) { return typeof e === 'object' ? e.score : e; }

// ── Score de partida ──────────────────────────────────────────────
export function createScore(difficulty) {
  const list = loadAll()[difficulty];
  return {
    current:       0,
    best:          list[0] ? entryScore(list[0]) : 0,
    combo:         1,
    maxCombo:      1,
    difficulty,
    level:         1,
    foodEaten:     0,
    specialEaten:  0,
  };
}

/**
 * Puntos al comer: combo × tamaño × tiempo × nivel.
 */
export function calcPoints(score, config, snakeLength, msSinceLastFood) {
  const timeRatio = Math.max(0, 1 - msSinceLastFood / config.comboTimeout);
  return Math.round(
    config.basePoints
    * score.combo
    * (1 + snakeLength * 0.04)
    * (1 + timeRatio * 0.6)
    * (1 + (score.level - 1) * 0.1),
  );
}

/**
 * Suma puntos, actualiza combo y nivel.
 * @returns {boolean} true si se subió de nivel
 */
export function addPoints(score, pts) {
  score.current += pts;
  score.foodEaten++;
  score.combo    = Math.min(score.combo + 1, 10);
  score.maxCombo = Math.max(score.maxCombo, score.combo);
  if (score.current > score.best) score.best = score.current;

  const newLevel  = Math.floor(score.foodEaten / FOODS_PER_LEVEL) + 1;
  const leveledUp = newLevel > score.level;
  score.level     = newLevel;
  return leveledUp;
}

export function resetCombo(score) { score.combo = 1; }

export function isNewRecord(score) {
  const list = loadAll()[score.difficulty];
  const top  = list[0] ? entryScore(list[0]) : 0;
  return score.current > 0 && score.current > top;
}

/** Guarda y devuelve el top-5 actualizado. */
export function saveScore(score) {
  const all   = loadAll();
  const entry = {
    score: score.current,
    name:  getPlayerName() || 'Anónimo',
    level: score.level,
  };
  all[score.difficulty].push(entry);
  all[score.difficulty].sort((a, b) => entryScore(b) - entryScore(a));
  all[score.difficulty] = all[score.difficulty].slice(0, MAX_STORED);
  saveAll(all);
  return all[score.difficulty];
}
