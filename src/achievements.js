/**
 * achievements.js
 * Sistema de logros: definición, tracking y persistencia en localStorage.
 */

const KEY = 'snake_achievements_v1';

export const ACHIEVEMENTS = {
  first_food:  { id: 'first_food',  icon: '🍎', name: 'Primera Bocada',  desc: 'Come tu primera comida' },
  combo5:      { id: 'combo5',      icon: '🔥', name: 'En Racha',        desc: 'Alcanza combo x5' },
  combo10:     { id: 'combo10',     icon: '💥', name: 'Imparable',       desc: 'Alcanza el combo máximo x10' },
  score_100:   { id: 'score_100',   icon: '💯', name: 'Centurión',       desc: 'Llega a 100 puntos' },
  score_1000:  { id: 'score_1000',  icon: '🏆', name: 'Milésimo',        desc: 'Llega a 1,000 puntos' },
  score_5000:  { id: 'score_5000',  icon: '👑', name: 'Maestro',         desc: 'Llega a 5,000 puntos' },
  special5:    { id: 'special5',    icon: '⭐', name: 'Gourmet',         desc: 'Come 5 estrellas doradas en una partida' },
  level5:      { id: 'level5',      icon: '📈', name: 'Experimentado',   desc: 'Alcanza el nivel 5' },
  shield_save: { id: 'shield_save', icon: '🛡️', name: 'Afortunado',      desc: 'Sobrevive gracias al escudo' },
  streak7:     { id: 'streak7',     icon: '📅', name: 'Constante',       desc: 'Juega 7 días seguidos' },
  hard_1000:   { id: 'hard_1000',   icon: '💀', name: 'Hardcore',        desc: 'Llega a 1,000 pts en Difícil' },
  slow_eat:    { id: 'slow_eat',    icon: '🐢', name: 'Zen',             desc: 'Come con el power-up azul activo' },
};

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch { return {}; }
}
function save(data) { localStorage.setItem(KEY, JSON.stringify(data)); }

/** Devuelve todos los logros con su estado desbloqueado. */
export function getAchievementsState() {
  const unlocked = load();
  return Object.values(ACHIEVEMENTS).map(a => ({
    ...a,
    unlocked: !!unlocked[a.id],
  }));
}

/**
 * Intenta desbloquear un logro.
 * @returns {object|null}  el logro si se desbloqueó ahora, null si ya estaba.
 */
export function unlock(id) {
  const all = load();
  if (all[id]) return null;
  all[id] = Date.now();
  save(all);
  return ACHIEVEMENTS[id] ?? null;
}

/** Cuántos logros están desbloqueados. */
export function countUnlocked() {
  return Object.keys(load()).length;
}
