/**
 * board.js
 * Renderizado del canvas: tablero, serpiente, comidas, obstáculos,
 * trail de cola, partículas flotantes y estrellas de fondo en el menú.
 * Los colores se leen del tema actual via getCurrentTheme().
 */

import { getCurrentTheme } from './theme.js';

export const CELL_SIZE  = 20;
export const COLS       = 21;
export const ROWS       = 21;

const CS          = CELL_SIZE;
const CANVAS_SIZE = CS * COLS;

// ── Inicialización ────────────────────────────────────────────────
export function initBoard() {
  const canvas  = document.getElementById('game-canvas');
  canvas.width  = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  return canvas.getContext('2d');
}

// ── Tablero ───────────────────────────────────────────────────────
export function clearBoard(ctx) {
  const t = getCurrentTheme();
  ctx.fillStyle = t.bg ?? '#0a0a14';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  drawGrid(ctx);
}

function drawGrid(ctx) {
  const t = getCurrentTheme();
  ctx.strokeStyle = t.grid ?? '#181828';
  ctx.lineWidth   = 0.5;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath(); ctx.moveTo(x * CS, 0); ctx.lineTo(x * CS, CANVAS_SIZE); ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath(); ctx.moveTo(0, y * CS); ctx.lineTo(CANVAS_SIZE, y * CS); ctx.stroke();
  }
}

// ── Obstáculos ────────────────────────────────────────────────────
export function drawObstacles(ctx, obstacles) {
  const t = getCurrentTheme();
  ctx.fillStyle   = t.obstacle ?? '#3a3a5a';
  ctx.shadowColor = t.obstacle ?? '#3a3a5a';
  ctx.shadowBlur  = 4;
  for (const o of obstacles) {
    ctx.beginPath();
    ctx.roundRect(o.col * CS + 1, o.row * CS + 1, CS - 2, CS - 2, 3);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

// ── Trail de cola ─────────────────────────────────────────────────
let trailCells = []; // { row, col, ts }

export function addTrailCell(row, col, ts) {
  trailCells.push({ row, col, ts });
}

export function clearTrail() { trailCells = []; }

export function drawTrail(ctx, timestamp) {
  const t = getCurrentTheme();
  trailCells = trailCells.filter(c => timestamp - c.ts < 420);
  for (const c of trailCells) {
    const alpha = (1 - (timestamp - c.ts) / 420) * 0.3;
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = t.trail + '1)';
    ctx.beginPath();
    ctx.roundRect(c.col * CS + 3, c.row * CS + 3, CS - 6, CS - 6, 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── Serpiente ─────────────────────────────────────────────────────
export function drawSnakeSegment(ctx, segment, index, total, direction, shielded) {
  const isHead = index === 0;
  const px     = segment.col * CS;
  const py     = segment.row * CS;
  const pad    = 2;
  const s      = CS - pad * 2;
  const t      = getCurrentTheme();

  const [r1, g1, b1] = t.snake;
  const [r2, g2, b2] = t.snakeTail;
  const ratio = total > 1 ? index / (total - 1) : 0;
  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);

  if (isHead) {
    ctx.shadowColor = shielded ? (t.shield ?? '#a855f7') : t.accent;
    ctx.shadowBlur  = shielded ? 20 : 16;
  }

  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.beginPath();
  ctx.roundRect(px + pad, py + pad, s, s, isHead ? 7 : 3);
  ctx.fill();
  ctx.shadowBlur = 0;

  if (isHead) drawEyes(ctx, px, py, direction);
}

function drawEyes(ctx, px, py, direction) {
  const cx = px + CS / 2, cy = py + CS / 2, off = 4;
  let e1, e2;
  switch (direction) {
    case 'RIGHT': e1 = { x: cx + 2, y: cy - off }; e2 = { x: cx + 2, y: cy + off }; break;
    case 'LEFT':  e1 = { x: cx - 2, y: cy - off }; e2 = { x: cx - 2, y: cy + off }; break;
    case 'UP':    e1 = { x: cx - off, y: cy - 2 }; e2 = { x: cx + off, y: cy - 2 }; break;
    default:      e1 = { x: cx - off, y: cy + 2 }; e2 = { x: cx + off, y: cy + 2 }; break;
  }
  ctx.fillStyle = '#08080f';
  for (const e of [e1, e2]) { ctx.beginPath(); ctx.arc(e.x, e.y, 2.6, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (const e of [e1, e2]) { ctx.beginPath(); ctx.arc(e.x + 0.8, e.y - 0.8, 1, 0, Math.PI * 2); ctx.fill(); }
}

// ── Comida ────────────────────────────────────────────────────────
export function drawFood(ctx, food, ts) {
  const x = food.col * CS + CS / 2;
  const y = food.row * CS + CS / 2;
  switch (food.type) {
    case 'special': drawSpecialFood(ctx, x, y, ts); break;
    case 'slow':    drawPowerupFood(ctx, x, y, ts, 'slow');   break;
    case 'shield':  drawPowerupFood(ctx, x, y, ts, 'shield'); break;
    default:        drawNormalFood(ctx, x, y, ts);
  }
}

function drawNormalFood(ctx, x, y, ts) {
  const t      = getCurrentTheme();
  const pulse  = 1 + Math.sin(ts / 300) * 0.13;
  const radius = (CS / 2 - 3) * pulse;
  ctx.shadowColor = t.food ?? '#e94560';
  ctx.shadowBlur  = 14;
  ctx.fillStyle   = t.food ?? '#e94560';
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle  = 'rgba(255,255,255,0.3)';
  ctx.beginPath(); ctx.arc(x - 2, y - 2, radius * 0.33, 0, Math.PI * 2); ctx.fill();
}

function drawSpecialFood(ctx, x, y, ts) {
  const t      = getCurrentTheme();
  const pulse  = 1 + Math.sin(ts / 140) * 0.2;
  const radius = (CS / 2 - 1) * pulse;
  const angle  = ts / 380;
  ctx.shadowColor = t.special ?? '#f7c948';
  ctx.shadowBlur  = 26;
  ctx.fillStyle   = t.special ?? '#f7c948';
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  drawStar(ctx, 0, 0, 5, radius, radius * 0.44);
  ctx.restore(); ctx.shadowBlur = 0;
  for (let i = 0; i < 3; i++) {
    const a  = angle * 2.2 + (i * Math.PI * 2) / 3;
    const or = radius + 5;
    ctx.fillStyle = `rgba(247,201,72,${0.4 + Math.sin(ts / 220 + i) * 0.3})`;
    ctx.beginPath(); ctx.arc(x + Math.cos(a) * or, y + Math.sin(a) * or, 2.2, 0, Math.PI * 2); ctx.fill();
  }
}

function drawPowerupFood(ctx, x, y, ts, kind) {
  const t      = getCurrentTheme();
  const color  = kind === 'slow' ? (t.slow ?? '#4ec9e9') : (t.shield ?? '#a855f7');
  const pulse  = 1 + Math.sin(ts / 200) * 0.15;
  const s      = (CS / 2 - 2) * pulse;
  ctx.shadowColor = color;
  ctx.shadowBlur  = 18;
  ctx.fillStyle   = color;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ts / 600);
  ctx.beginPath();
  ctx.moveTo(0, -s); ctx.lineTo(s, 0); ctx.lineTo(0, s); ctx.lineTo(-s, 0);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.shadowBlur = 0;
  // Icono pequeño encima
  ctx.font      = '9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText(kind === 'slow' ? '🐢' : '🛡', x, y + 4);
  ctx.textAlign = 'left';
}

function drawStar(ctx, cx, cy, spikes, outerR, innerR) {
  let rot = -Math.PI / 2;
  const step = Math.PI / spikes;
  ctx.beginPath();
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR); rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR); rot += step;
  }
  ctx.closePath(); ctx.fill();
}

// ── Partículas y textos flotantes ─────────────────────────────────
let particles     = [];
let floatingTexts = [];

export function spawnParticles(food, points) {
  const t    = getCurrentTheme();
  const x    = food.col * CS + CS / 2;
  const y    = food.row * CS + CS / 2;
  const colors = {
    normal:  t.food    ?? '#e94560',
    special: t.special ?? '#f7c948',
    slow:    t.slow    ?? '#4ec9e9',
    shield:  t.shield  ?? '#a855f7',
  };
  const color = colors[food.type] ?? colors.normal;
  const count = (food.type === 'normal') ? 11 : 20;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 1.2 + Math.random() * 2.6;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                     radius: 1.5 + Math.random() * 2.2, color, alpha: 1 });
  }
  floatingTexts.push({ x: x - 10, y, text: `+${points}`,
                       alpha: 1, vy: -1.3, color: food.type === 'normal' ? '#fff' : color,
                       size: food.type === 'normal' ? 13 : 18 });
}

