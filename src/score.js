/**
 * score.js
 * Responsabilidad: manejo del puntaje y récord.
 * El récord se guarda en localStorage para que persista entre partidas.
 */

const BEST_SCORE_KEY = 'snake_best_score';
const POINTS_PER_FOOD = 10;

/** Crea un objeto de puntaje limpio para una nueva partida. */
export function createScore() {
  return {
    current: 0,
    best: loadBestScore(),
  };
}

/** Suma puntos al puntaje actual y actualiza el récord si es necesario. */
export function addPoints(score) {
  score.current += POINTS_PER_FOOD;

  if (score.current > score.best) {
    score.best = score.current;
    saveBestScore(score.best);
  }
}

/** Indica si la partida actual superó el récord histórico. */
export function isNewRecord(score) {
  return score.current >= score.best && score.current > 0;
}

/** Lee el récord guardado en localStorage. */
function loadBestScore() {
  return parseInt(localStorage.getItem(BEST_SCORE_KEY) || '0', 10);
}

/** Guarda el récord en localStorage. */
function saveBestScore(value) {
  localStorage.setItem(BEST_SCORE_KEY, String(value));
}
