# Offline and persistence smoke checks

Serve the repository over localhost HTTP rather than opening a file URL when testing service workers. For example, run `python3 -m http.server 8000` from the repository root and visit `http://localhost:8000`.

1. Load the application online and check service worker registration in browser developer tools.
2. Complete a typing session and reload; verify progress persists.
3. Switch the browser to offline mode and reload; verify cached training pages and assets remain available.
4. Restore connectivity, check for service worker updates, and verify a new session still saves.
5. Export session data before clearing site storage; clearing storage can remove locally saved progress.

Record browser version, observed results and any console errors. This checklist describes manual verification, not completed test results.
