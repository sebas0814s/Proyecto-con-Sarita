/**
 * snake.js
 * Responsabilidad: toda la lógica de la culebra.
 * - Posición de cada segmento
 * - Dirección de movimiento
 * - Crecer al comer
 * - Detectar colisiones
 */

import { COLS, ROWS } from './board.js';

export const DIRECTIONS = {
  UP:    { row: -1, col:  0 },
  DOWN:  { row:  1, col:  0 },
  LEFT:  { row:  0, col: -1 },
  RIGHT: { row:  0, col:  1 },
};

/** Opuestos para evitar que la culebra se dé la vuelta sobre sí misma. */
const OPPOSITE = {
  UP: 'DOWN', DOWN: 'UP',
  LEFT: 'RIGHT', RIGHT: 'LEFT',
};

/** Crea una culebra nueva en el centro del tablero. */
export function createSnake() {
  const startRow = Math.floor(ROWS / 2);
  const startCol = Math.floor(COLS / 2);

  return {
    // Array de segmentos: [cabeza, ...cuerpo]
    segments: [
      { row: startRow, col: startCol },
      { row: startRow, col: startCol - 1 },
      { row: startRow, col: startCol - 2 },
    ],
    direction: 'RIGHT',
    pendingDirection: 'RIGHT', // dirección que se aplicará en el próximo tick
    grew: false,
  };
}

/**
 * Solicita un cambio de dirección.
 * Se ignora si es la dirección opuesta a la actual.
 */
export function changeDirection(snake, newDirection) {
  if (newDirection !== OPPOSITE[snake.direction]) {
    snake.pendingDirection = newDirection;
  }
}

/**
 * Avanza la culebra un paso.
 * Devuelve true si la culebra creció (comió comida en este tick).
 */
export function moveSnake(snake, shouldGrow) {
  snake.direction = snake.pendingDirection;
  const { row: dr, col: dc } = DIRECTIONS[snake.direction];
  const head = snake.segments[0];

  const newHead = {
    row: head.row + dr,
    col: head.col + dc,
  };

  snake.segments.unshift(newHead);

  if (!shouldGrow) {
    snake.segments.pop(); // elimina la cola solo si no creció
  }
}

/** Devuelve la cabeza de la culebra. */
export function getHead(snake) {
  return snake.segments[0];
}

/** Revisa si la culebra chocó con las paredes. */
export function hitWall(snake) {
  const { row, col } = getHead(snake);
  return row < 0 || row >= ROWS || col < 0 || col >= COLS;
}

/** Revisa si la culebra chocó consigo misma. */
export function hitSelf(snake) {
  const head = getHead(snake);
  return snake.segments
    .slice(1)
    .some(seg => seg.row === head.row && seg.col === head.col);
}

/** Revisa si la culebra está en una posición específica. */
export function occupies(snake, row, col) {
  return snake.segments.some(seg => seg.row === row && seg.col === col);
}

/**
 * Envuelve la cabeza al lado opuesto si sale por cualquier borde.
 * Se usa en el modo Fácil para que no haya colisión con paredes.
 */
export function wrapSnake(snake) {
  const head = snake.segments[0];
  head.row   = ((head.row % ROWS) + ROWS) % ROWS;
  head.col   = ((head.col % COLS) + COLS) % COLS;
}
