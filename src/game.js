/**
 * game.js
 * Responsabilidad: bucle principal del juego.
 * Orquesta todos los módulos y gestiona:
 *  - 3 niveles de dificultad (Fácil / Normal / Difícil)
 *  - Sistema de combo con timeout
 *  - Comida especial temporal (estrella dorada)
 *  - Animación de muerte (parpadeo rojo)
 *  - Cuenta regresiva antes de empezar
 *  - Modo sin-muros en dificultad Fácil
 */

import {
  CELL_SIZE,
  initBoard, clearBoard,
  drawSnakeSegment, drawFood,
  spawnParticles, updateAndDrawParticles, clearParticles,
} from './board.js';

import {
  createSnake, changeDirection, moveSnake,
  getHead, hitWall, hitSelf, wrapSnake,
} from './snake.js';

import { spawnFood, isEaten }   from './food.js';
import { registerInput }        from './input.js';

import {
  createScore, calcPoints, addPoints, resetCombo,
  isNewRecord, saveScore, DIFFICULTY_CONFIGS,
} from './score.js';

import {
  showScreen, updateScoreDisplay, showGameOver, setPauseOverlay,
  startCountdown, updateComboDisplay, showDifficultyBadge,
  syncDifficultyButtons,
} from './ui.js';

// ── Estado global ─────────────────────────────────────────────────
let ctx;
let snake, food, specialFood;
let score, config;
let paused, gameOver;
let speedMs, lastTickTime;
let animationId, removeInputListeners;
let lastFoodTime;             // timestamp (raf) del último alimento comido
let selectedDifficulty;

// Estado de animación de muerte
let deathPhase = null;        // null | 'running'
let deathStart = 0;

// ── Inicialización (una sola vez) ─────────────────────────────────
function init() {
  ctx                = initBoard();
  selectedDifficulty = 'normal';
  bindButtons();
  showScreen('start');
}

function bindButtons() {
  document.getElementById('btn-start')  .addEventListener('click', requestCountdown);
  document.getElementById('btn-restart').addEventListener('click', requestCountdown);
  document.getElementById('btn-menu')   .addEventListener('click', goToMenu);
  document.getElementById('btn-pause')  .addEventListener('click', togglePause);
  document.getElementById('btn-resume') .addEventListener('click', togglePause);

  document.querySelectorAll('.btn-difficulty').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-difficulty')
        .forEach(b => b.classList.remove('active-diff'));
      btn.classList.add('active-diff');
      selectedDifficulty = btn.dataset.difficulty;
    });
  });
}

function goToMenu() {
  showScreen('start');
  syncDifficultyButtons(selectedDifficulty);
}

// ── Countdown + arranque ──────────────────────────────────────────
function requestCountdown() {
  if (removeInputListeners) removeInputListeners();
  if (animationId) cancelAnimationFrame(animationId);

  config = DIFFICULTY_CONFIGS[selectedDifficulty];

  showScreen('game');
  clearBoard(ctx); // canvas limpio mientras cuenta atrás
  showDifficultyBadge(selectedDifficulty, config.name);
  startCountdown(3, startGame);
}

function startGame() {
  snake        = createSnake();
  food         = spawnFood(snake, false);
  specialFood  = null;
  score        = createScore(selectedDifficulty);
  paused       = false;
  gameOver     = false;
  speedMs      = config.baseSpeed;
  lastTickTime = 0;
  lastFoodTime = 0;
  deathPhase   = null;

  clearParticles();
  updateScoreDisplay(score);
  updateComboDisplay(1);
  setPauseOverlay(false);

  removeInputListeners = registerInput(
    dir => changeDirection(snake, dir),
    togglePause,
  );

  animationId = requestAnimationFrame(loop);
}

// ── Bucle principal ───────────────────────────────────────────────
function loop(timestamp) {
  if (gameOver) return;

  animationId = requestAnimationFrame(loop);

  // Animación de muerte tiene prioridad
  if (deathPhase === 'running') {
    runDeathAnimation(timestamp);
    return;
  }

  if (paused) return;

  // Inicializa lastFoodTime con el primer timestamp real
  if (lastFoodTime === 0) lastFoodTime = timestamp;

  // Render cada frame → partículas y comida siempre fluidos
  render(timestamp);

  // Combo timeout: resetear si lleva demasiado sin comer
  if (score.combo > 1 && timestamp - lastFoodTime > config.comboTimeout) {
    resetCombo(score);
    updateComboDisplay(score.combo);
  }

  // Comida especial: desaparece si caduca
  if (specialFood && timestamp - specialFood.spawnTime > config.specialDuration) {
    specialFood = null;
  }

  const elapsed = timestamp - lastTickTime;
  if (elapsed < speedMs) return; // Aún no toca avanzar la lógica
  lastTickTime = timestamp;

  gameTick(timestamp);
}

