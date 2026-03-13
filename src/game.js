/**
 * game.js
 * Responsabilidad: bucle principal del juego.
 * Orquesta todos los módulos: board, snake, food, input, score y ui.
 *
 * Este es el único archivo que "sabe" cómo encajan las piezas.
 * Cada módulo sabe solo de su propia responsabilidad.
 */

import { initBoard, clearBoard, drawSnakeSegment, drawFood } from './board.js';
import { createSnake, changeDirection, moveSnake, getHead, hitWall, hitSelf } from './snake.js';
import { spawnFood, isEaten } from './food.js';
import { registerInput } from './input.js';
import { createScore, addPoints, isNewRecord } from './score.js';
import { showScreen, updateScoreDisplay, showGameOver, setPauseOverlay } from './ui.js';

// ── Configuración ──────────────────────────────────────────────
const BASE_SPEED_MS  = 150; // milisegundos entre cada tick
const SPEED_INCREASE = 2;   // ms que se restan por cada comida

// ── Estado global de la partida ────────────────────────────────
let ctx;
let snake;
let food;
let score;
let paused;
let gameOver;
let speedMs;
let lastTickTime;
let animationId;
let removeInputListeners;

// ── Inicialización general (una sola vez) ──────────────────────
function init() {
  ctx = initBoard();
  bindButtons();
  showScreen('start');
}

/** Conecta todos los botones de la UI con sus acciones. */
function bindButtons() {
  document.getElementById('btn-start').addEventListener('click', startGame);
  document.getElementById('btn-restart').addEventListener('click', startGame);
  document.getElementById('btn-menu').addEventListener('click', () => showScreen('start'));
  document.getElementById('btn-pause').addEventListener('click', togglePause);
  document.getElementById('btn-resume').addEventListener('click', togglePause);
}

// ── Inicio de partida ──────────────────────────────────────────
function startGame() {
  // Limpia listeners de la partida anterior si existen
  if (removeInputListeners) removeInputListeners();
  if (animationId) cancelAnimationFrame(animationId);

  snake    = createSnake();
  food     = spawnFood(snake);
  score    = createScore();
  paused   = false;
  gameOver = false;
  speedMs  = BASE_SPEED_MS;
  lastTickTime = 0;

  updateScoreDisplay(score);
  setPauseOverlay(false);
  showScreen('game');

  removeInputListeners = registerInput(
    (direction) => changeDirection(snake, direction),
    togglePause,
  );

  animationId = requestAnimationFrame(loop);
}

// ── Bucle del juego ────────────────────────────────────────────
function loop(timestamp) {
  if (gameOver) return;

  animationId = requestAnimationFrame(loop);

  if (paused) return;

  const elapsed = timestamp - lastTickTime;
  if (elapsed < speedMs) return; // aún no es tiempo de avanzar
  lastTickTime = timestamp;

  tick();
}

/** Un paso lógico del juego. */
function tick() {
  const head        = getHead(snake);
  const ateFood     = isEaten(head, food);

  moveSnake(snake, ateFood);

  // Después de mover, revisamos colisiones con la nueva cabeza
  if (hitWall(snake) || hitSelf(snake)) {
    endGame();
    return;
  }

  if (ateFood) {
    addPoints(score);
    food    = spawnFood(snake);
    speedMs = Math.max(60, speedMs - SPEED_INCREASE); // aumenta velocidad
    updateScoreDisplay(score);
  }

  render();
}

/** Dibuja el estado actual del juego en el canvas. */
function render() {
  clearBoard(ctx);
  drawFood(ctx, food);
  snake.segments.forEach((segment, index) => {
    drawSnakeSegment(ctx, segment, index === 0);
  });
}

// ── Pausa ──────────────────────────────────────────────────────
function togglePause() {
  if (gameOver) return;
  paused = !paused;
  setPauseOverlay(paused);
}

// ── Fin del juego ──────────────────────────────────────────────
function endGame() {
  gameOver = true;
  cancelAnimationFrame(animationId);
  if (removeInputListeners) removeInputListeners();
  showGameOver(score, isNewRecord(score));
}

// ── Arranque ───────────────────────────────────────────────────
init();
