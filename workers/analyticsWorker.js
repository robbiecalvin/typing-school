self.addEventListener("message", function (event) {
  const payload = event.data || {};

  if (payload.type === "rhythm") {
    const intervals = Array.isArray(payload.intervals) ? payload.intervals.map((v) => Number(v || 0)).filter((v) => v > 0) : [];
    if (!intervals.length) {
      self.postMessage({ requestId: payload.requestId, result: { cadence: 0, variability: 0, hesitationRate: 0, feedback: "Not enough typing data for rhythm feedback yet." } });
      return;
    }

    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const hesitationCount = intervals.filter((v) => v > avg * 1.6).length;
    const burstCount = intervals.filter((v) => v < avg * 0.55).length;

    const punctuationDelays = [];
    const keyEvents = Array.isArray(payload.keyEvents) ? payload.keyEvents : [];
    for (let i = 1; i < keyEvents.length; i += 1) {
      const prev = keyEvents[i - 1];
      const current = keyEvents[i];
      if (prev && /[.,;:!?]/.test(String(prev.key || ""))) {
        punctuationDelays.push(Number(current.delay || 0));
      }
    }

    const punctuationSlowdown = punctuationDelays.length
      ? punctuationDelays.reduce((a, b) => a + b, 0) / punctuationDelays.length > avg * 1.25
      : false;

    let feedback = "Your cadence is stable. Keep maintaining steady rhythm.";
    if (hesitationCount / intervals.length > 0.22) {
      feedback = "You show frequent hesitation. Focus on relaxed, even keystrokes.";
    } else if (burstCount / intervals.length > 0.28) {
      feedback = "You type in bursts. Try smoother pacing for consistency.";
    }

    if (punctuationSlowdown) {
      feedback += " Your typing slows significantly after punctuation.";
    }

    self.postMessage({
      requestId: payload.requestId,
      result: {
        cadence: Number((1000 / avg).toFixed(2)),
        variability: Number(stdDev.toFixed(2)),
        hesitationRate: Number((hesitationCount / intervals.length).toFixed(3)),
        feedback
      }
    });
    return;
  }

  if (payload.type === "consistency") {
    const values = Array.isArray(payload.values) ? payload.values.map((v) => Number(v || 0)) : [];
    if (!values.length) {
      self.postMessage({ requestId: payload.requestId, result: { score: 0, stdev: 0 } });
      return;
    }

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    const stdev = Math.sqrt(variance);
    const score = Math.max(0, 100 - stdev * 3.5);

    self.postMessage({ requestId: payload.requestId, result: { score: Number(score.toFixed(1)), stdev: Number(stdev.toFixed(2)) } });
  }
});
