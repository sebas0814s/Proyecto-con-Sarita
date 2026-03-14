/**
 * game.js
 * Bucle principal. Integra: dificultades, niveles, obstáculos,
 * poderes (slow/shield), combo, logros, racha y animación de muerte.
 */

import {
  CELL_SIZE, initBoard, clearBoard,
  drawSnakeSegment, drawFood, drawObstacles,
  addTrailCell, clearTrail, drawTrail,
  spawnParticles, updateAndDrawParticles, clearParticles,
  startStars, stopStars,
} from './board.js';

import {
  createSnake, changeDirection, moveSnake,
  getHead, hitWall, hitSelf, wrapSnake,
} from './snake.js';

import { ROWS, COLS } from './board.js';

import { spawnFood, isEaten }  from './food.js';
import { registerInput }       from './input.js';

import {
  createScore, calcPoints, addPoints, resetCombo,
  isNewRecord, saveScore, updateStreak,
  DIFFICULTY_CONFIGS, FOODS_PER_LEVEL,
} from './score.js';

import {
  showScreen, updateScoreDisplay, showGameOver, setPauseOverlay,
  startCountdown, updateComboDisplay, showDifficultyBadge,
  syncDifficultyButtons, updateStreakDisplay, updateLevelDisplay,
  showLevelUpBanner, showSlowIndicator, showShieldIndicator,
  showAchievementNotif, initSettingsModal, initAchievementsPanel,
} from './ui.js';

import {
  unlockAudio,
  playEat, playSpecialEat, playSlowEat, playShieldEat,
  playCombo, playDeath, playLevelUp, playShieldBlock,
  startBgMusic, stopBgMusic,
} from './audio.js';

import { unlock }     from './achievements.js';
import { loadTheme }  from './theme.js';

// ── Estado global ─────────────────────────────────────────────────
let ctx;
let snake, food, specialFood, powerupFood;
let score, config;
let paused, gameOver;
let speedMs, lastTickTime, animationId, removeInputListeners;
let lastFoodTime, selectedDifficulty;
let obstacles = [];
let shieldActive = false;
let slowActive   = false;
let slowEndTime  = 0;
let baseSpeedMs  = 0;
let deathPhase   = null;
let deathStart   = 0;
let specialEatenCount = 0;

// ── Init ──────────────────────────────────────────────────────────
function init() {
  loadTheme();
  ctx                = initBoard();
  selectedDifficulty = 'normal';

  // Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {/* no HTTPS, ignorar */});
  }

  bindButtons();
  initSettingsModal();
  initAchievementsPanel();
  updateStreakDisplay();
  showScreen('start');
  startStars();

  // Pausa automática al perder el foco de la ventana
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !gameOver && !paused && deathPhase === null) togglePause();
  });
}

function bindButtons() {
  document.getElementById('btn-start')  ?.addEventListener('click', onStart);
  document.getElementById('btn-restart')?.addEventListener('click', onStart);
  document.getElementById('btn-menu')   ?.addEventListener('click', onMenu);
  document.getElementById('btn-pause')  ?.addEventListener('click', togglePause);
  document.getElementById('btn-resume') ?.addEventListener('click', togglePause);

  document.querySelectorAll('.btn-difficulty').forEach(btn =>
    btn.addEventListener('click', () => {
      unlockAudio(); startBgMusic();
      document.querySelectorAll('.btn-difficulty').forEach(b => b.classList.remove('active-diff'));
      btn.classList.add('active-diff');
      selectedDifficulty = btn.dataset.difficulty;
    }),
  );
}

function onStart() { unlockAudio(); requestCountdown(); }

function onMenu() {
  showScreen('start');
  syncDifficultyButtons(selectedDifficulty);
  updateStreakDisplay();
  startStars();
  startBgMusic();
}

// ── Countdown ─────────────────────────────────────────────────────
function requestCountdown() {
  if (removeInputListeners) removeInputListeners();
  if (animationId) cancelAnimationFrame(animationId);

  config = DIFFICULTY_CONFIGS[selectedDifficulty];
  stopBgMusic();
  stopStars();
  showScreen('game');
  clearBoard(ctx);
  showDifficultyBadge(selectedDifficulty, config.name);
  startCountdown(3, startGame);
}

function startGame() {
  snake          = createSnake();
  obstacles      = generateObstacles(config);
  food           = spawnFood(snake, obstacles, 'normal');
  specialFood    = null;
  powerupFood    = null;
  score          = createScore(selectedDifficulty);
  paused         = false;
  gameOver       = false;
  speedMs        = config.baseSpeed;
  baseSpeedMs    = config.baseSpeed;
  lastTickTime   = 0;
  lastFoodTime   = 0;
  deathPhase     = null;
  shieldActive   = false;
  slowActive     = false;
  specialEatenCount = 0;

  clearParticles();
  clearTrail();
  updateStreak();
  updateStreakDisplay();
  updateScoreDisplay(score);
  updateComboDisplay(1);
  updateLevelDisplay(1);
  showSlowIndicator(false);
  showShieldIndicator(false);
  setPauseOverlay(false);

  removeInputListeners = registerInput(dir => changeDirection(snake, dir), togglePause);
  animationId = requestAnimationFrame(loop);
}

