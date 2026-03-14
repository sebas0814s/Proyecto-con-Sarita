/**
 * ui.js
 * Responsabilidad: actualizar la interfaz de usuario (DOM).
 * Centraliza todos los cambios de pantalla, textos y animaciones UI.
 */

const screens = {
  start:    document.getElementById('screen-start'),
  game:     document.getElementById('screen-game'),
  gameover: document.getElementById('screen-gameover'),
};

const DIFF_NAMES = { easy: 'Fácil', normal: 'Normal', hard: 'Difícil' };

// ── Pantallas ─────────────────────────────────────────────────────
/** Muestra solo la pantalla indicada y oculta las demás. */
export function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    el.classList.toggle('active', key === name);
  });
}

// ── Puntaje ───────────────────────────────────────────────────────
/** Actualiza los contadores de puntaje en pantalla con efecto visual. */
export function updateScoreDisplay(score) {
  const el = document.getElementById('display-score');
  el.textContent = score.current;

  // Reinicia la animación de bump
  el.classList.remove('score-bump');
  void el.offsetWidth;
  el.classList.add('score-bump');

  document.getElementById('display-best').textContent = score.best;
}

// ── Combo ─────────────────────────────────────────────────────────
/** Actualiza el display de combo con animación de pulso. */
export function updateComboDisplay(combo) {
  const el   = document.getElementById('display-combo');
  const stat = document.getElementById('combo-stat');

  el.textContent = `x${combo}`;

  if (combo > 1) {
    stat.classList.remove('combo-pop');
    void stat.offsetWidth;
    stat.classList.add('combo-pop');
  } else {
    stat.classList.remove('combo-pop');
  }
}

// ── Badge de dificultad ───────────────────────────────────────────
/** Muestra el badge de dificultad en la pantalla de juego. */
export function showDifficultyBadge(difficulty, name) {
  const badge       = document.getElementById('difficulty-badge');
  badge.className   = `difficulty-badge ${difficulty}`;
  badge.textContent = name;
}

/** Sincroniza los botones de dificultad visualmente con el valor actual. */
export function syncDifficultyButtons(difficulty) {
  document.querySelectorAll('.btn-difficulty').forEach(btn => {
    btn.classList.toggle('active-diff', btn.dataset.difficulty === difficulty);
  });
}

// ── Countdown ─────────────────────────────────────────────────────
/**
 * Muestra una cuenta regresiva N…1 → ¡GO! y ejecuta callback al terminar.
 * @param {number}   from      número desde el que contar (ej. 3)
 * @param {function} callback  función a ejecutar cuando termina el countdown
 */
export function startCountdown(from, callback) {
  const overlay = document.getElementById('overlay-countdown');
  const numEl   = document.getElementById('countdown-number');

  overlay.classList.remove('hidden');

  let count = from;

  function step() {
    const isGo = count <= 0;

    numEl.textContent = isGo ? '¡GO!' : count;
    numEl.className   = isGo ? 'countdown-num go' : 'countdown-num';

    // Reinicia la animación en cada número
    numEl.style.animation = 'none';
    void numEl.offsetWidth;
    numEl.style.animation = '';

    if (isGo) {
      setTimeout(() => {
        overlay.classList.add('hidden');
        callback();
      }, 700);
      return;
    }

    count--;
    setTimeout(step, 1000);
  }

  step();
}

// ── Game Over ─────────────────────────────────────────────────────
/**
 * Muestra la pantalla de fin de partida con puntaje, combo y top-5.
 * @param {object}   score      estado final de puntuación
 * @param {boolean}  isRecord   true si se superó el récord
 * @param {number[]} topScores  array con los top-5 puntajes guardados
 */
export function showGameOver(score, isRecord, topScores) {
  document.getElementById('final-score').textContent = score.current;
  document.getElementById('final-combo').textContent = `x${score.maxCombo}`;
  document.getElementById('new-record').classList.toggle('hidden', !isRecord);

  // Badge de dificultad
  const badge       = document.getElementById('gameover-diff-badge');
  badge.className   = `difficulty-badge ${score.difficulty}`;
  badge.textContent = DIFF_NAMES[score.difficulty] || score.difficulty;

  // Lista de high scores
  const list = document.getElementById('highscores-list');
  list.innerHTML = '';

  let markedCurrent = false;

  (topScores || []).forEach((s, i) => {
    const isCurrent = !markedCurrent && s === score.current;
    if (isCurrent) markedCurrent = true;

    const li       = document.createElement('li');
    li.className   = isCurrent ? 'hs-highlight' : '';
    li.innerHTML   = `
      <span class="hs-rank">#${i + 1}</span>
      <span class="hs-score">${s.toLocaleString()}</span>
      ${isCurrent ? '<span class="hs-you">← tú</span>' : ''}
    `;
    list.appendChild(li);
  });

  showScreen('gameover');
}

// ── Pausa ─────────────────────────────────────────────────────────
/** Muestra u oculta el overlay de pausa. */
export function setPauseOverlay(visible) {
  document.getElementById('overlay-pause').classList.toggle('hidden', !visible);
}
