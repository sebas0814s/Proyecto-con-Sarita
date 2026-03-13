/**
 * food.js
 * Responsabilidad: crear y posicionar la comida.
 * La comida aparece en una celda aleatoria libre del tablero.
 */

import { COLS, ROWS } from './board.js';
import { occupies }   from './snake.js';

/** Genera una posición aleatoria que no esté ocupada por la culebra. */
export function spawnFood(snake) {
  let position;

  do {
    position = {
      row: Math.floor(Math.random() * ROWS),
      col: Math.floor(Math.random() * COLS),
    };
  } while (occupies(snake, position.row, position.col));

  return position;
}

/** Comprueba si la cabeza de la culebra está en la misma celda que la comida. */
export function isEaten(head, food) {
  return head.row === food.row && head.col === food.col;
}
