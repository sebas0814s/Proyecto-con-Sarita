/**
 * input.js
 * Responsabilidad: capturar entradas del usuario.
 * - Teclado (flechas + WASD + P para pausa)
 * - Touch / deslizamiento en móvil
 */

/** Mapeo de teclas a direcciones. */
const KEY_MAP = {
  ArrowUp:    'UP',
  ArrowDown:  'DOWN',
  ArrowLeft:  'LEFT',
  ArrowRight: 'RIGHT',
  w: 'UP', W: 'UP',
  s: 'DOWN', S: 'DOWN',
  a: 'LEFT', A: 'LEFT',
  d: 'RIGHT', D: 'RIGHT',
};

/**
 * Registra los listeners de teclado y touch.
 * @param {function} onDirection - callback(direction: string)
 * @param {function} onPause     - callback cuando se presiona P
 * @returns {function} cleanup - función para remover los listeners
 */
export function registerInput(onDirection, onPause) {
  function handleKey(event) {
    if (event.key === 'p' || event.key === 'P') {
      onPause();
      return;
    }
    const direction = KEY_MAP[event.key];
    if (direction) {
      event.preventDefault(); // evita que las flechas hagan scroll
      onDirection(direction);
    }
  }

  // ---- Touch (swipe) ----
  let touchStartX = 0;
  let touchStartY = 0;

  function handleTouchStart(event) {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }

  function handleTouchEnd(event) {
    const dx = event.changedTouches[0].clientX - touchStartX;
    const dy = event.changedTouches[0].clientY - touchStartY;
    const minSwipe = 30;

    if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      onDirection(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
      onDirection(dy > 0 ? 'DOWN' : 'UP');
    }
  }

  document.addEventListener('keydown', handleKey);
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchend', handleTouchEnd,   { passive: true });

  // Devuelve una función para limpiar los listeners cuando ya no se necesiten
  return function cleanup() {
    document.removeEventListener('keydown', handleKey);
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchend', handleTouchEnd);
  };
}
