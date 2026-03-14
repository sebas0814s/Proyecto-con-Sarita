/**
 * ui.js
 * Toda la interacción con el DOM: pantallas, overlays, notificaciones de logros,
 * modal de ajustes, panel de logros y todos los displays del juego.
 */

import { playCountTick, playCountGo, getMusicVol, getSfxVol, setMusicVol, setSfxVol } from './audio.js';
import { getAchievementsState }  from './achievements.js';
import { THEMES, setTheme, getCurrentTheme } from './theme.js';
import { getPlayerName, setPlayerName, getStreak } from './score.js';

const screens = {
  start:    document.getElementById('screen-start'),
  game:     document.getElementById('screen-game'),
  gameover: document.getElementById('screen-gameover'),
};

const DIFF_NAMES = { easy: 'Fácil', normal: 'Normal', hard: 'Difícil' };

// ── Pantallas ─────────────────────────────────────────────────────
export function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => el.classList.toggle('active', key === name));
}

// ── Puntaje ───────────────────────────────────────────────────────
export function updateScoreDisplay(score) {
  const el = document.getElementById('display-score');
  el.textContent = score.current;
  el.classList.remove('score-bump'); void el.offsetWidth; el.classList.add('score-bump');
  document.getElementById('display-best').textContent = score.best;
}

// ── Combo ─────────────────────────────────────────────────────────
export function updateComboDisplay(combo) {
  const el   = document.getElementById('display-combo');
  const stat = document.getElementById('combo-stat');
  el.textContent = `x${combo}`;
  if (combo > 1) { stat.classList.remove('combo-pop'); void stat.offsetWidth; stat.classList.add('combo-pop'); }
  else stat.classList.remove('combo-pop');
}

// ── Nivel ─────────────────────────────────────────────────────────
export function updateLevelDisplay(level) {
  const el = document.getElementById('display-level');
  if (!el) return;
  el.textContent = `Nv.${level}`;
  el.classList.remove('level-pop'); void el.offsetWidth; el.classList.add('level-pop');
}

/** Muestra el banner de "¡Nivel X!" que aparece en pantalla brevemente. */
export function showLevelUpBanner(level) {
  const el = document.getElementById('level-up-banner');
  if (!el) return;
  el.textContent = `⬆ Nivel ${level}`;
  el.classList.remove('hidden', 'level-banner-hide');
  el.classList.add('level-banner-show');
  setTimeout(() => {
    el.classList.replace('level-banner-show', 'level-banner-hide');
    setTimeout(() => el.classList.add('hidden'), 600);
  }, 1500);
}

// ── Indicadores de poder ──────────────────────────────────────────
export function showSlowIndicator(active) {
  document.getElementById('indicator-slow')?.classList.toggle('hidden', !active);
}
export function showShieldIndicator(active) {
  document.getElementById('indicator-shield')?.classList.toggle('hidden', !active);
}

// ── Badge de dificultad ───────────────────────────────────────────
export function showDifficultyBadge(difficulty, name) {
  const badge = document.getElementById('difficulty-badge');
  if (!badge) return;
  badge.className   = `difficulty-badge ${difficulty}`;
  badge.textContent = name;
}

export function syncDifficultyButtons(difficulty) {
  document.querySelectorAll('.btn-difficulty').forEach(btn =>
    btn.classList.toggle('active-diff', btn.dataset.difficulty === difficulty),
  );
}

// ── Racha en pantalla de inicio ────────────────────────────────────
export function updateStreakDisplay() {
  const el     = document.getElementById('streak-display');
  const streak = getStreak();
  if (!el) return;
  if (streak >= 2) {
    el.textContent = `🔥 ${streak} días seguidos`;
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
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
    numEl.style.animation = 'none'; void numEl.offsetWidth; numEl.style.animation = '';
    if (isGo) {
      playCountGo();
      setTimeout(() => { overlay.classList.add('hidden'); callback(); }, 700);
      return;
    }
    playCountTick(); count--; setTimeout(step, 1000);
  }
  step();
}

