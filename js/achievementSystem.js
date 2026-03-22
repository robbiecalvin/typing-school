(function () {
  const catalog = [
    { id: "first_lesson", name: "First Lesson", check: (s) => (s.lessons_completed || []).length >= 1 },
    { id: "ten_lessons", name: "10 Lessons Completed", check: (s) => (s.lessons_completed || []).length >= 10 },
    { id: "wpm_50", name: "50 WPM", check: (s) => Number(s.best_wpm || 0) >= 50 },
    { id: "wpm_80", name: "80 WPM", check: (s) => Number(s.best_wpm || 0) >= 80 },
    { id: "wpm_100", name: "100 WPM", check: (s) => Number(s.best_wpm || 0) >= 100 },
    {
      id: "perfect_accuracy",
      name: "Perfect Accuracy",
      check: (s) => (s.typing_history || []).some((item) => Number(item.accuracy || 0) >= 100 && Number(item.chars || 0) > 20)
    },
    { id: "streak_7", name: "7 Day Streak", check: (s) => Number(s.daily_streak || 0) >= 7 },
    {
      id: "words_1000",
      name: "1000 Words Typed",
      check: (s) => (s.typing_history || []).reduce((sum, item) => sum + Number(item.words || 0), 0) >= 1000
    }
  ];

  function getCatalog() {
    return catalog.slice();
  }

  function evaluate(state, existingAchievementIds) {
    const unlocked = new Set(Array.isArray(existingAchievementIds) ? existingAchievementIds : []);
    const newlyUnlocked = [];

    catalog.forEach((achievement) => {
      if (!unlocked.has(achievement.id) && achievement.check(state)) {
        unlocked.add(achievement.id);
        newlyUnlocked.push(achievement.name);
      }
    });

    return {
      achievementIds: Array.from(unlocked),
      newNames: newlyUnlocked
    };
  }

  function namesFromIds(ids) {
    const idSet = new Set(Array.isArray(ids) ? ids : []);
    return catalog.filter((item) => idSet.has(item.id)).map((item) => item.name);
  }

  window.TypingSchool = window.TypingSchool || {};
  window.TypingSchool.AchievementSystem = {
    getCatalog,
    evaluate,
    namesFromIds
  };
})();
