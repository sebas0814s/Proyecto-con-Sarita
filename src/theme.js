/**
 * theme.js
 * Gestión de temas de color.
 * Los temas se aplican como variables CSS en <html data-theme="...">.
 * Los colores del canvas se leen desde caché para no llamar getComputedStyle cada frame.
 */

const THEME_KEY = 'snake_theme';

export const THEMES = {
  neon: {
    label:      'Neón',
    accent:     '#4ecca3',
    accentDark: '#38a384',
    snake:      [78,  204, 163],  // RGB de la cabeza
    snakeTail:  [20,  58,  40],
    food:       '#e94560',
    special:    '#f7c948',
    slow:       '#4ec9e9',
    shield:     '#a855f7',
    trail:      'rgba(78,204,163,',
    obstacle:   '#3a3a5a',
  },
  retro: {
    label:      'Retro',
    accent:     '#f7a800',
    accentDark: '#c47800',
    snake:      [247, 168, 0],
    snakeTail:  [90,  50,  0],
    food:       '#ff4444',
    special:    '#ffdd00',
    slow:       '#44aaff',
    shield:     '#cc44ff',
    trail:      'rgba(247,168,0,',
    obstacle:   '#4a3a20',
  },
  ocean: {
    label:      'Océano',
    accent:     '#00d4ff',
    accentDark: '#0099bb',
    snake:      [0,   212, 255],
    snakeTail:  [0,   30,  80],
    food:       '#ff6b6b',
    special:    '#ffd700',
    slow:       '#80dfff',
    shield:     '#bf5fff',
    trail:      'rgba(0,212,255,',
    obstacle:   '#003050',
  },
  forest: {
    label:      'Bosque',
    accent:     '#7fc97f',
    accentDark: '#4a8f4a',
    snake:      [127, 201, 127],
    snakeTail:  [26,  58,  26],
    food:       '#ff6b35',
    special:    '#f7c948',
    slow:       '#4ec9e9',
    shield:     '#bf5fff',
    trail:      'rgba(127,201,127,',
    obstacle:   '#2a3a2a',
  },
};

let current = THEMES.neon;

export function getCurrentTheme() { return current; }

export function setTheme(name) {
  current = THEMES[name] ?? THEMES.neon;
  document.documentElement.dataset.theme = name;
  localStorage.setItem(THEME_KEY, name);

  // Sync CSS variables for UI elements
  const root = document.documentElement.style;
  root.setProperty('--accent',      current.accent);
  root.setProperty('--accent-dark', current.accentDark);
}

export function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'neon';
  setTheme(saved);
  return saved;
}
