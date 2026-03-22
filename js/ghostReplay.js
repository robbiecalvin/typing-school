(function () {
  function createRecorder() {
    const startedAt = Date.now();
    const entries = [];

    return {
      push: function (key, timeOverride) {
        const time = typeof timeOverride === "number" ? timeOverride : Date.now() - startedAt;
        entries.push({ key: String(key || ""), time: Number(time) });
      },
      export: function () {
        return entries.slice();
      },
      isEmpty: function () {
        return entries.length === 0;
      }
    };
  }

  function progressAtTime(replay, elapsedMs) {
    if (!Array.isArray(replay) || !replay.length) return 0;
    let count = 0;
    for (let i = 0; i < replay.length; i += 1) {
      if (Number(replay[i].time || 0) <= elapsedMs) count += 1;
      else break;
    }
    return Math.min(1, count / replay.length);
  }

  function createPlayer(container, text, replay, options) {
    if (!container) return null;
    const chars = String(text || "").split("");
    const events = Array.isArray(replay) ? replay : [];
    const speed = { value: 1 };
    let pointer = 0;
    let elapsed = 0;
    let playing = false;
    let rafId = null;
    let lastTick = 0;

    container.innerHTML = "";
    const spans = chars.map((char) => {
      const el = document.createElement("span");
      el.className = "char";
      el.textContent = char === " " ? "\u00A0" : char;
      container.appendChild(el);
      return el;
    });

    function renderAtProgress(progress) {
      const targetCount = Math.round(Math.max(0, Math.min(1, progress)) * spans.length);
      spans.forEach((span, idx) => {
        span.classList.toggle("correct", idx < targetCount);
      });
    }

    function updateByElapsed() {
      while (pointer < events.length && Number(events[pointer].time || 0) <= elapsed) {
        pointer += 1;
      }
      const progress = spans.length ? pointer / spans.length : 0;
      renderAtProgress(progress);
      if (options && options.onProgress) options.onProgress(progress);
    }

    function tick(ts) {
      if (!playing) return;
      if (!lastTick) lastTick = ts;
      const delta = ts - lastTick;
      lastTick = ts;
      elapsed += delta * speed.value;
      updateByElapsed();

      const maxTime = events.length ? Number(events[events.length - 1].time || 0) : 0;
      if (elapsed >= maxTime) {
        playing = false;
        if (options && options.onPause) options.onPause();
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    }

    function play() {
      if (playing) return;
      playing = true;
      lastTick = 0;
      rafId = window.requestAnimationFrame(tick);
    }

    function pause() {
      playing = false;
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = null;
      if (options && options.onPause) options.onPause();
    }

    function seek(progress) {
      const clamped = Math.max(0, Math.min(1, progress));
      const maxTime = events.length ? Number(events[events.length - 1].time || 0) : 0;
      elapsed = maxTime * clamped;
      pointer = 0;
      updateByElapsed();
    }

    function setSpeed(nextSpeed) {
      speed.value = Math.max(0.25, Math.min(3, Number(nextSpeed || 1)));
    }

    return { play, pause, seek, setSpeed, renderAtProgress: seek };
  }

  function play(container, text, replay) {
    const player = createPlayer(container, text, replay);
    if (player) player.play();
    return player;
  }

  window.TypingSchool = window.TypingSchool || {};
  window.TypingSchool.GhostReplay = {
    createRecorder,
    progressAtTime,
    createPlayer,
    play
  };
})();