// ── Generación de obstáculos (modo difícil) ────────────────────────
function generateObstacles(cfg, level = 1) {
  if (cfg.obstacleCount === 0) return [];
  const count = cfg.obstacleCount + Math.floor((level - 1) / 3);
  const obs   = [];
  const mid   = Math.floor(ROWS / 2);

  for (let w = 0; w < count; w++) {
    const horiz = Math.random() < 0.5;
    const len   = 2 + Math.floor(Math.random() * 2);
    let sr, sc;
    let tries = 0;
    do {
      sr = 2 + Math.floor(Math.random() * (ROWS - 4));
      sc = 2 + Math.floor(Math.random() * (COLS - 4));
      tries++;
    } while (Math.abs(sr - mid) < 4 && Math.abs(sc - mid) < 4 && tries < 20);

    for (let j = 0; j < len; j++) {
      const r = horiz ? sr : sr + j;
      const c = horiz ? sc + j : sc;
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) obs.push({ row: r, col: c });
    }
  }
  return obs;
}

// ── Bucle ─────────────────────────────────────────────────────────
function loop(timestamp) {
  if (gameOver) return;
  animationId = requestAnimationFrame(loop);

  if (deathPhase === 'running') { runDeathAnimation(timestamp); return; }
  if (paused) return;

  if (lastFoodTime === 0) lastFoodTime = timestamp;

  // Slow power-up: expirar
  if (slowActive && timestamp > slowEndTime) {
    slowActive = false;
    speedMs    = baseSpeedMs;
    showSlowIndicator(false);
  }

  // Combo timeout
  if (score.combo > 1 && timestamp - lastFoodTime > config.comboTimeout) {
    resetCombo(score);
    updateComboDisplay(score.combo);
  }

  // Comida especial / powerup: expirar
  if (specialFood && timestamp - specialFood.spawnTime > config.specialDuration) specialFood = null;
  if (powerupFood  && timestamp - powerupFood.spawnTime  > config.powerupDuration)  powerupFood  = null;

  render(timestamp);

  const elapsed = timestamp - lastTickTime;
  if (elapsed < speedMs) return;
  lastTickTime = timestamp;

  gameTick(timestamp);
}

// ── Tick de lógica ────────────────────────────────────────────────
function gameTick(timestamp) {
  const head       = getHead(snake);
  const ateNormal  = isEaten(head, food);
  const ateSpecial = specialFood  ? isEaten(head, specialFood)  : false;
  const atePowerup = powerupFood  ? isEaten(head, powerupFood)  : false;
  const grows      = ateNormal || ateSpecial || atePowerup;

  // Trail: guardar celda que quedará vacía
  if (!grows) {
    const tail = snake.segments[snake.segments.length - 1];
    addTrailCell(tail.row, tail.col, timestamp);
  }

  moveSnake(snake, grows);

  // Colisiones
  if (config.wallWrap) {
    wrapSnake(snake);
    if (hitSelf(snake) || hitsObstacle(getHead(snake))) {
      if (shieldActive) { shieldBlock(); return; }
      startDeathAnimation(timestamp); return;
    }
  } else {
    if (hitWall(snake) || hitSelf(snake) || hitsObstacle(getHead(snake))) {
      if (shieldActive) { shieldBlock(); return; }
      startDeathAnimation(timestamp); return;
    }
  }

  // ── Comer comida normal ──────────────────────────────────────
  if (ateNormal) {
    const prevCombo = score.combo;
    const pts       = calcPoints(score, config, snake.segments.length, timestamp - lastFoodTime);
    const leveledUp = addPoints(score, pts);
    spawnParticles(food, pts);
    lastFoodTime    = timestamp;
    baseSpeedMs     = Math.max(config.minSpeed, baseSpeedMs - config.speedDec);
    if (!slowActive) speedMs = baseSpeedMs;
    food            = spawnFood(snake, obstacles, 'normal');

    // Posibles spawns de comidas adicionales
    if (!specialFood && Math.random() < config.specialChance) {
      specialFood           = spawnFood(snake, obstacles, 'special');
      specialFood.spawnTime = timestamp;
    }
    if (!powerupFood && Math.random() < config.powerupChance) {
      const type           = Math.random() < 0.5 ? 'slow' : 'shield';
      powerupFood           = spawnFood(snake, obstacles, type);
      powerupFood.spawnTime = timestamp;
    }

    playEat();
    if (score.combo > prevCombo && score.combo > 1) playCombo(score.combo);
    if (leveledUp) onLevelUp();
    checkAchievements(timestamp);

    updateScoreDisplay(score);
    updateComboDisplay(score.combo);
    updateLevelDisplay(score.level);
  }

  // ── Comer comida especial ────────────────────────────────────
  if (ateSpecial) {
    const prevCombo = score.combo;
    const specPts   = calcPoints(score, config, snake.segments.length, timestamp - lastFoodTime)
                      * config.specialMultiplier;
    const leveledUp = addPoints(score, specPts);
    spawnParticles(specialFood, specPts);
    specialEatenCount++;
    lastFoodTime    = timestamp;
    specialFood     = null;
    baseSpeedMs     = Math.max(config.minSpeed, baseSpeedMs - config.speedDec * 2);
    if (!slowActive) speedMs = baseSpeedMs;

    playSpecialEat();
    if (score.combo > prevCombo && score.combo > 1) playCombo(score.combo);
    if (leveledUp) onLevelUp();
    checkAchievements(timestamp);

    updateScoreDisplay(score);
    updateComboDisplay(score.combo);
    updateLevelDisplay(score.level);
  }

  // ── Comer power-up ──────────────────────────────────────────
  if (atePowerup) {
    const kind = powerupFood.type;
    spawnParticles(powerupFood, 0);
    powerupFood = null;

    if (kind === 'slow') {
      slowActive  = true;
      slowEndTime = timestamp + config.powerupDuration;
      speedMs     = Math.min(speedMs * 1.7, config.baseSpeed * 1.5);
      showSlowIndicator(true);
      playSlowEat();
      const ach = unlock('slow_eat');
      if (ach) showAchievementNotif(ach);
    } else {
      shieldActive = true;
      showShieldIndicator(true);
      playShieldEat();
    }
  }
}

