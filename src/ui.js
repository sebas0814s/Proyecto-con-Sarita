/**
 * ui.js
 * Responsabilidad: actualizar la interfaz de usuario (DOM).
 * Centraliza todos los cambios de pantalla y textos para que
 * el resto del código no toque el DOM directamente.
 */

const screens = {
  start:    document.getElementById('screen-start'),
  game:     document.getElementById('screen-game'),
  gameover: document.getElementById('screen-gameover'),
};

/** Muestra solo la pantalla indicada y oculta las demás. */
export function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    el.classList.toggle('active', key === name);
  });
}

/** Actualiza los contadores de puntaje en pantalla. */
export function updateScoreDisplay(score) {
  document.getElementById('display-score').textContent = score.current;
  document.getElementById('display-best').textContent  = score.best;
}

/** Muestra la pantalla de Game Over con el puntaje final. */
export function showGameOver(score, isRecord) {
  document.getElementById('final-score').textContent = score.current;
  document.getElementById('new-record').classList.toggle('hidden', !isRecord);
  showScreen('gameover');
}

/** Muestra u oculta el overlay de pausa. */
export function setPauseOverlay(visible) {
  document.getElementById('overlay-pause').classList.toggle('hidden', !visible);
}
