self.addEventListener("message", function (event) {
  const payload = event.data || {};
  if (payload.type !== "computeMetrics") return;

  const states = Array.isArray(payload.states) ? payload.states : [];
  const index = Number(payload.index || 0);
  const startedAt = Number(payload.startedAt || 0);
  const endedAt = Number(payload.endedAt || 0);
  const active = Boolean(payload.active);
  const now = Number(payload.now || Date.now());

  let typedCount = 0;
  let correctCount = 0;
  for (let i = 0; i < index; i += 1) {
    if (states[i] !== null) typedCount += 1;
    if (states[i] === true) correctCount += 1;
  }

  const errors = typedCount - correctCount;
  const end = active ? now : endedAt || now;
  const elapsedMs = startedAt ? Math.max(1, end - startedAt) : 0;
  const minutes = elapsedMs / 60000;
  const wpm = minutes > 0 ? (typedCount / 5) / minutes : 0;
  const accuracy = typedCount > 0 ? (correctCount / typedCount) * 100 : 100;

  self.postMessage({
    requestId: payload.requestId,
    metrics: {
      chars: typedCount,
      errors,
      elapsed: elapsedMs / 1000,
      wpm: Number(wpm.toFixed(1)),
      accuracy: Number(accuracy.toFixed(1))
    }
  });
});