// ── Game Over ─────────────────────────────────────────────────────
export function showGameOver(score, isRecord, topScores) {
  document.getElementById('final-score').textContent = score.current.toLocaleString();
  document.getElementById('final-combo').textContent = `x${score.maxCombo}`;
  document.getElementById('final-level').textContent = `Nv.${score.level}`;
  document.getElementById('new-record').classList.toggle('hidden', !isRecord);

  const badge = document.getElementById('gameover-diff-badge');
  badge.className   = `difficulty-badge ${score.difficulty}`;
  badge.textContent = DIFF_NAMES[score.difficulty] || score.difficulty;

  const list = document.getElementById('highscores-list');
  list.innerHTML = '';
  let marked = false;
  (topScores || []).forEach((entry, i) => {
    const s       = typeof entry === 'object' ? entry.score : entry;
    const name    = entry?.name ?? '—';
    const isCurr  = !marked && s === score.current;
    if (isCurr) marked = true;
    const li      = document.createElement('li');
    li.className  = isCurr ? 'hs-highlight' : '';
    li.innerHTML  = `
      <span class="hs-rank">#${i+1}</span>
      <span class="hs-name">${name}</span>
      <span class="hs-score">${s.toLocaleString()}</span>
      ${isCurr ? '<span class="hs-you">← tú</span>' : ''}`;
    list.appendChild(li);
  });

  showScreen('gameover');
}

// ── Pausa ─────────────────────────────────────────────────────────
export function setPauseOverlay(visible) {
  document.getElementById('overlay-pause').classList.toggle('hidden', !visible);
}

// ── Notificación de logro ─────────────────────────────────────────
let notifQueue = [], notifBusy = false;

export function showAchievementNotif(achievement) {
  notifQueue.push(achievement);
  if (!notifBusy) processNotifQueue();
}

function processNotifQueue() {
  if (!notifQueue.length) { notifBusy = false; return; }
  notifBusy  = true;
  const ach  = notifQueue.shift();
  const el   = document.getElementById('achievement-notif');
  if (!el) { processNotifQueue(); return; }

  el.querySelector('.notif-icon').textContent = ach.icon;
  el.querySelector('.notif-name').textContent = ach.name;
  el.querySelector('.notif-desc').textContent = ach.desc;

  el.classList.remove('hidden', 'notif-out');
  el.classList.add('notif-in');

  setTimeout(() => {
    el.classList.replace('notif-in', 'notif-out');
    setTimeout(() => { el.classList.add('hidden'); processNotifQueue(); }, 500);
  }, 3000);
}

// ── Modal de ajustes ──────────────────────────────────────────────
export function initSettingsModal() {
  const modal    = document.getElementById('modal-settings');
  const btnOpen  = document.getElementById('btn-settings');
  const btnClose = document.getElementById('btn-settings-close');

  btnOpen ?.addEventListener('click', () => { fillSettings(); modal.classList.remove('hidden'); });
  btnClose?.addEventListener('click', () => modal.classList.add('hidden'));
  modal   ?.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
}

function fillSettings() {
  // Nombre
  const nameInput = document.getElementById('input-player-name');
  if (nameInput) nameInput.value = getPlayerName();

  // Volumen música
  const sliderM = document.getElementById('slider-music');
  if (sliderM) { sliderM.value = getMusicVol(); sliderM.oninput = () => setMusicVol(+sliderM.value); }

  // Volumen efectos
  const sliderS = document.getElementById('slider-sfx');
  if (sliderS) { sliderS.value = getSfxVol(); sliderS.oninput = () => setSfxVol(+sliderS.value); }

  // Guardar nombre al cambiar
  if (nameInput) nameInput.oninput = () => setPlayerName(nameInput.value);

  // Temas
  document.querySelectorAll('.btn-theme').forEach(btn => {
    btn.classList.toggle('active-theme', btn.dataset.theme === document.documentElement.dataset.theme);
    btn.onclick = () => {
      setTheme(btn.dataset.theme);
      document.querySelectorAll('.btn-theme').forEach(b => b.classList.remove('active-theme'));
      btn.classList.add('active-theme');
    };
  });
}

// ── Panel de logros ───────────────────────────────────────────────
export function initAchievementsPanel() {
  const modal    = document.getElementById('modal-achievements');
  const btnOpen  = document.getElementById('btn-achievements');
  const btnClose = document.getElementById('btn-achievements-close');

  btnOpen ?.addEventListener('click', () => { renderAchievements(); modal.classList.remove('hidden'); });
  btnClose?.addEventListener('click', () => modal.classList.add('hidden'));
  modal   ?.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
}

function renderAchievements() {
  const grid = document.getElementById('achievements-grid');
  if (!grid) return;
  const state = getAchievementsState();
  const total = state.length;
  const done  = state.filter(a => a.unlocked).length;

  document.getElementById('ach-progress').textContent = `${done} / ${total}`;
  grid.innerHTML = '';

  state.forEach(a => {
    const div       = document.createElement('div');
    div.className   = `ach-card ${a.unlocked ? 'ach-unlocked' : 'ach-locked'}`;
    div.innerHTML   = `
      <span class="ach-icon">${a.unlocked ? a.icon : '🔒'}</span>
      <span class="ach-name">${a.name}</span>
      <span class="ach-desc">${a.unlocked ? a.desc : '???'}</span>`;
    grid.appendChild(div);
  });
}
