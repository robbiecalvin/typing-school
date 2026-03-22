(function () {
  const themeOptions = [
    { value: "midnight", label: "Midnight" },
    { value: "earth", label: "Earth" },
    { value: "cyberpunk", label: "Cyberpunk" },
    { value: "sketchbook", label: "Sketchbook" },
    { value: "pink-lady", label: "Pink Lady" },
    { value: "retro-game", label: "Retro Game" },
    { value: "high-contrast", label: "High Contrast" }
  ];
  const themeColors = {
    midnight: "#020617",
    earth: "#15160f",
    cyberpunk: "#0b0620",
    sketchbook: "#efebe3",
    "pink-lady": "#2a1022",
    "retro-game": "#0f1b25",
    "high-contrast": "#000000"
  };

  const fallbackPractice = [
    "Steady practice with relaxed hands improves both speed and control.",
    "Keep your fingers close to home row and avoid looking at the keyboard.",
    "Accurate typing first, then smooth pace, then higher sustained speed.",
    "Short daily sessions are more effective than long, infrequent marathons."
  ];

  const fallbackSnippets = [
    { language: "javascript", title: "Loop", challenge_type: "comprehension", snippet: "for (let i = 0; i < 10; i += 1) { console.log(i); }" },
    { language: "python", title: "Function", challenge_type: "comprehension", snippet: "def greet(name):\n    return f'Hello {name}'" },
    { language: "html", title: "Card", challenge_type: "comprehension", snippet: "<section class=\"card\"><h2>Title</h2><p>Body</p></section>" },
    { language: "css", title: "Button", challenge_type: "comprehension", snippet: ".btn { display: inline-block; padding: 8px 12px; border-radius: 8px; }" }
  ];

  const fingerDrillMap = {
    left_index: ["r", "t", "f", "g", "v", "b"],
    right_pinky: ["p", ";", "/", "[", "]", "'"],
    shift: ["a", "A", "s", "S", "d", "D", "f", "F"],
    left_pinky: ["q", "a", "z", "1"],
    right_index: ["y", "u", "h", "j", "n", "m"]
  };

  function setMetric(id, value, suffix) {
    const el = document.getElementById(id);
    if (el) el.textContent = suffix ? `${value}${suffix}` : String(value);
  }

  function updateMetrics(metrics) {
    setMetric("metricWpm", metrics.wpm);
    setMetric("metricAccuracy", metrics.accuracy, "%");
    setMetric("metricErrors", metrics.errors);
    setMetric("metricChars", metrics.chars);
  }

  function syncThemeState(prefs) {
    const root = document.documentElement;
    const isHighContrast = prefs.theme === "high-contrast";
    const backgroundColor = themeColors[prefs.theme] || themeColors.midnight;

    root.classList.toggle("high-contrast", isHighContrast);
    root.style.setProperty("--font-scale", `${prefs.fontScale}%`);
    root.dataset.theme = prefs.theme;
    root.style.backgroundColor = backgroundColor;

    document.body.classList.toggle("high-contrast", isHighContrast);
    document.body.style.setProperty("--font-scale", `${prefs.fontScale}%`);
    document.body.dataset.theme = prefs.theme;
    document.body.style.backgroundColor = backgroundColor;
  }

  function applyUiPrefs() {
    const prefs = window.TypingSchool.ProgressTracker.getUiPrefs();
    syncThemeState(prefs);

    const fontScale = document.getElementById("fontScale");
    const themeSelect = document.getElementById("themeSelect");

    if (fontScale) fontScale.value = String(prefs.fontScale);
    if (themeSelect) {
      if (!themeSelect.dataset.loaded) {
        themeSelect.innerHTML = "";
        themeOptions.forEach((theme) => {
          const option = document.createElement("option");
          option.value = theme.value;
          option.textContent = theme.label;
          themeSelect.appendChild(option);
        });
        themeSelect.dataset.loaded = "1";
      }
      themeSelect.value = prefs.theme;
    }

    if (fontScale && !fontScale.dataset.bound) {
      fontScale.dataset.bound = "1";
      fontScale.addEventListener("input", function () {
        const value = Number(fontScale.value);
        const nextPrefs = {
          ...window.TypingSchool.ProgressTracker.getUiPrefs(),
          fontScale: value
        };
        window.TypingSchool.ProgressTracker.setUiPrefs(nextPrefs);
        syncThemeState(nextPrefs);
      });
    }

    if (themeSelect && !themeSelect.dataset.bound) {
      themeSelect.dataset.bound = "1";
      themeSelect.addEventListener("change", function () {
        const theme = themeOptions.some((option) => option.value === themeSelect.value)
          ? themeSelect.value
          : "midnight";
        const nextPrefs = {
          ...window.TypingSchool.ProgressTracker.getUiPrefs(),
          highContrast: theme === "high-contrast",
          theme
        };
        window.TypingSchool.ProgressTracker.setUiPrefs(nextPrefs);
        syncThemeState(nextPrefs);
      });
    }
  }

  async function loadJson(path, fallback) {
    try {
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) throw new Error(`Failed loading ${path}`);
      const data = await response.json();
      return data;
    } catch (_error) {
      return fallback;
    }
  }

  async function loadPracticeTexts() {
    const data = await loadJson("data/practice_texts.json", fallbackPractice);
    return Array.isArray(data) ? data : fallbackPractice;
  }

  async function loadCodeSnippets() {
    const data = await loadJson("data/code_snippets.json", fallbackSnippets);
    return Array.isArray(data) ? data : fallbackSnippets;
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    if (!window.location.protocol.startsWith("http")) return;
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }

  function markRange(classes, start, end, className) {
    for (let i = start; i < end && i < classes.length; i += 1) {
      classes[i] = className;
    }
  }

  function buildSyntaxClasses(code, language) {
    const text = String(code || "");
    const classes = new Array(text.length).fill("token-plain");
    const lang = String(language || "").toLowerCase();

    let keywords = [];
    if (lang === "javascript") keywords = ["const", "let", "var", "function", "return", "if", "else", "for", "while", "class", "new"];
    if (lang === "python") keywords = ["def", "return", "for", "while", "if", "else", "elif", "class", "import", "from", "with"];
    if (lang === "html") keywords = ["div", "section", "span", "h1", "h2", "h3", "p", "button", "input", "main"];
    if (lang === "css") keywords = ["display", "color", "background", "padding", "margin", "border", "position", "flex", "grid"];

    if (lang === "html") {
      const tagRegex = /<\/?[a-zA-Z][^>]*>/g;
      let match;
      while ((match = tagRegex.exec(text))) {
        markRange(classes, match.index, match.index + match[0].length, "token-tag");
      }
    }

    const stringRegex = /"(?:\\.|[^"])*"|'(?:\\.|[^'])*'/g;
    let match = null;
    while ((match = stringRegex.exec(text))) {
      markRange(classes, match.index, match.index + match[0].length, "token-string");
    }

    const numberRegex = /\b\d+(?:\.\d+)?\b/g;
    while ((match = numberRegex.exec(text))) {
      markRange(classes, match.index, match.index + match[0].length, "token-number");
    }

    const commentPatterns = [];
    if (lang === "python") commentPatterns.push(/#[^\n]*/g);
    if (lang === "javascript" || lang === "css") {
      commentPatterns.push(/\/\/[^\n]*/g);
      commentPatterns.push(/\/\*[\s\S]*?\*\//g);
    }
    if (lang === "html") commentPatterns.push(/<!--[\s\S]*?-->/g);

    commentPatterns.forEach((regex) => {
      regex.lastIndex = 0;
      while ((match = regex.exec(text))) {
        markRange(classes, match.index, match.index + match[0].length, "token-comment");
      }
    });

    const wordRegex = /\b[a-zA-Z_][a-zA-Z0-9_-]*\b/g;
    while ((match = wordRegex.exec(text))) {
      if (keywords.includes(match[0])) markRange(classes, match.index, match.index + match[0].length, "token-keyword");
    }

    return classes;
  }

  function fitTextLength(text, targetLength) {
    let value = String(text || "");
    if (!targetLength || value.length >= targetLength) return value;
    while (value.length < targetLength) {
      value += " " + text;
    }
    return value.slice(0, targetLength);
  }

  function formatMetricValue(value, suffix) {
    return suffix ? `${value}${suffix}` : String(value);
  }

  function ensureResultsOverlay() {
    let overlay = document.getElementById("resultsOverlay");
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = "resultsOverlay";
    overlay.className = "results-overlay";
    overlay.hidden = true;
    overlay.innerHTML = [
      "<section class=\"results-dialog\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"resultsTitle\">",
      "  <div class=\"results-topline\">",
      "    <div>",
      "      <p id=\"resultsKicker\" class=\"results-kicker\">Session Complete</p>",
      "      <h2 id=\"resultsTitle\">Run complete</h2>",
      "      <p id=\"resultsSummary\" class=\"results-summary\"></p>",
      "    </div>",
      "    <button id=\"resultsCloseBtn\" class=\"btn-outline results-close\" type=\"button\">Close</button>",
      "  </div>",
      "  <div id=\"resultsMetrics\" class=\"results-metrics\"></div>",
      "  <div>",
      "    <h3>Highlights</h3>",
      "    <ul id=\"resultsList\" class=\"results-list\"></ul>",
      "  </div>",
      "  <div id=\"resultsUnlocks\" class=\"results-unlocks\" hidden>",
      "    <h3>Unlocked</h3>",
      "    <div id=\"resultsChips\" class=\"results-chip-row\"></div>",
      "  </div>",
      "  <div class=\"results-actions\">",
      "    <p id=\"resultsNext\"></p>",
      "    <button id=\"resultsPrimaryBtn\" class=\"btn-primary\" type=\"button\">Keep Training</button>",
      "  </div>",
      "</section>"
    ].join("");

    document.body.appendChild(overlay);

    function closeOverlay() {
      overlay.hidden = true;
    }

    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) closeOverlay();
    });

    const closeBtn = document.getElementById("resultsCloseBtn");
    const primaryBtn = document.getElementById("resultsPrimaryBtn");
    if (closeBtn) closeBtn.addEventListener("click", closeOverlay);
    if (primaryBtn) primaryBtn.addEventListener("click", closeOverlay);

    return overlay;
  }

  function hideResultsOverlay() {
    const overlay = document.getElementById("resultsOverlay");
    if (overlay) overlay.hidden = true;
  }

  function showResultsOverlay(config) {
    const overlay = ensureResultsOverlay();
    const kicker = document.getElementById("resultsKicker");
    const title = document.getElementById("resultsTitle");
    const summary = document.getElementById("resultsSummary");
    const metricsWrap = document.getElementById("resultsMetrics");
    const list = document.getElementById("resultsList");
    const unlocks = document.getElementById("resultsUnlocks");
    const chips = document.getElementById("resultsChips");
    const next = document.getElementById("resultsNext");
    const primaryBtn = document.getElementById("resultsPrimaryBtn");

    if (kicker) kicker.textContent = config.kicker || "Session Complete";
    if (title) title.textContent = config.title || "Run complete";
    if (summary) summary.textContent = config.summary || "";

    if (metricsWrap) {
      metricsWrap.innerHTML = "";
      (config.metrics || []).forEach((metric) => {
        const item = document.createElement("article");
        const label = document.createElement("span");
        const value = document.createElement("strong");
        label.textContent = metric.label;
        value.textContent = formatMetricValue(metric.value, metric.suffix);
        item.appendChild(label);
        item.appendChild(value);
        metricsWrap.appendChild(item);
      });
    }

    if (list) {
      list.innerHTML = "";
      (config.highlights || []).forEach((entry) => {
        const li = document.createElement("li");
        li.textContent = entry;
        list.appendChild(li);
      });
    }

    if (chips && unlocks) {
      chips.innerHTML = "";
      const items = Array.isArray(config.unlocks) ? config.unlocks : [];
      unlocks.hidden = items.length === 0;
      items.forEach((entry) => {
        const chip = document.createElement("span");
        chip.className = "results-chip";
        chip.textContent = entry;
        chips.appendChild(chip);
      });
    }

    if (next) next.textContent = config.next || "";
    if (primaryBtn) primaryBtn.textContent = config.primaryActionLabel || "Keep Training";

    overlay.hidden = false;
  }

  async function initPracticePage() {
    const typingArea = document.getElementById("typingArea");
    const feedback = document.getElementById("practiceFeedback");
    const newBtn = document.getElementById("newPracticeBtn");
    const startBtn = document.getElementById("startPracticeBtn");
    const keyboardMount = document.getElementById("keyboardMount");
    const modeButtons = Array.from(document.querySelectorAll("[data-practice-mode]"));
    const languageSelect = document.getElementById("codeLanguageSelect");
    const challengeTypeSelect = document.getElementById("challengeTypeSelect");
    const adaptiveSummary = document.getElementById("adaptiveSummary");
    const rhythmFeedback = document.getElementById("rhythmFeedback");
    const fingerDrillSelect = document.getElementById("fingerDrillSelect");
    const gameModeSelect = document.getElementById("gameModeSelect");
    const layoutSelect = document.getElementById("layoutSelect");
    const presetButtons = Array.from(document.querySelectorAll("[data-practice-preset]"));
    const presetTitle = document.getElementById("practicePresetTitle");
    const presetSummary = document.getElementById("practicePresetSummary");
    const resultHeadline = document.getElementById("practiceResultHeadline");
    const resultFocus = document.getElementById("practiceResultFocus");
    const resultNext = document.getElementById("practiceResultNext");

    if (!typingArea || !startBtn || !newBtn) return;

    let engine = null;
    let texts = fallbackPractice;
    let snippets = fallbackSnippets;
    let mode = "general";
    let currentSnippetLang = "javascript";
    let challengeType = "all";
    let practiceStarted = false;
    let sessionClosed = false;
    let layouts = [];
    let activeLayout = null;
    let activePreset = "warmup";

    const presetConfig = {
      warmup: {
        title: "Warm Up",
        summary: "General text, classic scoring, low-friction start.",
        focus: "Settle rhythm and accuracy before pushing pace.",
        next: "Start with a clean run",
        mode: "general",
        gameMode: "classic"
      },
      weak_keys: {
        title: "Weak Key Repair",
        summary: "Adaptive targeting with a focus on accuracy and correction.",
        focus: "Let the trainer surface your highest-friction keys.",
        next: "Run adaptive reps until the heatmap cools",
        mode: "adaptive",
        gameMode: "elimination"
      },
      code_sprint: {
        title: "Code Sprint",
        summary: "Developer snippets with short high-speed bursts.",
        focus: "Train punctuation, symbols, and syntax pacing.",
        next: "Push speed, then verify control",
        mode: "developer",
        gameMode: "burst",
        language: "javascript",
        challengeType: "all"
      },
      accuracy_reset: {
        title: "Accuracy Reset",
        summary: "Finger drills tuned to rebuild control.",
        focus: "Slow the pace down and remove repeated misses.",
        next: "Fix the weakest finger pattern first",
        mode: "finger",
        gameMode: "classic",
        fingerDrill: "left_index"
      },
      ghost_prep: {
        title: "Ghost Prep",
        summary: "Longer classic reps built to stabilize pace before the speed test.",
        focus: "Bank a steady, race-ready performance baseline.",
        next: "Finish this block, then run a timed test",
        mode: "general",
        gameMode: "marathon"
      }
    };

    const rhythm = window.TypingSchool.RhythmAnalyzer ? new window.TypingSchool.RhythmAnalyzer() : null;

    if (window.TypingSchool.LayoutManager) {
      layouts = await window.TypingSchool.LayoutManager.loadLayouts();
      activeLayout = window.TypingSchool.LayoutManager.findLayout(layouts, window.TypingSchool.LayoutManager.getSavedLayoutId());
      if (layoutSelect) {
        layoutSelect.innerHTML = "";
        layouts.forEach((layout) => {
          const option = document.createElement("option");
          option.value = layout.id;
          option.textContent = layout.name;
          layoutSelect.appendChild(option);
        });
        layoutSelect.value = activeLayout.id;
      }
    }

    const keyboard = window.TypingSchool.KeyboardVisual
      ? new window.TypingSchool.KeyboardVisual(keyboardMount, activeLayout)
      : null;

    function refreshHeatmap() {
      if (!keyboard || !window.TypingSchool.HeatmapEngine) return;
      const keyStats = window.TypingSchool.ProgressTracker.getKeyStats();
      const heatmap = window.TypingSchool.HeatmapEngine.mapHeatmap(keyStats, activeLayout);
      keyboard.applyHeatmap(heatmap);
    }

    function refreshAdaptiveSummary() {
      if (!adaptiveSummary || !window.TypingSchool.AdaptiveTrainer) return;
      const top = window.TypingSchool.AdaptiveTrainer.topMistakes(window.TypingSchool.ProgressTracker.getMistakeTable(), 5);
      if (!top.length) {
        adaptiveSummary.textContent = "Top weak keys: no mistake data yet.";
        return;
      }
      adaptiveSummary.textContent = `Top weak keys: ${top.map((x) => `${x.key} (${x.count})`).join(", ")}`;
    }

    function syncModeControls() {
      if (languageSelect) languageSelect.disabled = mode !== "developer";
      if (challengeTypeSelect) challengeTypeSelect.disabled = mode !== "developer";
      if (fingerDrillSelect) fingerDrillSelect.disabled = mode !== "finger";
      modeButtons.forEach((button) => {
        button.classList.toggle("active", (button.dataset.practiceMode || "general") === mode);
      });
    }

    function updateMissionPanel() {
      const preset = presetConfig[activePreset] || presetConfig.warmup;
      if (presetTitle) presetTitle.textContent = preset.title;
      if (presetSummary) presetSummary.textContent = preset.summary;
      if (resultFocus && !sessionClosed) resultFocus.textContent = preset.focus;
      if (resultNext && !sessionClosed) resultNext.textContent = preset.next;
    }

    function updatePresetSelection(nextPreset) {
      activePreset = presetConfig[nextPreset] ? nextPreset : "warmup";
      presetButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.practicePreset === activePreset);
      });
      updateMissionPanel();
    }

    function applyPreset(nextPreset) {
      const preset = presetConfig[nextPreset];
      if (!preset) return;

      updatePresetSelection(nextPreset);
      mode = preset.mode;

      if (gameModeSelect && preset.gameMode) gameModeSelect.value = preset.gameMode;
      if (languageSelect && preset.language) {
        languageSelect.value = preset.language;
        currentSnippetLang = preset.language;
      }
      if (challengeTypeSelect && preset.challengeType) {
        challengeTypeSelect.value = preset.challengeType;
        challengeType = preset.challengeType;
      }
      if (fingerDrillSelect && preset.fingerDrill) fingerDrillSelect.value = preset.fingerDrill;

      syncModeControls();
      loadNext();
      if (feedback) feedback.textContent = `${preset.title} loaded.`;
      if (resultHeadline) resultHeadline.textContent = "Ready to train";
    }

    async function finalizeSession(metrics) {
      if (sessionClosed) return;
      sessionClosed = true;
      const previousState = window.TypingSchool.ProgressTracker.getState();
      const previousBestWpm = Number(previousState.best_wpm || 0);

      const activeGame = window.TypingSchool.GameModes ? gameModeSelect.value : "classic";
      const score = window.TypingSchool.GameModes ? window.TypingSchool.GameModes.computeScore(activeGame, metrics) : 0;

      let rhythmSummary = { feedback: "" };
      if (rhythm) {
        rhythmSummary = await rhythm.summarize();
        if (rhythmFeedback) rhythmFeedback.textContent = rhythmSummary.feedback;
      }

      const payload = {
        type: mode === "developer" ? "developer" : mode,
        ...metrics,
        score,
        cadence: Number((rhythmSummary && rhythmSummary.cadence) || 0),
        variability: Number((rhythmSummary && rhythmSummary.variability) || 0)
      };

      const res = window.TypingSchool.ProgressTracker.recordSession(payload);
      const unlocked = res.newAchievements.length ? ` New achievements: ${res.newAchievements.join(", ")}.` : "";
      const gameText = score > 0 ? ` Score: ${score}.` : "";
      feedback.textContent = `Practice complete. ${metrics.wpm} WPM and ${metrics.accuracy}% accuracy.${gameText}${unlocked}`;
      refreshAdaptiveSummary();

      if (resultHeadline) {
        if (metrics.accuracy >= 98 && metrics.wpm >= 70) resultHeadline.textContent = "Elite control";
        else if (metrics.accuracy >= 96) resultHeadline.textContent = "Clean run";
        else if (metrics.wpm >= 60) resultHeadline.textContent = "Fast but loose";
        else resultHeadline.textContent = "Foundation built";
      }

      const weakKeys = window.TypingSchool.ProgressTracker.getWeakKeyRanking(2);
      if (resultFocus) {
        resultFocus.textContent = weakKeys.length
          ? `Watch ${weakKeys.map((item) => item.key.toUpperCase()).join(" and ")} next.`
          : `${mode === "developer" ? "Syntax pace" : "Rhythm stability"} stayed in focus.`;
      }

      if (resultNext) {
        if (metrics.accuracy < 96) resultNext.textContent = "Run another controlled rep before increasing speed";
        else if (mode !== "developer") resultNext.textContent = "Bank one more session, then take a speed test";
        else resultNext.textContent = "Switch to a burst run and keep punctuation clean";
      }

      const highlights = [];
      if (metrics.wpm > previousBestWpm) highlights.push(`New personal best: ${metrics.wpm} WPM, up from ${previousBestWpm}.`);
      else highlights.push(`Top speed landed at ${metrics.wpm} WPM with ${metrics.accuracy}% accuracy.`);
      if (score > 0) highlights.push(`Game score: ${score}.`);
      if (weakKeys.length) highlights.push(`Highest-friction keys now: ${weakKeys.map((item) => item.key.toUpperCase()).join(" and ")}.`);
      if (rhythmSummary && rhythmSummary.feedback) highlights.push(rhythmSummary.feedback);

      showResultsOverlay({
        kicker: "Practice Complete",
        title: mode === "developer" ? "Code block finished" : "Training block finished",
        summary: `${metrics.chars} characters logged across a focused ${mode} session.`,
        metrics: [
          { label: "WPM", value: metrics.wpm },
          { label: "Accuracy", value: metrics.accuracy, suffix: "%" },
          { label: "Errors", value: metrics.errors },
          { label: "Chars", value: metrics.chars }
        ],
        highlights,
        unlocks: res.newAchievements,
        next: resultNext ? resultNext.textContent : "Load another block and keep the streak moving.",
        primaryActionLabel: "Train Again"
      });
    }

    function setupEngine(text, charClasses) {
      if (engine) engine.stop();
      sessionClosed = false;
      practiceStarted = false;
      if (rhythm) rhythm.reset();

      engine = new window.TypingSchool.TypingEngine({
        mount: typingArea,
        targetText: text,
        charClasses,
        onUpdate: function (metrics) {
          updateMetrics(metrics);
          if (!practiceStarted) return;

          if (window.TypingSchool.GameModes && window.TypingSchool.GameModes.shouldEnd(gameModeSelect.value, metrics)) {
            engine.stop();
            finalizeSession(metrics);
          }
        },
        onKeyEvent: function (result, nextExpected, meta) {
          if (!result.isCorrect) window.TypingSchool.ProgressTracker.recordMistake(result.expected);
          window.TypingSchool.ProgressTracker.updateKeyStats(result.typed, result.isCorrect, meta.delay);

          if (rhythm) {
            rhythm.addKeyEvent({ key: result.typed, delay: meta.delay });
          }

          if (keyboard) {
            keyboard.highlightRequired(nextExpected);
            if (!result.isCorrect) keyboard.markMistype(result.typed);
            refreshHeatmap();
          }
        },
        onComplete: function (metrics) {
          finalizeSession(metrics);
        }
      });

      engine.render();
      updateMetrics(engine.getMetrics());
      if (keyboard) {
        keyboard.setLayout(activeLayout);
        keyboard.highlightRequired(engine.getExpectedChar());
        refreshHeatmap();
      }
      refreshAdaptiveSummary();
    }

    function randomText() {
      return texts[Math.floor(Math.random() * texts.length)] || fallbackPractice[0];
    }

    function randomSnippet() {
      const filtered = snippets.filter((item) => {
        const langMatch = String(item.language).toLowerCase() === currentSnippetLang;
        const typeMatch = challengeType === "all" || String(item.challenge_type || "comprehension") === challengeType;
        return langMatch && typeMatch;
      });
      const pool = filtered.length ? filtered : snippets;
      return pool[Math.floor(Math.random() * pool.length)] || fallbackSnippets[0];
    }

    function generateModeText() {
      const gameConfig = window.TypingSchool.GameModes ? window.TypingSchool.GameModes.getMode(gameModeSelect.value) : { targetLength: 140 };

      if (mode === "adaptive" && window.TypingSchool.LessonGenerator) {
        const state = window.TypingSchool.ProgressTracker.getState();
        const weakKeys = window.TypingSchool.ProgressTracker.getWeakKeyRanking(6).map((item) => item.key);
        const text = window.TypingSchool.LessonGenerator.generateAdaptiveLesson({
          mistakes: state.mistake_table,
          weakKeys,
          wpm: state.average_wpm
        });
        return { text: fitTextLength(text, gameConfig.targetLength), classes: [], fingerKeys: weakKeys };
      }

      if (mode === "finger" && window.TypingSchool.LessonGenerator) {
        const drillType = fingerDrillSelect ? fingerDrillSelect.value : "left_index";
        const text = window.TypingSchool.LessonGenerator.generateFingerDrill(drillType);
        const fingerKeys = fingerDrillMap[drillType] || [];
        return { text: fitTextLength(text, gameConfig.targetLength), classes: [], fingerKeys };
      }

      if (mode === "developer") {
        const snippet = randomSnippet();
        return {
          text: fitTextLength(snippet.snippet, gameConfig.targetLength),
          classes: buildSyntaxClasses(snippet.snippet, snippet.language),
          fingerKeys: []
        };
      }

      return { text: fitTextLength(randomText(), gameConfig.targetLength), classes: [], fingerKeys: [] };
    }

    function loadNext() {
      const next = generateModeText();
      setupEngine(next.text, next.classes);
      if (keyboard) {
        keyboard.setFingerPlacement(next.fingerKeys || []);
      }
      feedback.textContent = "New text loaded.";
      if (resultHeadline && !practiceStarted) resultHeadline.textContent = "Ready to train";
    }

    const [loadedTexts, loadedSnippets] = await Promise.all([loadPracticeTexts(), loadCodeSnippets()]);
    texts = loadedTexts;
    snippets = loadedSnippets;
    updatePresetSelection(activePreset);
    loadNext();

    newBtn.addEventListener("click", function () {
      loadNext();
    });

    startBtn.addEventListener("click", function () {
      if (!engine) return;
      hideResultsOverlay();
      feedback.textContent = "";
      practiceStarted = true;
      sessionClosed = false;
      if (resultHeadline) resultHeadline.textContent = "Session in progress";
      if (rhythm) rhythm.reset();
      engine.start();
      if (keyboard) keyboard.highlightRequired(engine.getExpectedChar());
    });

    modeButtons.forEach((button) => {
      button.addEventListener("click", function () {
        mode = button.dataset.practiceMode || "general";
        if (mode === "adaptive") updatePresetSelection("weak_keys");
        else if (mode === "finger") updatePresetSelection("accuracy_reset");
        else if (mode === "developer") updatePresetSelection("code_sprint");
        else updatePresetSelection("warmup");
        syncModeControls();
        loadNext();
      });
    });

    presetButtons.forEach((button) => {
      button.addEventListener("click", function () {
        applyPreset(button.dataset.practicePreset || "warmup");
      });
    });

    if (layoutSelect && window.TypingSchool.LayoutManager) {
      layoutSelect.addEventListener("change", function () {
        activeLayout = window.TypingSchool.LayoutManager.findLayout(layouts, layoutSelect.value);
        window.TypingSchool.LayoutManager.saveLayoutId(activeLayout.id);
        if (keyboard) {
          keyboard.setLayout(activeLayout);
          keyboard.highlightRequired(engine ? engine.getExpectedChar() : "");
          refreshHeatmap();
        }
      });
    }

    if (languageSelect) {
      languageSelect.addEventListener("change", function () {
        currentSnippetLang = String(languageSelect.value || "javascript").toLowerCase();
        if (mode === "developer") loadNext();
      });
    }

    if (challengeTypeSelect) {
      challengeTypeSelect.addEventListener("change", function () {
        challengeType = String(challengeTypeSelect.value || "all");
        if (mode === "developer") loadNext();
      });
    }

    if (fingerDrillSelect) {
      fingerDrillSelect.addEventListener("change", function () {
        if (mode === "finger") loadNext();
      });
    }

    if (gameModeSelect) {
      gameModeSelect.addEventListener("change", function () {
        loadNext();
      });
    }
  }

  function initSpeedTestPage() {
    const typingArea = document.getElementById("typingArea");
    const feedback = document.getElementById("speedFeedback");
    const timerEl = document.getElementById("speedTimer");
    const keyboardMount = document.getElementById("keyboardMount");
    const durationButtons = Array.from(document.querySelectorAll(".duration-btn"));
    const startBtn = document.getElementById("startSpeedBtn");
    const resetBtn = document.getElementById("resetSpeedBtn");
    const raceToggle = document.getElementById("raceModeToggle");
    const ghostSelect = document.getElementById("ghostSessionSelect");
    const replayBtn = document.getElementById("replayGhostBtn");
    const replayMount = document.getElementById("ghostReplayArea");
    const userBar = document.getElementById("userRaceBar");
    const ghostBar = document.getElementById("ghostRaceBar");
    const replayPlayBtn = document.getElementById("replayPlayBtn");
    const replayPauseBtn = document.getElementById("replayPauseBtn");
    const replaySpeed = document.getElementById("replaySpeed");
    const replayScrubber = document.getElementById("replayScrubber");
    const presetButtons = Array.from(document.querySelectorAll("[data-speed-preset]"));
    const presetTitle = document.getElementById("speedPresetTitle");
    const presetSummary = document.getElementById("speedPresetSummary");
    const statusHeadline = document.getElementById("speedStatusHeadline");
    const ghostHeadline = document.getElementById("speedGhostHeadline");
    const targetHeadline = document.getElementById("speedTargetHeadline");
    const resultHeadline = document.getElementById("speedResultHeadline");
    const raceCall = document.getElementById("speedRaceCall");
    const resultNext = document.getElementById("speedResultNext");
    const rhythmSummary = document.getElementById("speedRhythmSummary");
    const ghostSummary = document.getElementById("speedGhostSummary");

    if (!typingArea || !window.TypingSchool.SpeedTest) return;

    const rhythm = window.TypingSchool.RhythmAnalyzer ? new window.TypingSchool.RhythmAnalyzer() : null;
    const keyboard = window.TypingSchool.KeyboardVisual && keyboardMount
      ? new window.TypingSchool.KeyboardVisual(keyboardMount)
      : null;
    let replayPlayer = null;
    let activePreset = "benchmark";

    const presetConfig = {
      benchmark: {
        title: "Benchmark",
        summary: "Classic setup for measuring current pace with no race pressure.",
        duration: 30,
        useGhost: false,
        status: "Ready on the line",
        target: "Set a baseline run"
      },
      sprint: {
        title: "Sprint",
        summary: "Quick launch with a 15-second focus on explosive speed.",
        duration: 15,
        useGhost: false,
        status: "Explosive start loaded",
        target: "Push a sharp opening burst"
      },
      duel: {
        title: "Ghost Duel",
        summary: "Enable race mode and compare your pacing against prior performance.",
        duration: 30,
        useGhost: true,
        status: "Rival requested",
        target: "Beat your saved ghost"
      },
      endurance: {
        title: "Endurance",
        summary: "Extended test for consistency and collapse resistance.",
        duration: 60,
        useGhost: false,
        status: "Long-form run loaded",
        target: "Hold pace without accuracy drop-off"
      }
    };

    function setRaceBars(userProgress, ghostProgress) {
      if (userBar) userBar.style.width = `${Math.round(Math.max(0, Math.min(1, userProgress)) * 100)}%`;
      if (ghostBar) ghostBar.style.width = `${Math.round(Math.max(0, Math.min(1, ghostProgress)) * 100)}%`;
    }

    function getGhostSessions() {
      return window.TypingSchool.ProgressTracker.getGhostSessions().slice().reverse();
    }

    function selectedGhost() {
      const id = ghostSelect ? ghostSelect.value : "";
      return getGhostSessions().find((session) => session.id === id) || null;
    }

    function describeGhost(session) {
      if (!session) return "No rival loaded";
      return `${session.wpm} WPM ghost from ${new Date(session.date).toLocaleDateString()}`;
    }

    function updateGhostPanel() {
      const ghost = selectedGhost();
      if (ghostHeadline) ghostHeadline.textContent = describeGhost(ghost);
      if (ghostSummary) {
        ghostSummary.textContent = ghost
          ? `Replay ready: ${ghost.wpm} WPM over ${ghost.duration} seconds.`
          : "Save a run to build a library of ghosts to race later.";
      }
      if (raceCall && !test.running) {
        raceCall.textContent = ghost && raceToggle && raceToggle.checked
          ? `Ghost armed at ${ghost.wpm} WPM`
          : ghost
            ? "Ghost selected but race mode is off"
            : "No ghost selected";
      }
    }

    function setDurationButton(seconds) {
      durationButtons.forEach((button) => {
        button.classList.toggle("active", Number(button.dataset.duration) === Number(seconds));
      });
      test.setDuration(Number(seconds));
      test.prepareEngine();
    }

    function updatePresetPanel() {
      const preset = presetConfig[activePreset] || presetConfig.benchmark;
      if (presetTitle) presetTitle.textContent = preset.title;
      if (presetSummary) presetSummary.textContent = preset.summary;
      if (statusHeadline && !test.running) statusHeadline.textContent = preset.status;
      if (targetHeadline && !test.running) targetHeadline.textContent = preset.target;
    }

    function selectPreset(nextPreset) {
      activePreset = presetConfig[nextPreset] ? nextPreset : "benchmark";
      presetButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.speedPreset === activePreset);
      });
      updatePresetPanel();
    }

    function applyPreset(nextPreset) {
      const preset = presetConfig[nextPreset];
      if (!preset) return;

      selectPreset(nextPreset);
      setDurationButton(preset.duration);

      if (raceToggle) {
        if (preset.useGhost) {
          const ghost = selectedGhost();
          if (ghost) {
            raceToggle.checked = true;
            test.setGhostForRace(ghost);
            if (raceCall) raceCall.textContent = `Ghost armed at ${ghost.wpm} WPM`;
          } else {
            raceToggle.checked = false;
            test.setGhostForRace(null);
            if (raceCall) raceCall.textContent = "Pick a ghost to start this duel";
          }
        } else {
          raceToggle.checked = false;
          test.setGhostForRace(null);
        }
      }

      updateGhostPanel();
      if (feedback) feedback.textContent = `${preset.title} loaded.`;
      if (resultHeadline) resultHeadline.textContent = "Waiting to start";
      if (resultNext) {
        resultNext.textContent = preset.useGhost
          ? "Load a ghost and beat its pace"
          : "Start the timer and bank a stronger benchmark";
      }
    }

    function refreshGhostSelect() {
      if (!ghostSelect) return;
      const selected = ghostSelect.value;
      const sessions = getGhostSessions();
      ghostSelect.innerHTML = "<option value=''>Select ghost replay</option>";
      sessions.forEach((session) => {
        const option = document.createElement("option");
        option.value = session.id;
        const when = new Date(session.date).toLocaleDateString();
        option.textContent = `${when} - ${session.wpm} WPM (${session.duration}s)`;
        ghostSelect.appendChild(option);
      });

      if (sessions.some((s) => s.id === selected)) {
        ghostSelect.value = selected;
      }
      updateGhostPanel();
    }

    const test = new window.TypingSchool.SpeedTest({
      mount: typingArea,
      feedback,
      timerEl,
      durationButtons,
      startBtn,
      resetBtn,
      updateMetrics,
      onRaceUpdate: function (payload) {
        setRaceBars(payload.userProgress, payload.ghostProgress);
      },
      onStart: function () {
        hideResultsOverlay();
        if (rhythm) rhythm.reset();
        if (keyboard && test.engine) keyboard.highlightRequired(test.engine.getExpectedChar());
        if (statusHeadline) statusHeadline.textContent = "Race live";
        if (resultHeadline) resultHeadline.textContent = "Run in progress";
        if (targetHeadline) {
          targetHeadline.textContent = test.raceEnabled
            ? "Hold the ghost behind you"
            : "Convert control into speed";
        }
      },
      onKeyEvent: function (result, nextExpected, meta) {
        if (rhythm) rhythm.addKeyEvent({ key: result.typed, delay: meta.delay });
        if (keyboard) {
          keyboard.highlightRequired(nextExpected);
          if (!result.isCorrect) keyboard.markMistype(result.typed);
        }
      },
      onGhostSaved: function () {
        refreshGhostSelect();
      },
      onPrepared: function (nextExpected) {
        if (keyboard) keyboard.highlightRequired(nextExpected);
      },
      onFinished: async function (payload) {
        if (!payload || !payload.metrics) return;
        let rhythmText = "Rhythm feedback appears after each timed run.";
        if (rhythm) {
          const summary = await rhythm.summarize();
          rhythmText = summary.feedback || rhythmText;
          feedback.textContent += ` ${summary.feedback}`;
        }

        const metrics = payload.metrics;
        const ghost = selectedGhost();
        const margin = ghost ? metrics.wpm - Number(ghost.wpm || 0) : 0;

        if (statusHeadline) statusHeadline.textContent = "Race complete";
        if (rhythmSummary) rhythmSummary.textContent = rhythmText;

        if (resultHeadline) {
          if (metrics.wpm >= 100) resultHeadline.textContent = "Blazing finish";
          else if (metrics.wpm >= 80) resultHeadline.textContent = "Fast run";
          else if (metrics.accuracy >= 97) resultHeadline.textContent = "Controlled pace";
          else resultHeadline.textContent = "Baseline captured";
        }

        if (raceCall) {
          if (payload.raceEnabled && ghost) {
            if (margin > 0) raceCall.textContent = `Ghost beaten by ${margin.toFixed(1)} WPM`;
            else if (margin < 0) raceCall.textContent = `Ghost won by ${Math.abs(margin).toFixed(1)} WPM`;
            else raceCall.textContent = "Dead heat with your ghost";
          } else if (payload.ghostSaved) {
            raceCall.textContent = "New ghost saved for future races";
          } else {
            raceCall.textContent = "No rival in this run";
          }
        }

        if (resultNext) {
          if (metrics.accuracy < 96) resultNext.textContent = "Run it again with cleaner accuracy before chasing speed";
          else if (!payload.raceEnabled) resultNext.textContent = "Load this ghost and turn the next run into a duel";
          else resultNext.textContent = margin > 0
            ? "Raise the duration and defend the lead over a longer run"
            : "Rematch immediately and focus on early-race control";
        }

        const highlights = [];
        if (payload.isNewBest) highlights.push(`New personal best: ${metrics.wpm} WPM, up from ${payload.previousBestWpm}.`);
        else highlights.push(`Timed finish: ${metrics.wpm} WPM at ${metrics.accuracy}% accuracy.`);
        if (payload.raceEnabled && ghost) {
          highlights.push(
            margin > 0
              ? `You beat the selected ghost by ${margin.toFixed(1)} WPM.`
              : margin < 0
                ? `The selected ghost stayed ahead by ${Math.abs(margin).toFixed(1)} WPM.`
                : "You matched the ghost exactly."
          );
        }
        if (payload.ghostSaved) highlights.push("This run was saved as a new ghost for future races.");
        if (rhythmText) highlights.push(rhythmText);

        showResultsOverlay({
          kicker: "Speed Test Complete",
          title: payload.raceEnabled ? "Race finished" : "Benchmark captured",
          summary: `${metrics.chars} characters logged across a ${test.duration}-second run.`,
          metrics: [
            { label: "WPM", value: metrics.wpm },
            { label: "Accuracy", value: metrics.accuracy, suffix: "%" },
            { label: "Errors", value: metrics.errors },
            { label: "Chars", value: metrics.chars }
          ],
          highlights,
          unlocks: payload.result ? payload.result.newAchievements : [],
          next: resultNext ? resultNext.textContent : "Load another timed run.",
          primaryActionLabel: payload.raceEnabled ? "Rematch" : "Run Again"
        });
      }
    });

    if (rhythm) rhythm.reset();
    test.init().then(function () {
      refreshGhostSelect();
      applyPreset(activePreset);
    });

    if (raceToggle) {
      raceToggle.addEventListener("change", function () {
        if (!raceToggle.checked) {
          test.setGhostForRace(null);
          setRaceBars(0, 0);
          updateGhostPanel();
          if (statusHeadline && !test.running) statusHeadline.textContent = "Solo run loaded";
          return;
        }

        const ghost = selectedGhost();
        if (!ghost) {
          raceToggle.checked = false;
          feedback.textContent = "Select a ghost replay before enabling race mode.";
          return;
        }
        test.setGhostForRace(ghost);
        feedback.textContent = "Race mode enabled.";
        updateGhostPanel();
      });
    }

    if (ghostSelect) {
      ghostSelect.addEventListener("change", function () {
        if (raceToggle && raceToggle.checked) {
          test.setGhostForRace(selectedGhost());
        }
        updateGhostPanel();
      });
    }

    function loadReplay() {
      const ghost = selectedGhost();
      if (!ghost || !window.TypingSchool.GhostReplay) {
        feedback.textContent = "Select a ghost session to replay.";
        return;
      }
      replayPlayer = window.TypingSchool.GhostReplay.createPlayer(replayMount, ghost.text, ghost.replay, {
        onProgress: function (progress) {
          if (replayScrubber) replayScrubber.value = String(Math.round(progress * 100));
        }
      });
      if (replayScrubber) replayScrubber.value = "0";
    }

    if (replayBtn) replayBtn.addEventListener("click", loadReplay);
    if (replayPlayBtn) replayPlayBtn.addEventListener("click", function () { if (replayPlayer) replayPlayer.play(); });
    if (replayPauseBtn) replayPauseBtn.addEventListener("click", function () { if (replayPlayer) replayPlayer.pause(); });

    presetButtons.forEach((button) => {
      button.addEventListener("click", function () {
        applyPreset(button.dataset.speedPreset || "benchmark");
      });
    });

    if (replaySpeed) {
      replaySpeed.addEventListener("input", function () {
        if (!replayPlayer) return;
        replayPlayer.setSpeed(Number(replaySpeed.value) / 100);
      });
    }

    if (replayScrubber) {
      replayScrubber.addEventListener("input", function () {
        if (!replayPlayer) return;
        replayPlayer.seek(Number(replayScrubber.value) / 100);
      });
    }
  }

  function initDashboardPage() {
    if (window.TypingSchool.StatsEngine) {
      window.TypingSchool.StatsEngine.renderDashboard();
    }

    const exportJsonBtn = document.getElementById("exportJsonBtn");
    const exportCsvBtn = document.getElementById("exportCsvBtn");

    if (exportJsonBtn && window.TypingSchool.SessionExporter) {
      exportJsonBtn.addEventListener("click", function () {
        window.TypingSchool.SessionExporter.exportJson(window.TypingSchool.ProgressTracker.getState());
      });
    }

    if (exportCsvBtn && window.TypingSchool.SessionExporter) {
      exportCsvBtn.addEventListener("click", function () {
        window.TypingSchool.SessionExporter.exportCsv(window.TypingSchool.ProgressTracker.getState());
      });
    }
  }

  function initPage() {
    applyUiPrefs();
    registerServiceWorker();

    const page = document.body.dataset.page;
    if (page === "home" && window.TypingSchool.StatsEngine) {
      window.TypingSchool.StatsEngine.renderHome();
    }

    if (page === "dashboard") {
      initDashboardPage();
    }

    if (page === "lessons" && window.TypingSchool.LessonEngine) {
      window.TypingSchool.LessonEngine.init();
    }

    if (page === "practice") {
      initPracticePage();
    }

    if (page === "speedtest") {
      initSpeedTestPage();
    }
  }

  document.addEventListener("DOMContentLoaded", initPage);
})();
