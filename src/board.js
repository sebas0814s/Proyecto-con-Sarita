/**
 * board.js
 * Responsabilidad: renderizado del canvas.
 * Incluye: tablero, serpiente (gradiente + ojos + glow),
 * comida normal (pulsante) y especial (estrella giratoria),
 * sistema de partículas y textos flotantes de puntuación.
 */

export const CELL_SIZE  = 20;
export const COLS       = 21;
export const ROWS       = 21;

const CS          = CELL_SIZE;
const CANVAS_SIZE = CS * COLS; // 420 px

// ── Sistema de partículas ─────────────────────────────────────────
let particles     = [];
let floatingTexts = [];

// ── Inicialización ────────────────────────────────────────────────
export function initBoard() {
  const canvas  = document.getElementById('game-canvas');
  canvas.width  = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  return canvas.getContext('2d');
}

// ── Fondo + cuadrícula ────────────────────────────────────────────
export function clearBoard(ctx) {
  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  drawGrid(ctx);
}

function drawGrid(ctx) {
  ctx.strokeStyle = '#181828';
  ctx.lineWidth   = 0.5;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CS, 0);
    ctx.lineTo(x * CS, CANVAS_SIZE);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CS);
    ctx.lineTo(CANVAS_SIZE, y * CS);
    ctx.stroke();
  }
}

// ── Serpiente ─────────────────────────────────────────────────────
/**
 * Dibuja un segmento con gradiente de color según su posición.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} segment  { row, col }
 * @param {number} index    posición en el array de segmentos
 * @param {number} total    longitud total de la serpiente
 * @param {string} direction dirección actual ('UP'|'DOWN'|'LEFT'|'RIGHT')
 */
export function drawSnakeSegment(ctx, segment, index, total, direction) {
  const isHead = index === 0;
  const px     = segment.col * CS;
  const py     = segment.row * CS;
  const pad    = 2;
  const s      = CS - pad * 2;

  // Gradiente: cabeza #4ecca3 → cola #143a28
  const t  = total > 1 ? index / (total - 1) : 0;
  const r  = Math.round(78  + (20  - 78)  * t);
  const g  = Math.round(204 + (58  - 204) * t);
  const b  = Math.round(163 + (40  - 163) * t);

  if (isHead) {
    ctx.shadowColor = '#4ecca3';
    ctx.shadowBlur  = 16;
  }

  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.beginPath();
  ctx.roundRect(px + pad, py + pad, s, s, isHead ? 7 : 3);
  ctx.fill();

  ctx.shadowBlur = 0;

  if (isHead) drawEyes(ctx, px, py, direction);
}

