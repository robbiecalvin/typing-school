(function () {
  const modes = {
    classic: {
      id: "classic",
      name: "Classic",
      errorLimit: Infinity,
      targetLength: 140
    },
    survival: {
      id: "survival",
      name: "Survival",
      errorLimit: 3,
      targetLength: 180
    },
    elimination: {
      id: "elimination",
      name: "Mistake Elimination",
      errorLimit: 1,
      targetLength: 120
    },
    burst: {
      id: "burst",
      name: "Speed Burst",
      errorLimit: 4,
      targetLength: 220
    },
    marathon: {
      id: "marathon",
      name: "Paragraph Marathon",
      errorLimit: 8,
      targetLength: 480
    }
  };

  function getMode(id) {
    return modes[id] || modes.classic;
  }

  function getModes() {
    return Object.values(modes);
  }

  function shouldEnd(modeId, metrics) {
    const mode = getMode(modeId);
    return Number(metrics.errors || 0) >= Number(mode.errorLimit || Infinity);
  }

  function computeScore(modeId, metrics) {
    const mode = getMode(modeId);
    const base = Number(metrics.wpm || 0) * 2 + Number(metrics.accuracy || 0);
    const errorPenalty = Number(metrics.errors || 0) * 7;
    const modeBonus = modeId === "marathon" ? 30 : modeId === "burst" ? 20 : modeId === "survival" ? 15 : 0;
    return Math.max(0, Math.round(base - errorPenalty + modeBonus));
  }

  window.TypingSchool = window.TypingSchool || {};
  window.TypingSchool.GameModes = {
    getModes,
    getMode,
    shouldEnd,
    computeScore
  };
})();
