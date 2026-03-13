/**
 * board.js
 * Responsabilidad: manejar el canvas (tablero de juego).
 * Dibuja la cuadrícula, la culebra y la comida.
 */

export const CELL_SIZE = 20; // píxeles por celda
export const COLS      = 21; // columnas del tablero
export const ROWS      = 21; // filas del tablero

const CANVAS_SIZE = CELL_SIZE * COLS; // 420px

/** Inicializa el canvas y devuelve el contexto 2D. */
export function initBoard() {
  const canvas = document.getElementById('game-canvas');
  canvas.width  = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  return canvas.getContext('2d');
}

/** Limpia el canvas con el color de fondo. */
export function clearBoard(ctx) {
  ctx.fillStyle = getComputedStyle(document.documentElement)
    .getPropertyValue('--bg').trim();
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  drawGrid(ctx);
}

/** Dibuja líneas de cuadrícula sutiles. */
function drawGrid(ctx) {
  ctx.strokeStyle = getComputedStyle(document.documentElement)
    .getPropertyValue('--grid-color').trim();
  ctx.lineWidth = 0.5;

  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL_SIZE, 0);
    ctx.lineTo(x * CELL_SIZE, CANVAS_SIZE);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL_SIZE);
    ctx.lineTo(CANVAS_SIZE, y * CELL_SIZE);
    ctx.stroke();
  }
}

/** Dibuja un segmento de la culebra. */
export function drawSnakeSegment(ctx, segment, isHead) {
  const color = isHead
    ? getComputedStyle(document.documentElement).getPropertyValue('--snake-head').trim()
    : getComputedStyle(document.documentElement).getPropertyValue('--snake-color').trim();

  const x = segment.col * CELL_SIZE;
  const y = segment.row * CELL_SIZE;
  const padding = 2;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(
    x + padding,
    y + padding,
    CELL_SIZE - padding * 2,
    CELL_SIZE - padding * 2,
    isHead ? 6 : 4
  );
  ctx.fill();
}

/** Dibuja la comida. */
export function drawFood(ctx, food) {
  const x = food.col * CELL_SIZE + CELL_SIZE / 2;
  const y = food.row * CELL_SIZE + CELL_SIZE / 2;
  const radius = CELL_SIZE / 2 - 3;

  ctx.fillStyle = getComputedStyle(document.documentElement)
    .getPropertyValue('--food-color').trim();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // brillo
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.arc(x - 2, y - 2, radius * 0.4, 0, Math.PI * 2);
  ctx.fill();
}