function drawEyes(ctx, px, py, direction) {
  const cx  = px + CS / 2;
  const cy  = py + CS / 2;
  const off = 4;
  let e1, e2;

  switch (direction) {
    case 'RIGHT': e1 = { x: cx + 2, y: cy - off }; e2 = { x: cx + 2, y: cy + off }; break;
    case 'LEFT':  e1 = { x: cx - 2, y: cy - off }; e2 = { x: cx - 2, y: cy + off }; break;
    case 'UP':    e1 = { x: cx - off, y: cy - 2 }; e2 = { x: cx + off, y: cy - 2 }; break;
    default:      e1 = { x: cx - off, y: cy + 2 }; e2 = { x: cx + off, y: cy + 2 }; break;
  }

  // Pupilas negras
  ctx.fillStyle = '#08080f';
  for (const e of [e1, e2]) {
    ctx.beginPath();
    ctx.arc(e.x, e.y, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Brillos blancos
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (const e of [e1, e2]) {
    ctx.beginPath();
    ctx.arc(e.x + 0.8, e.y - 0.8, 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Comida ────────────────────────────────────────────────────────
/**
 * Dibuja comida normal o especial según food.special.
 * @param {number} timestamp  valor de requestAnimationFrame para animaciones
 */
export function drawFood(ctx, food, timestamp) {
  const x = food.col * CS + CS / 2;
  const y = food.row * CS + CS / 2;
  if (food.special) {
    drawSpecialFood(ctx, x, y, timestamp);
  } else {
    drawNormalFood(ctx, x, y, timestamp);
  }
}

function drawNormalFood(ctx, x, y, ts) {
  const pulse  = 1 + Math.sin(ts / 300) * 0.13;
  const radius = (CS / 2 - 3) * pulse;

  ctx.shadowColor = '#e94560';
  ctx.shadowBlur  = 14;
  ctx.fillStyle   = '#e94560';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Brillo superior
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.arc(x - 2, y - 2, radius * 0.33, 0, Math.PI * 2);
  ctx.fill();
}

function drawSpecialFood(ctx, x, y, ts) {
  const pulse  = 1 + Math.sin(ts / 140) * 0.2;
  const radius = (CS / 2 - 1) * pulse;
  const angle  = ts / 380;

  ctx.shadowColor = '#f7c948';
  ctx.shadowBlur  = 26;
  ctx.fillStyle   = '#f7c948';

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  drawStar(ctx, 0, 0, 5, radius, radius * 0.44);
  ctx.restore();
  ctx.shadowBlur = 0;

  // Puntos orbitantes
  for (let i = 0; i < 3; i++) {
    const a  = angle * 2.2 + (i * Math.PI * 2) / 3;
    const or = radius + 5;
    const alpha = 0.45 + Math.sin(ts / 220 + i) * 0.3;
    ctx.fillStyle = `rgba(247,201,72,${alpha})`;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * or, y + Math.sin(a) * or, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStar(ctx, cx, cy, spikes, outerR, innerR) {
  let rot  = -Math.PI / 2;
  const step = Math.PI / spikes;
  ctx.beginPath();
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.closePath();
  ctx.fill();
}

// ── Partículas ────────────────────────────────────────────────────
/**
 * Genera una explosión de partículas y un texto flotante de puntuación.
 */
export function spawnParticles(food, points) {
  const x     = food.col * CS + CS / 2;
  const y     = food.row * CS + CS / 2;
  const color = food.special ? '#f7c948' : '#e94560';
  const count = food.special ? 20 : 11;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 1.2 + Math.random() * 2.6;
    particles.push({
      x, y,
      vx:     Math.cos(angle) * speed,
      vy:     Math.sin(angle) * speed,
      radius: 1.5 + Math.random() * 2.2,
      color,
      alpha:  1,
    });
  }

  floatingTexts.push({
    x:     x - 10,
    y,
    text:  `+${points}`,
    alpha: 1,
    vy:    -1.3,
    color: food.special ? '#f7c948' : '#ffffff',
    size:  food.special ? 18 : 13,
  });
}

/**
 * Actualiza y dibuja partículas + textos flotantes.
 * Debe llamarse una vez por frame después de dibujar todo lo demás.
 */
export function updateAndDrawParticles(ctx) {
  particles = particles.filter(p => p.alpha > 0.03);

  for (const p of particles) {
    p.x    += p.vx;
    p.y    += p.vy;
    p.vy   += 0.09; // gravedad suave
    p.alpha = Math.max(0, p.alpha - 0.034);

    ctx.globalAlpha = p.alpha;
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * p.alpha + 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  floatingTexts = floatingTexts.filter(t => t.alpha > 0.03);

  for (const t of floatingTexts) {
    t.y    += t.vy;
    t.alpha = Math.max(0, t.alpha - 0.022);

    ctx.globalAlpha = t.alpha;
    ctx.fillStyle   = t.color;
    ctx.font        = `bold ${t.size}px 'Segoe UI', sans-serif`;
    ctx.fillText(t.text, t.x, t.y);
  }

  ctx.globalAlpha = 1;
}

/** Limpia todas las partículas activas. */
export function clearParticles() {
  particles     = [];
  floatingTexts = [];
}
