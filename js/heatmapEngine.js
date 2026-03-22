(function () {
  function classify(mistakeRate, averageDelay) {
    let score = 1 - mistakeRate;
    if (averageDelay > 0) {
      const delayPenalty = Math.min(0.4, Math.max(0, (averageDelay - 120) / 900));
      score -= delayPenalty;
    }
    if (score >= 0.8) return "strong";
    if (score >= 0.55) return "moderate";
    return "weak";
  }

  function mapHeatmap(keyStats, layout) {
    const map = {};
    const fingerMap = (layout && layout.finger_map) || {};

    Object.entries(keyStats || {}).forEach(([key, stat]) => {
      const presses = Number(stat.press_count || 0);
      const mistakes = Number(stat.mistake_count || 0);
      const averageDelay = Number(stat.average_delay || 0);
      const mistakeRate = presses > 0 ? mistakes / presses : 0;
      const finger = fingerMap[String(key).toLowerCase()] || "unassigned";
      const fingerEfficiency = Math.max(0, 100 - mistakeRate * 100 - Math.max(0, (averageDelay - 140) / 8));

      map[key] = {
        press_count: presses,
        mistake_count: mistakes,
        average_delay: averageDelay,
        mistake_rate: Number(mistakeRate.toFixed(3)),
        finger,
        finger_efficiency: Number(fingerEfficiency.toFixed(1)),
        level: classify(mistakeRate, averageDelay)
      };
    });

    return map;
  }

  window.TypingSchool = window.TypingSchool || {};
  window.TypingSchool.HeatmapEngine = {
    mapHeatmap
  };
})();
