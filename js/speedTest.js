(function () {
  const fallbackQuotes = [
    "Accuracy creates speed. Speed without accuracy creates noise.",
    "Consistent daily effort beats occasional heroic sessions.",
    "Keep your eyes ahead of the cursor and trust your fingers.",
    "Precision first, pace second, endurance third."
  ];

  async function loadQuotes() {
    try {
      const response = await fetch("data/quotes.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load quotes");
      const data = await response.json();
      return Array.isArray(data) ? data : fallbackQuotes;
    } catch (_error) {
      return fallbackQuotes;
    }
  }

  function pickLongText(quotes, minLength) {
    let text = "";
    while (text.length < minLength) {
      text += (text ? " " : "") + quotes[Math.floor(Math.random() * quotes.length)];
    }
    return text;
  }

  class SpeedTest {
    constructor(config) {
      this.mount = config.mount;
      this.feedback = config.feedback;
      this.timerEl = config.timerEl;
      this.durationButtons = config.durationButtons;
      this.startBtn = config.startBtn;
      this.resetBtn = config.resetBtn;
      this.updateMetrics = config.updateMetrics;
      this.onRaceUpdate = config.onRaceUpdate || function () {};
      this.onFinished = config.onFinished || function () {};
      this.onGhostSaved = config.onGhostSaved || function () {};
      this.onKeyEvent = config.onKeyEvent || function () {};
      this.onStart = config.onStart || function () {};
      this.onPrepared = config.onPrepared || function () {};

      this.duration = 15;
      this.remaining = 15;
      this.timerId = null;
      this.raceTimerId = null;
      this.engine = null;
      this.quotes = fallbackQuotes;
      this.running = false;
      this.recorder = null;
      this.ghostSession = null;
      this.raceEnabled = false;
      this.currentText = "";
    }

    async init() {
      this.quotes = await loadQuotes();
      this.setDuration(this.duration);
      this.bindEvents();
      this.prepareEngine();
    }

    bindEvents() {
      this.durationButtons.forEach((button) => {
        button.addEventListener("click", () => {
          if (this.running) return;
          this.durationButtons.forEach((b) => b.classList.remove("active"));
          button.classList.add("active");
          this.setDuration(Number(button.dataset.duration));
          this.prepareEngine();
        });
      });

      this.startBtn.addEventListener("click", () => this.start());
      this.resetBtn.addEventListener("click", () => this.reset());
    }

    setGhostForRace(session) {
      this.ghostSession = session || null;
      this.raceEnabled = Boolean(this.ghostSession);
      if (!this.running) {
        this.prepareEngine();
      }
    }

    setDuration(seconds) {
      this.duration = seconds;
      this.remaining = seconds;
      this.timerEl.textContent = String(seconds);
    }

    prepareEngine() {
      if (this.engine) {
        this.engine.stop();
      }

      if (this.raceEnabled && this.ghostSession && this.ghostSession.text) {
        this.currentText = this.ghostSession.text;
      } else {
        this.currentText = pickLongText(this.quotes, Math.max(450, this.duration * 12));
      }

      this.engine = new window.TypingSchool.TypingEngine({
        mount: this.mount,
        targetText: this.currentText,
        onUpdate: (metrics) => {
          this.updateMetrics(metrics);
        },
        onKeyEvent: (result, nextExpected, meta) => {
          if (this.recorder) {
            this.recorder.push(result.typed, meta.time);
          }
          window.TypingSchool.ProgressTracker.updateKeyStats(result.typed, result.isCorrect, meta.delay);
          if (!result.isCorrect) {
            window.TypingSchool.ProgressTracker.recordMistake(result.expected);
          }
          this.onRaceUpdate({
            userProgress: meta.progress,
            ghostProgress: this.getGhostProgress(meta.time)
          });
          this.onKeyEvent(result, nextExpected, meta);
        },
        onComplete: () => {
          if (this.running) this.finish();
        }
      });

      this.engine.render();
      this.updateMetrics(this.engine.getMetrics());
      this.feedback.textContent = "";
      this.onRaceUpdate({ userProgress: 0, ghostProgress: 0 });
      this.onPrepared(this.engine.getExpectedChar());
    }

    getGhostProgress(elapsedMs) {
      if (!this.raceEnabled || !this.ghostSession || !window.TypingSchool.GhostReplay) return 0;
      return window.TypingSchool.GhostReplay.progressAtTime(this.ghostSession.replay, elapsedMs);
    }

    startRaceTicker() {
      window.clearInterval(this.raceTimerId);
      this.raceTimerId = window.setInterval(() => {
        const elapsedMs = Math.max(0, (this.duration - this.remaining) * 1000);
        this.onRaceUpdate({
          userProgress: this.engine ? this.engine.getProgress() : 0,
          ghostProgress: this.getGhostProgress(elapsedMs)
        });
      }, 120);
    }

    start() {
      if (!this.engine || this.running) return;
      this.running = true;
      this.onStart();
      this.feedback.textContent = this.raceEnabled ? "Race started..." : "Test in progress...";
      this.recorder = window.TypingSchool.GhostReplay ? window.TypingSchool.GhostReplay.createRecorder() : null;
      this.engine.start();
      this.startRaceTicker();

      this.timerId = window.setInterval(() => {
        this.remaining -= 1;
        this.timerEl.textContent = String(Math.max(0, this.remaining));
        if (this.remaining <= 0) {
          this.finish();
        }
      }, 1000);
    }

    finish() {
      if (!this.running) return;
      this.running = false;
      window.clearInterval(this.timerId);
      window.clearInterval(this.raceTimerId);
      this.timerId = null;
      this.raceTimerId = null;
      this.engine.stop();
      this.timerEl.textContent = "0";

      const metrics = this.engine.getMetrics();
      const previousState = window.TypingSchool.ProgressTracker.getState();
      const previousBestWpm = Number(previousState.best_wpm || 0);
      const result = window.TypingSchool.ProgressTracker.recordSession({
        type: this.raceEnabled ? "race" : "speedtest",
        ...metrics
      });

      let ghostSaved = null;
      if (this.recorder && !this.recorder.isEmpty()) {
        ghostSaved = window.TypingSchool.ProgressTracker.saveGhostSession({
          duration: this.duration,
          wpm: metrics.wpm,
          accuracy: metrics.accuracy,
          text: this.currentText,
          replay: this.recorder.export()
        });
      }

      const unlocked = result.newAchievements.length ? ` New achievements: ${result.newAchievements.join(", ")}.` : "";
      this.feedback.textContent = `Finished. ${metrics.wpm} WPM, ${metrics.accuracy}% accuracy, ${metrics.chars} chars, ${metrics.errors} errors.${unlocked}`;

      this.onFinished({
        metrics,
        raceEnabled: this.raceEnabled,
        ghostSaved,
        result,
        previousBestWpm,
        isNewBest: metrics.wpm > previousBestWpm
      });
      if (ghostSaved) this.onGhostSaved(ghostSaved);
    }

    reset() {
      window.clearInterval(this.timerId);
      window.clearInterval(this.raceTimerId);
      this.timerId = null;
      this.raceTimerId = null;
      this.running = false;
      this.setDuration(this.duration);
      this.prepareEngine();
      this.feedback.textContent = "Test reset.";
    }
  }

  window.TypingSchool = window.TypingSchool || {};
  window.TypingSchool.SpeedTest = SpeedTest;
})();
