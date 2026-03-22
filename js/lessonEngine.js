(function () {
  const fallbackLessons = [
    { id: "l1", level: 1, title: "Home Row Basics", description: "Start with F and J anchors and nearby keys.", target_keys: ["a", "s", "d", "f", "j", "k", "l", ";"], practice_text: "asdf jkl; asdf jkl; fj fj fj asdf jkl;", required_accuracy: 90 },
    { id: "l2", level: 2, title: "Top Row Reach", description: "Introduce top row while keeping rhythm.", target_keys: ["q", "w", "e", "r", "u", "i", "o", "p"], practice_text: "qwer uiop qwer uiop we we ri ri op op", required_accuracy: 90 },
    { id: "l3", level: 3, title: "Bottom Row", description: "Build precision on bottom row keys.", target_keys: ["z", "x", "c", "v", "b", "n", "m"], practice_text: "zxcv bnm zxcv bnm cv cv bn bn", required_accuracy: 91 },
    { id: "l4", level: 4, title: "Number Row", description: "Control speed on number row reach.", target_keys: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"], practice_text: "12345 67890 09876 54321 123 890", required_accuracy: 92 },
    { id: "l5", level: 5, title: "Symbols", description: "Practice common punctuation and symbols.", target_keys: [",", ".", "/", ";", "'", "-", "="], practice_text: "a, a. a/ a; a' a- a= ;,./ -=", required_accuracy: 92 },
    { id: "l6", level: 6, title: "Word Flow", description: "Short words with smooth transitions.", target_keys: ["a", "s", "d", "f", "j", "k", "l", ";"], practice_text: "fast ask flask salad falls jack all", required_accuracy: 93 },
    { id: "l7", level: 7, title: "Sentence Timing", description: "Type complete sentences with punctuation.", target_keys: ["Enter", ".", ",", " "], practice_text: "Typing with focus builds speed, control, and confidence.", required_accuracy: 94 },
    { id: "l8", level: 8, title: "Paragraph Control", description: "Long-form typing with steady accuracy.", target_keys: ["Enter", " ", ".", ","], practice_text: "Small daily practice compounds over time. Keep your shoulders relaxed, your wrists neutral, and your eyes ahead of the cursor.", required_accuracy: 95 }
  ];

  async function loadLessons() {
    try {
      const response = await fetch("data/lessons.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load lessons");
      const data = await response.json();
      return Array.isArray(data) ? data : fallbackLessons;
    } catch (_error) {
      return fallbackLessons;
    }
  }

  function setMetric(id, value, suffix) {
    const el = document.getElementById(id);
    if (el) el.textContent = suffix ? `${value}${suffix}` : String(value);
  }

  async function init() {
    const listEl = document.getElementById("lessonList");
    const titleEl = document.getElementById("lessonTitle");
    const descEl = document.getElementById("lessonDescription");
    const typingArea = document.getElementById("typingArea");
    const startBtn = document.getElementById("startLessonBtn");
    const resetBtn = document.getElementById("resetLessonBtn");
    const feedback = document.getElementById("lessonFeedback");
    const keyboardMount = document.getElementById("keyboardMount");
    const layoutSelect = document.getElementById("layoutSelect");

    if (!listEl || !typingArea) return;

    const lessons = await loadLessons();
    let currentLesson = lessons[0] || null;
    let typingEngine = null;
    let keyboard = null;
    let layouts = [];
    let activeLayout = null;

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

    if (window.TypingSchool.KeyboardVisual && keyboardMount) {
      keyboard = new window.TypingSchool.KeyboardVisual(keyboardMount, activeLayout);
    }

    function updateMetrics(metrics) {
      setMetric("metricWpm", metrics.wpm);
      setMetric("metricAccuracy", metrics.accuracy, "%");
      setMetric("metricErrors", metrics.errors);
      setMetric("metricChars", metrics.chars);
    }

    function applyKeyboardHeatmap() {
      if (!keyboard || !window.TypingSchool.HeatmapEngine) return;
      const heatmap = window.TypingSchool.HeatmapEngine.mapHeatmap(
        window.TypingSchool.ProgressTracker.getKeyStats(),
        activeLayout
      );
      keyboard.applyHeatmap(heatmap);
    }

    function bindEngine() {
      if (!currentLesson) return;
      if (typingEngine) typingEngine.stop();

      typingEngine = new window.TypingSchool.TypingEngine({
        mount: typingArea,
        targetText: currentLesson.practice_text,
        onUpdate: updateMetrics,
        onKeyEvent: function (eventResult, nextExpected, meta) {
          window.TypingSchool.ProgressTracker.updateKeyStats(eventResult.typed, eventResult.isCorrect, meta.delay);
          if (!eventResult.isCorrect) {
            window.TypingSchool.ProgressTracker.recordMistake(eventResult.expected);
          }
          if (!keyboard) return;
          keyboard.highlightRequired(nextExpected);
          if (!eventResult.isCorrect) keyboard.markMistype(eventResult.typed);
          applyKeyboardHeatmap();
        },
        onComplete: function (metrics) {
          const result = window.TypingSchool.ProgressTracker.completeLesson(currentLesson.id, metrics);
          const passed = metrics.accuracy >= Number(currentLesson.required_accuracy || 0);
          const unlocked = result.newAchievements.length ? ` New achievements: ${result.newAchievements.join(", ")}.` : "";
          feedback.textContent = passed
            ? `Lesson complete. Accuracy ${metrics.accuracy}% met required ${currentLesson.required_accuracy}%.${unlocked}`
            : `Lesson complete, but required accuracy is ${currentLesson.required_accuracy}%. Try again.${unlocked}`;
        }
      });

      typingEngine.render();
      updateMetrics(typingEngine.getMetrics());
      if (keyboard) {
        keyboard.setLayout(activeLayout);
        keyboard.setFingerPlacement(currentLesson.target_keys || []);
        keyboard.highlightRequired(typingEngine.getExpectedChar());
        applyKeyboardHeatmap();
      }
    }

    function selectLesson(lesson, trigger) {
      currentLesson = lesson;
      titleEl.textContent = `Level ${lesson.level}: ${lesson.title}`;
      descEl.textContent = `${lesson.description} Required accuracy: ${lesson.required_accuracy}%.`;
      feedback.textContent = "";
      bindEngine();

      listEl.querySelectorAll("button").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.lessonId === lesson.id);
      });

      if (trigger) typingArea.focus();
    }

    lessons.forEach((lesson) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.lessonId = lesson.id;
      btn.textContent = `Level ${lesson.level}: ${lesson.title}`;
      btn.addEventListener("click", function () {
        selectLesson(lesson, true);
      });
      li.appendChild(btn);
      listEl.appendChild(li);
    });

    if (currentLesson) selectLesson(currentLesson, false);

    startBtn.addEventListener("click", function () {
      if (!typingEngine) return;
      feedback.textContent = "";
      typingEngine.start();
      if (keyboard) keyboard.highlightRequired(typingEngine.getExpectedChar());
    });

    resetBtn.addEventListener("click", function () {
      if (!typingEngine) return;
      feedback.textContent = "Lesson reset.";
      typingEngine.reset(false);
      if (keyboard) keyboard.highlightRequired(typingEngine.getExpectedChar());
    });

    if (layoutSelect && window.TypingSchool.LayoutManager) {
      layoutSelect.addEventListener("change", function () {
        const selected = window.TypingSchool.LayoutManager.findLayout(layouts, layoutSelect.value);
        activeLayout = selected;
        window.TypingSchool.LayoutManager.saveLayoutId(selected.id);
        if (keyboard) {
          keyboard.setLayout(activeLayout);
          keyboard.setFingerPlacement((currentLesson && currentLesson.target_keys) || []);
          keyboard.highlightRequired(typingEngine ? typingEngine.getExpectedChar() : "");
          applyKeyboardHeatmap();
        }
      });
    }
  }

  window.TypingSchool = window.TypingSchool || {};
  window.TypingSchool.LessonEngine = { init, loadLessons };
})();
