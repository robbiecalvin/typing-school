(function () {
  class RhythmAnalyzer {
    constructor() {
      this.intervals = [];
      this.keyEvents = [];
      this.requestId = 0;
      this.pending = new Map();
      this.worker = null;

      if (typeof Worker !== "undefined") {
        try {
          this.worker = new Worker("workers/analyticsWorker.js");
          this.worker.addEventListener("message", (event) => {
            const payload = event.data || {};
            const resolver = this.pending.get(payload.requestId);
            if (!resolver) return;
            this.pending.delete(payload.requestId);
            resolver(payload.result);
          });
        } catch (_error) {
          this.worker = null;
        }
      }
    }

    reset() {
      this.intervals = [];
      this.keyEvents = [];
    }

    addKeyEvent(event) {
      if (!event) return;
      const delay = Number(event.delay || 0);
      if (delay > 0) {
        this.intervals.push(delay);
      }
      this.keyEvents.push({ key: event.key || "", delay });
      if (this.intervals.length > 4000) this.intervals = this.intervals.slice(-4000);
      if (this.keyEvents.length > 4000) this.keyEvents = this.keyEvents.slice(-4000);
    }

    async summarize() {
      if (!this.worker) {
        return {
          cadence: 0,
          variability: 0,
          hesitationRate: 0,
          feedback: "Rhythm analyzer worker unavailable."
        };
      }

      this.requestId += 1;
      const id = this.requestId;

      return new Promise((resolve) => {
        this.pending.set(id, resolve);
        this.worker.postMessage({
          type: "rhythm",
          requestId: id,
          intervals: this.intervals,
          keyEvents: this.keyEvents
        });
      });
    }
  }

  window.TypingSchool = window.TypingSchool || {};
  window.TypingSchool.RhythmAnalyzer = RhythmAnalyzer;
})();
