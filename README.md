# TypingSchool (Version 3)

TypingSchool is a fully static typing training platform built with HTML, CSS, and JavaScript.
It runs entirely client-side and stays deployable to GitHub Pages without build tools.

## Core Principles

- Preserve V1/V2 architecture and feature set
- Extend with modular JavaScript, no backend
- Keep typing flow smooth and distraction-free
- Persist progress locally via `localStorage`

## Version 3 Features

- AI Lesson Generator (`js/lessonGenerator.js`)
  - Generates targeted paragraphs from mistake profile, weak keys, and speed
- Finger Training Mode
  - Left/right finger drills and shift-focused exercises with keyboard guidance
- Typing Rhythm Analyzer (`js/rhythmAnalyzer.js` + `workers/analyticsWorker.js`)
  - Detects cadence issues, hesitation, bursts, and punctuation slowdowns
- Session Heatmap Analytics
  - Per-key delay, mistake rate, and finger efficiency overlays
- Replay Timeline Controls (`js/ghostReplay.js`)
  - Timeline scrubber, pause/resume, and playback speed controls
- Practice Game Modes (`js/gameModes.js`)
  - Survival, elimination, burst, and marathon scoring modes
- Progressive Skill Levels (`js/skillRanking.js`)
  - Beginner, Intermediate, Advanced, Expert, Master
- Multi-layout Keyboard Support (`data/keyboard_layouts.json`, `js/layoutManager.js`)
  - QWERTY, DVORAK, COLEMAK
- Developer Challenges
  - Debugging/refactoring/comprehension snippet categories
- Advanced Dashboard
  - Speed distribution, weak key ranking, streak graph, frequency charts
- Export System (`js/sessionExporter.js`)
  - Export stats as JSON and CSV

## Workers

- `workers/typingWorker.js` for real-time metric computation
- `workers/analyticsWorker.js` for rhythm and consistency analysis

## Offline Support

- `sw.js` caches pages, assets, scripts, workers, and data
- App works offline after first HTTP load

## Run

1. Open `index.html` in a browser.
2. Navigate to lessons, practice, speed tests, and dashboard.
3. Progress persists locally.

## Deploy (GitHub Pages)

1. Push repository to GitHub.
2. Enable Pages from repo root.
3. No build step required.

## Architecture and evaluation

Client-side JavaScript modules, web workers and localStorage separate training, analytics and persistence. Suggested checks include known typing-error sequences, timing calculations, keyboard layout switching, replay and JSON/CSV export. These are proposed checks, not verified test results.