// ── Lógica de un tick ─────────────────────────────────────────────
function gameTick(timestamp) {
  const head       = getHead(snake);
  const ateFood    = isEaten(head, food);
  const ateSpecial = specialFood ? isEaten(head, specialFood) : false;

  moveSnake(snake, ateFood || ateSpecial);

  // Colisiones según modo
  if (config.wallWrap) {
    wrapSnake(snake);
    if (hitSelf(snake)) { startDeathAnimation(timestamp); return; }
  } else {
    if (hitWall(snake) || hitSelf(snake)) { startDeathAnimation(timestamp); return; }
  }

  // Comer comida normal
  if (ateFood) {
    const pts = calcPoints(score, config, snake.segments.length, timestamp - lastFoodTime);
    addPoints(score, pts);
    spawnParticles(food, pts);
    lastFoodTime = timestamp;
    food         = spawnFood(snake, false);
    speedMs      = Math.max(config.minSpeed, speedMs - config.speedDec);

    // Posible aparición de comida especial
    if (!specialFood && Math.random() < config.specialChance) {
      specialFood           = spawnFood(snake, true);
      specialFood.spawnTime = timestamp;
    }

    updateScoreDisplay(score);
    updateComboDisplay(score.combo);
  }

  // Comer comida especial
  if (ateSpecial) {
    const specPts = calcPoints(score, config, snake.segments.length, timestamp - lastFoodTime)
                    * config.specialMultiplier;
    addPoints(score, specPts);
    spawnParticles(specialFood, specPts);
    lastFoodTime = timestamp;
    specialFood  = null;
    speedMs      = Math.max(config.minSpeed, speedMs - config.speedDec * 2);

    updateScoreDisplay(score);
    updateComboDisplay(score.combo);
  }
}

// ── Render ────────────────────────────────────────────────────────
function render(timestamp) {
  clearBoard(ctx);
  drawFood(ctx, food, timestamp);
  if (specialFood) drawFood(ctx, specialFood, timestamp);
  snake.segments.forEach((seg, i) =>
    drawSnakeSegment(ctx, seg, i, snake.segments.length, snake.direction),
  );
  updateAndDrawParticles(ctx);
}

// ── Animación de muerte ───────────────────────────────────────────
const DEATH_DURATION   = 900; // ms totales
const DEATH_FLASH_RATE = 110; // ms por destello

function startDeathAnimation(timestamp) {
  deathPhase = 'running';
  deathStart = timestamp;
}

function runDeathAnimation(timestamp) {
  const elapsed = timestamp - deathStart;

  if (elapsed >= DEATH_DURATION) {
    endGame();
    return;
  }

  clearBoard(ctx);

  const flashOn = Math.floor(elapsed / DEATH_FLASH_RATE) % 2 === 0;

  snake.segments.forEach((seg, i) => {
    if (flashOn) {
      // Destello rojo
      const px = seg.col * CELL_SIZE;
      const py = seg.row * CELL_SIZE;
      ctx.fillStyle   = '#e94560';
      ctx.shadowColor = '#e94560';
      ctx.shadowBlur  = 20;
      ctx.beginPath();
      ctx.roundRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4, i === 0 ? 7 : 3);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      drawSnakeSegment(ctx, seg, i, snake.segments.length, snake.direction);
    }
  });

  updateAndDrawParticles(ctx);
}

// ── Pausa ─────────────────────────────────────────────────────────
function togglePause() {
  if (gameOver || deathPhase) return;
  paused = !paused;
  setPauseOverlay(paused);
}

// ── Fin del juego ─────────────────────────────────────────────────
function endGame() {
  gameOver   = true;
  deathPhase = null;
  cancelAnimationFrame(animationId);
  if (removeInputListeners) removeInputListeners();

  const newRecord = isNewRecord(score);
  const topScores = saveScore(score);

  showGameOver(score, newRecord, topScores);
}

// ── Arranque ──────────────────────────────────────────────────────
init();
