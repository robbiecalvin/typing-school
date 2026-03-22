const CACHE_NAME = "typingschool-v4-2026-03-17-logo-refresh";
const CORE_ASSETS = [
  "./",
  "index.html",
  "lessons.html",
  "practice.html",
  "speedtest.html",
  "dashboard.html",
  "sw.js",
  "css/main.css",
  "css/typing.css",
  "css/keyboard.css",
  "css/dashboard.css",
  "js/achievementSystem.js",
  "js/progressTracker.js",
  "js/typingEngine.js",
  "js/lessonEngine.js",
  "js/speedTest.js",
  "js/keyboardVisual.js",
  "js/statsEngine.js",
  "js/uiController.js",
  "js/adaptiveTrainer.js",
  "js/heatmapEngine.js",
  "js/ghostReplay.js",
  "js/chartRenderer.js",
  "js/layoutManager.js",
  "js/lessonGenerator.js",
  "js/rhythmAnalyzer.js",
  "js/skillRanking.js",
  "js/gameModes.js",
  "js/sessionExporter.js",
  "workers/typingWorker.js",
  "workers/analyticsWorker.js",
  "data/lessons.json",
  "data/practice_texts.json",
  "data/quotes.json",
  "data/code_snippets.json",
  "data/keyboard_layouts.json",
  "assets/typingschoologo.png",
  "assets/keyboard.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          return response;
        })
        .catch(() => caches.match("index.html"));
    })
  );
});
