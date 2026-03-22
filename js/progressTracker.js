(function () {
  const STORAGE_KEY = "typingSchoolProgress";
  const PREFS_KEY = "typingSchoolUiPrefs";
  const MAX_HISTORY = 300;
  const MAX_GHOST_SESSIONS = 25;

  const defaultState = {
    lessons_completed: [],
    best_wpm: 0,
    average_wpm: 0,
    accuracy: 100,
    daily_streak: 0,
    last_practice_date: "",
    typing_history: [],
    achievements: [],
    mistake_table: {},
    key_stats: {},
    ghost_sessions: [],
    daily_counts: {},
    rhythm_history: [],
    game_history: []
  };

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function persist(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  function sanitizeState(stored) {
    return {
      ...defaultState,
      ...stored,
      lessons_completed: Array.isArray(stored.lessons_completed) ? stored.lessons_completed : [],
      typing_history: Array.isArray(stored.typing_history) ? stored.typing_history : [],
      achievements: Array.isArray(stored.achievements) ? stored.achievements : [],
      mistake_table: stored.mistake_table && typeof stored.mistake_table === "object" ? stored.mistake_table : {},
      key_stats: stored.key_stats && typeof stored.key_stats === "object" ? stored.key_stats : {},
      ghost_sessions: Array.isArray(stored.ghost_sessions) ? stored.ghost_sessions : [],
      daily_counts: stored.daily_counts && typeof stored.daily_counts === "object" ? stored.daily_counts : {},
      rhythm_history: Array.isArray(stored.rhythm_history) ? stored.rhythm_history : [],
      game_history: Array.isArray(stored.game_history) ? stored.game_history : []
    };
  }

  function getState() {
    return sanitizeState(readJson(STORAGE_KEY, defaultState));
  }

  function getUiPrefs() {
    const prefs = readJson(PREFS_KEY, { highContrast: false, fontScale: 100, theme: "midnight" });
    const theme = typeof prefs.theme === "string" && prefs.theme ? prefs.theme : "midnight";
    const normalizedTheme = prefs.highContrast && theme === "midnight" ? "high-contrast" : theme;
    return {
      highContrast: normalizedTheme === "high-contrast",
      fontScale: Number(prefs.fontScale) || 100,
      theme: normalizedTheme
    };
  }

  function setUiPrefs(prefs) {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }

  function getWordsTyped(state) {
    return state.typing_history.reduce((sum, item) => sum + Number(item.words || 0), 0);
  }

  function updateStreak(state) {
    const today = todayIso();
    if (!state.last_practice_date) {
      state.daily_streak = 1;
      state.last_practice_date = today;
      return;
    }

    if (state.last_practice_date === today) return;

    const last = new Date(state.last_practice_date + "T00:00:00");
    const now = new Date(today + "T00:00:00");
    const dayDiff = Math.round((now - last) / 86400000);

    state.daily_streak = dayDiff === 1 ? state.daily_streak + 1 : 1;
    state.last_practice_date = today;
  }

  function updateAggregates(state) {
    if (!state.typing_history.length) {
      state.average_wpm = 0;
      state.accuracy = 100;
      return;
    }

    const totalWpm = state.typing_history.reduce((sum, item) => sum + Number(item.wpm || 0), 0);
    const totalAccuracy = state.typing_history.reduce((sum, item) => sum + Number(item.accuracy || 0), 0);
    state.average_wpm = Number((totalWpm / state.typing_history.length).toFixed(1));
    state.accuracy = Number((totalAccuracy / state.typing_history.length).toFixed(1));
  }

  function evaluateAchievements(state) {
    if (window.TypingSchool && window.TypingSchool.AchievementSystem) {
      const result = window.TypingSchool.AchievementSystem.evaluate(state, state.achievements);
      state.achievements = result.achievementIds;
      return result.newNames;
    }

    const fallbackCatalog = [
      { id: "first_lesson", name: "First Lesson", check: (s) => s.lessons_completed.length >= 1 },
      { id: "ten_lessons", name: "10 Lessons Completed", check: (s) => s.lessons_completed.length >= 10 },
      { id: "wpm_50", name: "50 WPM", check: (s) => s.best_wpm >= 50 },
      { id: "wpm_80", name: "80 WPM", check: (s) => s.best_wpm >= 80 },
      { id: "wpm_100", name: "100 WPM", check: (s) => s.best_wpm >= 100 },
      { id: "perfect_accuracy", name: "Perfect Accuracy", check: (s) => (s.typing_history || []).some((i) => i.accuracy >= 100 && i.chars > 20) },
      { id: "streak_7", name: "7 Day Streak", check: (s) => s.daily_streak >= 7 },
      { id: "words_1000", name: "1000 Words Typed", check: (s) => getWordsTyped(s) >= 1000 }
    ];

    const unlocked = new Set(state.achievements);
    const newNames = [];
    fallbackCatalog.forEach((item) => {
      if (!unlocked.has(item.id) && item.check(state)) {
        unlocked.add(item.id);
        newNames.push(item.name);
      }
    });
    state.achievements = Array.from(unlocked);
    return newNames;
  }

  function bumpDailyCount(state) {
    const today = todayIso();
    const current = Number(state.daily_counts[today] || 0);
    state.daily_counts[today] = current + 1;

    const keys = Object.keys(state.daily_counts).sort();
    if (keys.length > 90) {
      keys.slice(0, keys.length - 90).forEach((k) => {
        delete state.daily_counts[k];
      });
    }
  }

  function normalizeKey(key) {
    if (!key) return "";
    if (key === " ") return "space";
    if (key === "\n") return "enter";
    return String(key).toLowerCase();
  }

  function recordMistake(expectedChar) {
    if (!expectedChar) return;
    const state = getState();
    const key = normalizeKey(expectedChar);
    state.mistake_table[key] = Number(state.mistake_table[key] || 0) + 1;
    persist(state);
  }

  function updateKeyStats(typedKey, isCorrect, delayMs) {
    if (!typedKey) return;
    const state = getState();
    const key = normalizeKey(typedKey);
    const existing = state.key_stats[key] || { press_count: 0, mistake_count: 0, average_delay: 0 };

    const pressCount = Number(existing.press_count || 0) + 1;
    const mistakeCount = Number(existing.mistake_count || 0) + (isCorrect ? 0 : 1);
    const currentAvg = Number(existing.average_delay || 0);
    const nextDelay = Number(delayMs || 0);
    const averageDelay = currentAvg + (nextDelay - currentAvg) / pressCount;

    state.key_stats[key] = {
      press_count: pressCount,
      mistake_count: mistakeCount,
      average_delay: Number(averageDelay.toFixed(2))
    };

    persist(state);
  }

  function recordSession(data) {
    const state = getState();
    const session = {
      date: new Date().toISOString(),
      type: data.type || "practice",
      wpm: Number(data.wpm || 0),
      accuracy: Number(data.accuracy || 0),
      chars: Number(data.chars || 0),
      errors: Number(data.errors || 0),
      words: Number(((data.chars || 0) / 5).toFixed(1)),
      cadence: Number(data.cadence || 0),
      variability: Number(data.variability || 0),
      score: Number(data.score || 0)
    };

    state.typing_history.push(session);
    if (state.typing_history.length > MAX_HISTORY) {
      state.typing_history = state.typing_history.slice(-MAX_HISTORY);
    }

    state.best_wpm = Math.max(Number(state.best_wpm || 0), session.wpm);
    if (session.cadence > 0) {
      state.rhythm_history.push({
        date: session.date,
        cadence: session.cadence,
        variability: session.variability
      });
      if (state.rhythm_history.length > 200) {
        state.rhythm_history = state.rhythm_history.slice(-200);
      }
    }
    if (session.score > 0) {
      state.game_history.push({
        date: session.date,
        type: session.type,
        score: session.score
      });
      if (state.game_history.length > 200) {
        state.game_history = state.game_history.slice(-200);
      }
    }
    updateStreak(state);
    bumpDailyCount(state);
    updateAggregates(state);
    const newAchievements = evaluateAchievements(state);
    persist(state);
    return { state, newAchievements, session };
  }

  function completeLesson(lessonId, metrics) {
    const state = getState();
    if (!state.lessons_completed.includes(lessonId)) {
      state.lessons_completed.push(lessonId);
      persist(state);
    }
    return recordSession({ ...metrics, type: "lesson" });
  }

  function saveGhostSession(payload) {
    if (!payload || !Array.isArray(payload.replay) || !payload.replay.length) return null;
    const state = getState();
    const session = {
      id: `ghost-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      date: new Date().toISOString(),
      duration: Number(payload.duration || 0),
      wpm: Number(payload.wpm || 0),
      accuracy: Number(payload.accuracy || 0),
      text: String(payload.text || ""),
      replay: payload.replay.slice(0, 2000).map((item) => ({
        key: String(item.key || ""),
        time: Number(item.time || 0)
      }))
    };

    state.ghost_sessions.push(session);
    if (state.ghost_sessions.length > MAX_GHOST_SESSIONS) {
      state.ghost_sessions = state.ghost_sessions.slice(-MAX_GHOST_SESSIONS);
    }
    persist(state);
    return session;
  }

  function getGhostSessions() {
    return getState().ghost_sessions;
  }

  function getAchievementNames(state) {
    if (window.TypingSchool && window.TypingSchool.AchievementSystem) {
      return window.TypingSchool.AchievementSystem.namesFromIds(state.achievements);
    }

    const fallbackNames = {
      first_lesson: "First Lesson",
      ten_lessons: "10 Lessons Completed",
      wpm_50: "50 WPM",
      wpm_80: "80 WPM",
      wpm_100: "100 WPM",
      perfect_accuracy: "Perfect Accuracy",
      streak_7: "7 Day Streak",
      words_1000: "1000 Words Typed"
    };

    return (state.achievements || []).map((id) => fallbackNames[id]).filter(Boolean);
  }

  function getMistakeTable() {
    return getState().mistake_table;
  }

  function getKeyStats() {
    return getState().key_stats;
  }

  function getDailyFrequency(days = 30) {
    const state = getState();
    const results = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i -= 1) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const date = day.toISOString().slice(0, 10);
      results.push({ date, count: Number(state.daily_counts[date] || 0) });
    }

    return results;
  }

  function getWeakKeyRanking(limit = 10) {
    const keyStats = getState().key_stats;
    return Object.entries(keyStats)
      .map(([key, value]) => {
        const presses = Number(value.press_count || 0);
        const mistakes = Number(value.mistake_count || 0);
        const rate = presses > 0 ? mistakes / presses : 0;
        return { key, presses, mistakes, rate };
      })
      .filter((item) => item.presses > 5)
      .sort((a, b) => b.rate - a.rate || b.mistakes - a.mistakes)
      .slice(0, Number(limit || 10));
  }

  window.TypingSchool = window.TypingSchool || {};
  window.TypingSchool.ProgressTracker = {
    getState,
    getUiPrefs,
    setUiPrefs,
    recordSession,
    completeLesson,
    getAchievementNames,
    recordMistake,
    updateKeyStats,
    getMistakeTable,
    getKeyStats,
    saveGhostSession,
    getGhostSessions,
    getDailyFrequency,
    getWeakKeyRanking
  };
})();
