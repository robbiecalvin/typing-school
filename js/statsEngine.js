(function () {
  function text(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function fillAchievements(listId, state) {
    const list = document.getElementById(listId);
    if (!list) return;
    const names = window.TypingSchool.ProgressTracker.getAchievementNames(state);
    list.innerHTML = "";

    if (!names.length) {
      const li = document.createElement("li");
      li.className = "achievement-item";
      li.textContent = "No achievements unlocked yet.";
      list.appendChild(li);
      return;
    }

    names.slice(-10).reverse().forEach((name) => {
      const li = document.createElement("li");
      li.className = "achievement-item";
      li.textContent = name;
      list.appendChild(li);
    });
  }

  function fillWeakKeys(listId, weakKeys) {
    const list = document.getElementById(listId);
    if (!list) return;
    list.innerHTML = "";

    if (!weakKeys.length) {
      const li = document.createElement("li");
      li.className = "achievement-item";
      li.textContent = "Weak key ranking will appear after more sessions.";
      list.appendChild(li);
      return;
    }

    weakKeys.forEach((item) => {
      const li = document.createElement("li");
      li.className = "achievement-item";
      li.textContent = `${item.key}: ${Math.round(item.rate * 100)}% mistakes (${item.mistakes}/${item.presses})`;
      list.appendChild(li);
    });
  }

  function fillMessages(listId, messages, emptyText) {
    const list = document.getElementById(listId);
    if (!list) return;
    list.innerHTML = "";

    if (!messages.length) {
      const li = document.createElement("li");
      li.className = "achievement-item";
      li.textContent = emptyText;
      list.appendChild(li);
      return;
    }

    messages.forEach((message) => {
      const li = document.createElement("li");
      li.className = "achievement-item";
      li.textContent = message;
      list.appendChild(li);
    });
  }

  function getWordsTyped(state) {
    return (state.typing_history || []).reduce((sum, item) => sum + Number(item.words || 0), 0);
  }

  function setHomeMission(state, weakKeys) {
    const title = document.getElementById("homeMissionTitle");
    const text = document.getElementById("homeMissionText");
    const recentForm = document.getElementById("homeRecentForm");
    const ghostStatus = document.getElementById("homeGhostStatus");
    const ghostCount = document.getElementById("homeGhostCount");
    const history = Array.isArray(state.typing_history) ? state.typing_history : [];
    const ghosts = window.TypingSchool.ProgressTracker.getGhostSessions();
    const latest = history.length ? history[history.length - 1] : null;
    const recent = history.slice(-5);
    const recentAverage = recent.length
      ? recent.reduce((sum, item) => sum + Number(item.wpm || 0), 0) / recent.length
      : 0;

    if (ghostCount) ghostCount.textContent = String(ghosts.length);

    if (recentForm) {
      if (!recent.length) recentForm.textContent = "Waiting";
      else if (recentAverage >= 80) recentForm.textContent = "Flying";
      else if (recentAverage >= 50) recentForm.textContent = "Climbing";
      else recentForm.textContent = "Building";
    }

    if (ghostStatus) {
      ghostStatus.textContent = ghosts.length
        ? `${ghosts.length} ghost replay${ghosts.length === 1 ? "" : "s"} ready for race mode.`
        : "Finish a speed test to unlock ghost racing and replay analysis.";
    }

    if (!title || !text) return;

    if (!history.length) {
      title.textContent = "Build a first typing streak.";
      text.textContent = "Complete a few clean sessions to unlock personalized coaching.";
      return;
    }

    if (weakKeys.length) {
      const focus = weakKeys.slice(0, 2).map((item) => item.key.toUpperCase()).join(" + ");
      title.textContent = `Repair ${focus} under pressure.`;
      text.textContent = `Your highest-friction keys are creating the most drag. Run an adaptive or finger drill, then retest pace against your latest ghost.`;
      return;
    }

    if (latest && Number(latest.accuracy || 0) < 96) {
      title.textContent = "Clean up accuracy before pushing speed.";
      text.textContent = `Your last recorded session landed at ${latest.accuracy}% accuracy. A short controlled run will improve consistency faster than another sprint.`;
      return;
    }

    title.textContent = "Convert consistency into a new personal best.";
    text.textContent = "Your core metrics are stable enough to push harder. Run a timed test and bank a stronger ghost for race mode.";
  }

  async function renderTier(state) {
    if (!window.TypingSchool.SkillRanking) return;
    const ranking = new window.TypingSchool.SkillRanking();
    const result = await ranking.calculate(state);

    text("homeTier", result.tier || "Beginner");
    text("dashTier", result.tier || "Beginner");
    text("dashConsistency", `${Math.round(result.consistency || 0)}%`);
  }

  function renderHome() {
    const state = window.TypingSchool.ProgressTracker.getState();
    const weakKeys = window.TypingSchool.ProgressTracker.getWeakKeyRanking(5);
    const wordsTyped = Math.round(getWordsTyped(state));
    text("homeBestWpm", String(state.best_wpm || 0));
    text("homeAccuracy", `${state.accuracy || 0}%`);
    text("homeStreak", `${state.daily_streak || 0} days`);
    text("homeLessonsDone", String((state.lessons_completed || []).length));
    text("homeWordsTyped", String(wordsTyped));
    text("homeSessionCount", String((state.typing_history || []).length));
    fillAchievements("homeAchievements", state);
    fillWeakKeys("homeWeakKeys", weakKeys);
    setHomeMission(state, weakKeys);
    renderTier(state);
  }

  async function renderDashboard() {
    const state = window.TypingSchool.ProgressTracker.getState();
    const ghostCount = window.TypingSchool.ProgressTracker.getGhostSessions().length;
    const weakKeys = window.TypingSchool.ProgressTracker.getWeakKeyRanking(8);
    const wordsTyped = Math.round(getWordsTyped(state));
    const history = (state.typing_history || []).slice(-60);
    const recent = history.slice(-5);
    const wpmValues = history.map((item) => Number(item.wpm || 0));
    const accuracyValues = history.map((item) => Number(item.accuracy || 0));
    const daily = window.TypingSchool.ProgressTracker.getDailyFrequency(30);
    const frequencyValues = daily.map((item) => Number(item.count || 0));
    const recentAverage = recent.length
      ? recent.reduce((sum, item) => sum + Number(item.wpm || 0), 0) / recent.length
      : 0;
    const recentAccuracy = recent.length
      ? recent.reduce((sum, item) => sum + Number(item.accuracy || 0), 0) / recent.length
      : 0;

    text("dashBestWpm", String(state.best_wpm || 0));
    text("dashAverageWpm", String(state.average_wpm || 0));
    text("dashAccuracy", `${state.accuracy || 0}%`);
    text("dashLessons", String((state.lessons_completed || []).length));
    text("dashStreak", `${state.daily_streak || 0} days`);
    text("dashWordsTyped", String(wordsTyped));
    text("dashSessionCount", String(history.length));
    text("dashGhostCount", String(ghostCount));
    fillAchievements("dashAchievements", state);
    fillWeakKeys("dashWeakKeys", weakKeys);

    const speedDistribution = [0, 0, 0, 0, 0];
    wpmValues.forEach((value) => {
      if (value < 30) speedDistribution[0] += 1;
      else if (value < 50) speedDistribution[1] += 1;
      else if (value < 70) speedDistribution[2] += 1;
      else if (value < 90) speedDistribution[3] += 1;
      else speedDistribution[4] += 1;
    });

    const streakGraph = daily.reduce((acc, item) => {
      const prev = acc.length ? acc[acc.length - 1] : 0;
      if (item.count > 0) acc.push(prev + 1);
      else acc.push(0);
      return acc;
    }, []);

    const bestZoneLabels = ["0-30 WPM", "30-50 WPM", "50-70 WPM", "70-90 WPM", "90+ WPM"];
    const bestZoneIndex = speedDistribution.reduce((bestIdx, value, idx, arr) => value > arr[bestIdx] ? idx : bestIdx, 0);
    const leakMessages = [];

    if (!history.length) {
      text("dashHeroTitle", "Build enough data to coach your speed.");
      text("dashHeroText", "Run a few sessions and this screen will start telling you where your speed is leaking and what to fix next.");
      text("dashPriorityTitle", "Start collecting signal.");
      text("dashPriorityText", "A few focused sessions are enough to reveal where accuracy and rhythm break down.");
      text("dashRecentForm", "Waiting");
      text("dashBestZone", "0-30 WPM");
      text("dashRecentGain", "0 recent sessions");
      fillMessages("dashLeakList", [], "Leaks will appear after more sessions.");
    } else {
      const latest = history[history.length - 1];
      const latestAccuracy = Number(latest.accuracy || 0);
      const previousWindow = history.slice(-10, -5);
      const previousAverage = previousWindow.length
        ? previousWindow.reduce((sum, item) => sum + Number(item.wpm || 0), 0) / previousWindow.length
        : recentAverage;
      const recentGain = recent.length ? recent.length : 0;

      text("dashRecentGain", `${recentGain} recent sessions`);
      text("dashBestZone", bestZoneLabels[bestZoneIndex] || "0-30 WPM");

      if (recentAverage >= 80) text("dashRecentForm", "Flying");
      else if (recentAverage >= 55) text("dashRecentForm", "Climbing");
      else if (recentAverage >= 35) text("dashRecentForm", "Building");
      else text("dashRecentForm", "Foundational");

      if (weakKeys.length) {
        const focus = weakKeys.slice(0, 2).map((item) => item.key.toUpperCase()).join(" + ");
        text("dashHeroTitle", `Your biggest drag right now is ${focus}.`);
        text("dashHeroText", "Your charts are useful, but the highest-value improvement is fixing repeated key-level friction before forcing more speed.");
        text("dashPriorityTitle", `Repair ${focus} before your next sprint.`);
        text("dashPriorityText", "Adaptive work or finger drills will return more speed than another raw race attempt right now.");
        leakMessages.push(`Weakest keys: ${focus} are carrying the highest mistake rate.`);
      } else if (recentAccuracy < 96) {
        text("dashHeroTitle", "Accuracy is capping your speed ceiling.");
        text("dashHeroText", "You have enough pace to climb, but accuracy instability is likely preventing that speed from sticking.");
        text("dashPriorityTitle", "Trade a little speed for cleaner reps.");
        text("dashPriorityText", "One accuracy-focused block should improve the next set of speed tests more than another max-effort sprint.");
        leakMessages.push(`Recent accuracy is averaging ${Math.round(recentAccuracy)}%, which is below a clean push threshold.`);
      } else {
        text("dashHeroTitle", "Your base is stable enough to push for a new best.");
        text("dashHeroText", "The recent sessions show enough control to shift from repair work into harder timed runs.");
        text("dashPriorityTitle", "Convert consistency into a race win.");
        text("dashPriorityText", "Load a ghost and pressure-test your current form over a benchmark run.");
      }

      if (recentAverage > previousAverage + 5) leakMessages.push(`Momentum is improving: recent WPM is up by ${Math.round(recentAverage - previousAverage)} over the prior block.`);
      else if (recentAverage < previousAverage - 5) leakMessages.push("Recent speed has cooled off. Short focused blocks may be more productive than longer tests.");

      if (latestAccuracy < 95) leakMessages.push(`Latest session accuracy dipped to ${latestAccuracy}%, so control likely broke before pace.`);
      if (state.daily_streak < 3) leakMessages.push("Consistency is thin. A stronger daily streak will make the gains less volatile.");
      if (ghostCount === 0) leakMessages.push("You have no ghosts saved yet. Banking a benchmark run will make speed gains easier to measure.");
      if (!leakMessages.length) leakMessages.push(`Recent form is stable around ${Math.round(recentAverage)} WPM. You can likely push a harder speed test next.`);
      fillMessages("dashLeakList", leakMessages, "Leaks will appear after more sessions.");
    }

    const renderer = window.TypingSchool.ChartRenderer;
    if (!renderer) return;

    renderer.drawLineChart(document.getElementById("wpmChart"), wpmValues, {
      color: "#4cc9f0",
      yFormatter: (v) => `${Math.round(v)} WPM`
    });

    renderer.drawLineChart(document.getElementById("accuracyChart"), accuracyValues, {
      color: "#2aa889",
      yFormatter: (v) => `${Math.round(v)}%`
    });

    renderer.drawBarChart(document.getElementById("frequencyChart"), frequencyValues, {
      color: "#ffd166"
    });

    renderer.drawBarChart(document.getElementById("distributionChart"), speedDistribution, {
      color: "#ff9f1c"
    });

    renderer.drawLineChart(document.getElementById("streakGraph"), streakGraph, {
      color: "#9d8df1",
      yFormatter: (v) => `${Math.round(v)}d`
    });

    renderTier(state);
  }

  window.TypingSchool = window.TypingSchool || {};
  window.TypingSchool.StatsEngine = {
    renderHome,
    renderDashboard
  };
})();
