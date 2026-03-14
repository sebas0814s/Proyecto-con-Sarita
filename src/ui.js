/**
 * ui.js
 * Responsabilidad: actualizar la interfaz de usuario (DOM).
 * Centraliza todos los cambios de pantalla, textos y animaciones UI.
 */

import { playCountTick, playCountGo } from './audio.js';

const screens = {
  start:    document.getElementById('screen-start'),
  game:     document.getElementById('screen-game'),
  gameover: document.getElementById('screen-gameover'),
};

const DIFF_NAMES = { easy: 'Fácil', normal: 'Normal', hard: 'Difícil' };

// ── Pantallas ─────────────────────────────────────────────────────
export function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    el.classList.toggle('active', key === name);
  });
}

// ── Puntaje ───────────────────────────────────────────────────────
export function updateScoreDisplay(score) {
  const el = document.getElementById('display-score');
  el.textContent = score.current;

  el.classList.remove('score-bump');
  void el.offsetWidth;
  el.classList.add('score-bump');

  document.getElementById('display-best').textContent = score.best;
}

// ── Combo ─────────────────────────────────────────────────────────
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
export function showDifficultyBadge(difficulty, name) {
  const badge       = document.getElementById('difficulty-badge');
  badge.className   = `difficulty-badge ${difficulty}`;
  badge.textContent = name;
}

export function syncDifficultyButtons(difficulty) {
  document.querySelectorAll('.btn-difficulty').forEach(btn => {
    btn.classList.toggle('active-diff', btn.dataset.difficulty === difficulty);
  });
}

// ── Countdown ─────────────────────────────────────────────────────
export function startCountdown(from, callback) {
  const overlay = document.getElementById('overlay-countdown');
  const numEl   = document.getElementById('countdown-number');

  overlay.classList.remove('hidden');

  let count = from;

  function step() {
    const isGo = count <= 0;

    numEl.textContent = isGo ? '¡GO!' : count;
    numEl.className   = isGo ? 'countdown-num go' : 'countdown-num';

    numEl.style.animation = 'none';
    void numEl.offsetWidth;
    numEl.style.animation = '';

    if (isGo) {
      playCountGo();
      setTimeout(() => {
        overlay.classList.add('hidden');
        callback();
      }, 700);
      return;
    }

    playCountTick();
    count--;
    setTimeout(step, 1000);
  }

  step();
}

// ── Game Over ─────────────────────────────────────────────────────
export function showGameOver(score, isRecord, topScores) {
  document.getElementById('final-score').textContent = score.current;
  document.getElementById('final-combo').textContent = `x${score.maxCombo}`;
  document.getElementById('new-record').classList.toggle('hidden', !isRecord);

  const badge       = document.getElementById('gameover-diff-badge');
  badge.className   = `difficulty-badge ${score.difficulty}`;
  badge.textContent = DIFF_NAMES[score.difficulty] || score.difficulty;

  const list = document.getElementById('highscores-list');
  list.innerHTML = '';

  let markedCurrent = false;

  (topScores || []).forEach((s, i) => {
    const isCurrent = !markedCurrent && s === score.current;
    if (isCurrent) markedCurrent = true;

    const li     = document.createElement('li');
    li.className = isCurrent ? 'hs-highlight' : '';
    li.innerHTML = `
      <span class="hs-rank">#${i + 1}</span>
      <span class="hs-score">${s.toLocaleString()}</span>
      ${isCurrent ? '<span class="hs-you">← tú</span>' : ''}
    `;
    list.appendChild(li);
  });

  showScreen('gameover');
}

// ── Pausa ─────────────────────────────────────────────────────────
export function setPauseOverlay(visible) {
  document.getElementById('overlay-pause').classList.toggle('hidden', !visible);
}
