/**
 * food.js
 * Responsabilidad: crear y posicionar la comida.
 * Soporta comida normal y comida especial (estrella dorada).
 */

import { COLS, ROWS } from './board.js';
import { occupies }   from './snake.js';

/**
 * Genera una posición aleatoria libre y devuelve un objeto de comida.
 * @param {object}  snake     serpiente actual (para evitar solapamiento)
 * @param {boolean} isSpecial true → comida especial (estrella dorada)
 */
export function spawnFood(snake, isSpecial = false) {
  let position;

  do {
    position = {
      row: Math.floor(Math.random() * ROWS),
      col: Math.floor(Math.random() * COLS),
    };
  } while (occupies(snake, position.row, position.col));

  return {
    row:     position.row,
    col:     position.col,
    special: isSpecial,
    // spawnTime se asigna desde game.js usando el timestamp del animationFrame
  };
}

/** Comprueba si la cabeza de la culebra coincide con la posición de la comida. */
export function isEaten(head, food) {
  return head.row === food.row && head.col === food.col;
}
