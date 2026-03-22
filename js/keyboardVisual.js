(function () {
  const FALLBACK_ROWS = [
    ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="],
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "Enter"],
    ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/", "Space"]
  ];

  function normalizeKey(char) {
    if (!char) return "";
    if (char === " ") return "space";
    if (char === "\n") return "enter";
    if (char === "Space") return "space";
    if (char === "Enter") return "enter";
    return String(char).toLowerCase();
  }

  class KeyboardVisual {
    constructor(mount, layout) {
      this.mount = mount;
      this.keyMap = new Map();
      this.recentMistakes = [];
      this.layout = layout || { rows: FALLBACK_ROWS, finger_map: {} };
      this.render();
    }

    setLayout(layout) {
      this.layout = layout || { rows: FALLBACK_ROWS, finger_map: {} };
      this.render();
    }

    render() {
      const container = document.createElement("div");
      container.className = "keyboard";
      this.keyMap.clear();

      const rows = Array.isArray(this.layout.rows) && this.layout.rows.length ? this.layout.rows : FALLBACK_ROWS;

      rows.forEach((row) => {
        const rowEl = document.createElement("div");
        rowEl.className = "kb-row";

        row.forEach((keyLabel) => {
          const key = document.createElement("div");
          key.className = "kb-key";
          key.textContent = keyLabel;
          if (keyLabel === "Enter" || keyLabel === "Space") key.classList.add("wide");
          rowEl.appendChild(key);
          this.keyMap.set(normalizeKey(keyLabel), key);
        });

        container.appendChild(rowEl);
      });

      this.mount.innerHTML = "";
      this.mount.appendChild(container);
    }

    clearClasses(className) {
      this.keyMap.forEach((el) => el.classList.remove(className));
    }

    setFingerPlacement(keys) {
      this.clearClasses("finger");
      keys.forEach((k) => {
        const keyEl = this.keyMap.get(normalizeKey(k));
        if (keyEl) keyEl.classList.add("finger");
      });
    }

    highlightRequired(char) {
      this.clearClasses("target");
      const keyEl = this.keyMap.get(normalizeKey(char));
      if (keyEl) keyEl.classList.add("target");
    }

    markMistype(char) {
      const normalized = normalizeKey(char);
      const keyEl = this.keyMap.get(normalized);
      if (!keyEl) return;

      keyEl.classList.add("mistyped");
      window.setTimeout(() => keyEl.classList.remove("mistyped"), 250);

      this.recentMistakes = [normalized].concat(this.recentMistakes.filter((k) => k !== normalized)).slice(0, 5);
      this.keyMap.forEach((el) => el.classList.remove("recent-mistake"));
      this.recentMistakes.forEach((key) => {
        const el = this.keyMap.get(key);
        if (el) el.classList.add("recent-mistake");
      });
    }

    applyHeatmap(heatmapData) {
      this.keyMap.forEach((el) => {
        el.classList.remove("heat-strong", "heat-moderate", "heat-weak");
        el.removeAttribute("title");
      });

      Object.entries(heatmapData || {}).forEach(([key, info]) => {
        const el = this.keyMap.get(normalizeKey(key));
        if (!el || !info || !info.level) return;
        if (info.level === "strong") el.classList.add("heat-strong");
        if (info.level === "moderate") el.classList.add("heat-moderate");
        if (info.level === "weak") el.classList.add("heat-weak");

        const rate = Math.round(Number(info.mistake_rate || 0) * 100);
        el.title = `Delay ${info.average_delay || 0}ms | Mistake ${rate}% | Finger ${info.finger || "-"}`;
      });
    }
  }

  window.TypingSchool = window.TypingSchool || {};
  window.TypingSchool.KeyboardVisual = KeyboardVisual;
})();
