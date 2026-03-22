(function () {
  function normalizeInputKey(key) {
    if (key === "Enter") return "\n";
    if (key === "Tab") return "\t";
    return key;
  }

  class TypingEngine {
    constructor(config) {
      this.mount = config.mount;
      this.targetText = config.targetText || "";
      this.charClasses = Array.isArray(config.charClasses) ? config.charClasses : [];
      this.onUpdate = config.onUpdate || function () {};
      this.onComplete = config.onComplete || function () {};
      this.onKeyEvent = config.onKeyEvent || function () {};
      this.active = false;
      this.index = 0;
      this.startedAt = 0;
      this.endedAt = 0;
      this.states = [];
      this.lastResult = null;
      this.lastKeyAt = 0;
      this.latestMetrics = { chars: 0, errors: 0, elapsed: 0, wpm: 0, accuracy: 100 };
      this.metricRequestId = 0;
      this.pendingComplete = false;
      this.boundHandleKeydown = this.handleKeydown.bind(this);
      this.initWorker();
      this.states = new Array(this.targetText.length).fill(null);
    }

    initWorker() {
      this.worker = null;
      if (typeof Worker === "undefined") return;
      try {
        this.worker = new Worker("workers/typingWorker.js");
        this.worker.addEventListener("message", (event) => {
          const payload = event.data || {};
          if (typeof payload.requestId !== "number" || payload.requestId !== this.metricRequestId) return;
          if (!payload.metrics) return;

          this.latestMetrics = payload.metrics;
          this.onUpdate(this.latestMetrics);

          if (this.pendingComplete) {
            this.pendingComplete = false;
            this.onComplete(this.latestMetrics);
          }
        });
      } catch (_error) {
        this.worker = null;
      }
    }

    computeMetricsSync() {
      const typedCount = this.states.slice(0, this.index).filter((v) => v !== null).length;
      const correctCount = this.states.slice(0, this.index).filter(Boolean).length;
      const errors = typedCount - correctCount;
      const end = this.active ? Date.now() : this.endedAt || Date.now();
      const elapsedMs = this.startedAt ? Math.max(1, end - this.startedAt) : 0;
      const minutes = elapsedMs / 60000;
      const wpm = minutes > 0 ? (typedCount / 5) / minutes : 0;
      const accuracy = typedCount > 0 ? (correctCount / typedCount) * 100 : 100;

      return {
        chars: typedCount,
        errors,
        elapsed: elapsedMs / 1000,
        wpm: Number(wpm.toFixed(1)),
        accuracy: Number(accuracy.toFixed(1))
      };
    }

    requestMetrics() {
      if (this.worker) {
        this.metricRequestId += 1;
        this.worker.postMessage({
          type: "computeMetrics",
          requestId: this.metricRequestId,
          states: this.states,
          index: this.index,
          startedAt: this.startedAt,
          endedAt: this.endedAt,
          active: this.active,
          now: Date.now()
        });
        return;
      }

      this.latestMetrics = this.computeMetricsSync();
      this.onUpdate(this.latestMetrics);
      if (this.pendingComplete) {
        this.pendingComplete = false;
        this.onComplete(this.latestMetrics);
      }
    }

    setTarget(targetText, charClasses) {
      this.targetText = targetText || "";
      this.charClasses = Array.isArray(charClasses) ? charClasses : [];
      this.reset(false);
    }

    start() {
      if (!this.targetText || this.active) return;
      this.active = true;
      if (!this.startedAt) {
        const now = Date.now();
        this.startedAt = now;
        this.lastKeyAt = now;
      }
      document.addEventListener("keydown", this.boundHandleKeydown);
      this.mount.focus();
      this.render();
      this.requestMetrics();
    }

    stop() {
      this.active = false;
      this.endedAt = Date.now();
      document.removeEventListener("keydown", this.boundHandleKeydown);
      this.requestMetrics();
    }

    reset(clearText = false) {
      this.stop();
      this.index = 0;
      this.startedAt = 0;
      this.endedAt = 0;
      this.lastKeyAt = 0;
      this.states = new Array(this.targetText.length).fill(null);
      this.lastResult = null;
      this.latestMetrics = { chars: 0, errors: 0, elapsed: 0, wpm: 0, accuracy: 100 };
      if (clearText) {
        this.targetText = "";
        this.charClasses = [];
      }
      this.render();
      this.onUpdate(this.latestMetrics);
    }

    getExpectedChar() {
      return this.targetText[this.index] || "";
    }

    getMetrics() {
      return this.latestMetrics;
    }

    getProgress() {
      if (!this.targetText.length) return 0;
      return Math.min(1, this.index / this.targetText.length);
    }

    handleKeydown(event) {
      if (!this.active) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (event.key === "Backspace") {
        event.preventDefault();
        if (this.index > 0) {
          this.index -= 1;
          this.states[this.index] = null;
          this.lastResult = null;
          this.render();
          this.requestMetrics();
        }
        return;
      }

      const key = normalizeInputKey(event.key);
      if ((typeof key !== "string") || (key.length !== 1 && key !== "\n" && key !== "\t")) {
        return;
      }

      event.preventDefault();
      if (this.index >= this.targetText.length) return;

      const now = Date.now();
      const expected = this.targetText[this.index];
      const isCorrect = key === expected;
      const delay = this.lastKeyAt ? now - this.lastKeyAt : 0;

      this.states[this.index] = isCorrect;
      this.index += 1;
      this.lastResult = { typed: key, expected, isCorrect };
      this.lastKeyAt = now;

      this.onKeyEvent(this.lastResult, this.getExpectedChar(), {
        time: this.startedAt ? now - this.startedAt : 0,
        delay,
        index: this.index,
        progress: this.getProgress()
      });

      this.render();

      if (this.index >= this.targetText.length) {
        this.stop();
        this.pendingComplete = true;
      }

      this.requestMetrics();
    }

    render() {
      const frag = document.createDocumentFragment();

      for (let i = 0; i < this.targetText.length; i += 1) {
        const span = document.createElement("span");
        span.className = "char";

        if (this.charClasses[i]) {
          span.classList.add(this.charClasses[i]);
        }

        span.textContent = this.targetText[i];

        if (this.states[i] === true) span.classList.add("correct");
        if (this.states[i] === false) span.classList.add("incorrect");
        if (i === this.index && this.active) span.classList.add("current");

        frag.appendChild(span);
      }

      this.mount.innerHTML = "";
      this.mount.appendChild(frag);
    }
  }

  window.TypingSchool = window.TypingSchool || {};
  window.TypingSchool.TypingEngine = TypingEngine;
})();