function onLevelUp() {
  playLevelUp();
  showLevelUpBanner(score.level);
  // En modo difícil, más obstáculos cada 3 niveles
  if (selectedDifficulty === 'hard' && score.level % 3 === 0) {
    obstacles = generateObstacles(config, score.level);
  }
  const ach = unlock('level5');
  if (ach && score.level >= 5) showAchievementNotif(ach);
}

function shieldBlock() {
  shieldActive = false;
  showShieldIndicator(false);
  playShieldBlock();
  const ach = unlock('shield_save');
  if (ach) showAchievementNotif(ach);
  // Rebote: mover la serpiente hacia atrás o simplemente detener (no morimos)
}

function hitsObstacle(head) {
  return obstacles.some(o => o.row === head.row && o.col === head.col);
}

// ── Chequeo de logros ─────────────────────────────────────────────
function checkAchievements() {
  const checks = [
    ['first_food',  score.foodEaten >= 1],
    ['combo5',      score.combo >= 5],
    ['combo10',     score.combo >= 10],
    ['score_100',   score.current >= 100],
    ['score_1000',  score.current >= 1000],
    ['score_5000',  score.current >= 5000],
    ['special5',    specialEatenCount >= 5],
    ['hard_1000',   score.difficulty === 'hard' && score.current >= 1000],
  ];

  for (const [id, cond] of checks) {
    if (cond) {
      const ach = unlock(id);
      if (ach) showAchievementNotif(ach);
    }
  }

}

// ── Render ────────────────────────────────────────────────────────
function render(timestamp) {
  clearBoard(ctx);
  drawTrail(ctx, timestamp);
  drawObstacles(ctx, obstacles);
  drawFood(ctx, food, timestamp);
  if (specialFood) drawFood(ctx, specialFood, timestamp);
  if (powerupFood)  drawFood(ctx, powerupFood,  timestamp);
  snake.segments.forEach((seg, i) =>
    drawSnakeSegment(ctx, seg, i, snake.segments.length, snake.direction, shieldActive),
  );
  updateAndDrawParticles(ctx);
}

// ── Animación de muerte ───────────────────────────────────────────
const DEATH_DURATION   = 900;
const DEATH_FLASH_RATE = 110;

function startDeathAnimation(timestamp) {
  deathPhase = 'running';
  deathStart = timestamp;
  playDeath();
}

function runDeathAnimation(timestamp) {
  const elapsed = timestamp - deathStart;
  if (elapsed >= DEATH_DURATION) { endGame(); return; }

  clearBoard(ctx);
  const flashOn = Math.floor(elapsed / DEATH_FLASH_RATE) % 2 === 0;

  snake.segments.forEach((seg, i) => {
    if (flashOn) {
      const px = seg.col * CELL_SIZE, py = seg.row * CELL_SIZE;
      ctx.fillStyle = '#e94560'; ctx.shadowColor = '#e94560'; ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.roundRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4, i === 0 ? 7 : 3);
      ctx.fill(); ctx.shadowBlur = 0;
    } else {
      drawSnakeSegment(ctx, seg, i, snake.segments.length, snake.direction, false);
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

  // Logro de racha (se comprueba al terminar la partida)
  import('./score.js').then(({ getStreak }) => {
    if (getStreak() >= 7) {
      const ach = unlock('streak7');
      if (ach) showAchievementNotif(ach);
    }
  });

  const newRecord = isNewRecord(score);
  const topScores = saveScore(score);
  showGameOver(score, newRecord, topScores);
  startBgMusic();
  startStars();
}

init();