export function updateAndDrawParticles(ctx) {
  particles = particles.filter(p => p.alpha > 0.03);
  for (const p of particles) {
    p.x += p.vx; p.y += p.vy; p.vy += 0.09;
    p.alpha = Math.max(0, p.alpha - 0.034);
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle   = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius * p.alpha + 0.4, 0, Math.PI * 2); ctx.fill();
  }
  floatingTexts = floatingTexts.filter(t => t.alpha > 0.03);
  for (const t of floatingTexts) {
    t.y += t.vy; t.alpha = Math.max(0, t.alpha - 0.022);
    ctx.globalAlpha = t.alpha;
    ctx.fillStyle   = t.color;
    ctx.font        = `bold ${t.size}px 'Segoe UI', sans-serif`;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}

export function clearParticles() { particles = []; floatingTexts = []; }

// ── Estrellas de fondo (pantalla de inicio) ───────────────────────
let starCanvas = null, starCtx = null, starAnimId = null;
let stars = [];

export function startStars() {
  starCanvas = document.getElementById('stars-canvas');
  if (!starCanvas) return;
  starCtx    = starCanvas.getContext('2d');
  resizeStarCanvas();

  stars = Array.from({ length: 90 }, () => ({
    x:      Math.random() * starCanvas.width,
    y:      Math.random() * starCanvas.height,
    r:      Math.random() * 1.4 + 0.3,
    phase:  Math.random() * Math.PI * 2,
    speed:  Math.random() * 0.012 + 0.004,
  }));

  animateStars(0);
}

export function stopStars() {
  if (starAnimId) { cancelAnimationFrame(starAnimId); starAnimId = null; }
}

function resizeStarCanvas() {
  if (!starCanvas) return;
  starCanvas.width  = window.innerWidth;
  starCanvas.height = window.innerHeight;
}

function animateStars(ts) {
  if (!starCtx) return;
  starCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);
  for (const s of stars) {
    s.phase += s.speed;
    starCtx.globalAlpha = ((Math.sin(s.phase) + 1) / 2) * 0.75;
    starCtx.fillStyle   = '#ffffff';
    starCtx.beginPath();
    starCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    starCtx.fill();
  }
  starCtx.globalAlpha = 1;
  starAnimId = requestAnimationFrame(animateStars);
}
