(function () {
  class SkillRanking {
    constructor() {
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

    getTier(score) {
      if (score >= 90) return "Master";
      if (score >= 78) return "Expert";
      if (score >= 64) return "Advanced";
      if (score >= 48) return "Intermediate";
      return "Beginner";
    }

    async calculate(state) {
      const history = (state && state.typing_history) || [];
      const values = history.slice(-40).map((item) => Number(item.wpm || 0));
      const averageWpm = Number(state.average_wpm || 0);
      const accuracy = Number(state.accuracy || 0);

      let consistencyScore = 50;
      if (this.worker) {
        this.requestId += 1;
        const id = this.requestId;
        consistencyScore = await new Promise((resolve) => {
          this.pending.set(id, (result) => resolve(Number((result && result.score) || 0)));
          this.worker.postMessage({ type: "consistency", requestId: id, values });
        });
      }

      const rawScore = averageWpm * 0.62 + accuracy * 0.26 + consistencyScore * 0.12;
      const score = Number(Math.max(0, Math.min(100, rawScore)).toFixed(1));
      return {
        score,
        tier: this.getTier(score),
        consistency: consistencyScore
      };
    }
  }

  window.TypingSchool = window.TypingSchool || {};
  window.TypingSchool.SkillRanking = SkillRanking;
})();
