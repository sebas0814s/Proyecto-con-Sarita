const CACHE = 'snake-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './styles/main.css',
  './src/game.js',
  './src/board.js',
  './src/snake.js',
  './src/food.js',
  './src/score.js',
  './src/audio.js',
  './src/ui.js',
  './src/input.js',
  './src/achievements.js',
  './src/theme.js',
];

self.addEventListener('install', e =>
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))),
);

self.addEventListener('activate', e =>
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))),
    ),
  ),
);

self.addEventListener('fetch', e =>
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request)),
  ),
);
