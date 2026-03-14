/**
 * food.js
 * Tipos de comida: normal, special (estrella), slow (azul), shield (morado).
 * Soporta obstáculos para evitar spawn en paredes.
 */

import { COLS, ROWS } from './board.js';
import { occupies }   from './snake.js';

/**
 * Genera una posición libre y devuelve un objeto de comida.
 * @param {object}   snake      serpiente actual
 * @param {object[]} obstacles  celdas bloqueadas [{row,col}]
 * @param {string}   type       'normal'|'special'|'slow'|'shield'
 */
export function spawnFood(snake, obstacles = [], type = 'normal') {
  let pos;
  do {
    pos = {
      row: Math.floor(Math.random() * ROWS),
      col: Math.floor(Math.random() * COLS),
    };
  } while (
    occupies(snake, pos.row, pos.col) ||
    obstacles.some(o => o.row === pos.row && o.col === pos.col)
  );

  return { row: pos.row, col: pos.col, type };
}

export function isEaten(head, food) {
  return head.row === food.row && head.col === food.col;
}
