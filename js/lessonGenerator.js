(function () {
  function normalizeMistakes(mistakes) {
    return Object.entries(mistakes || {})
      .filter(([, count]) => Number(count) > 0)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .map(([key]) => (key === "space" ? " " : key === "enter" ? "\n" : key));
  }

  function buildWord(chars, minLen, maxLen) {
    const len = Math.max(minLen, Math.min(maxLen, minLen + Math.floor(Math.random() * (maxLen - minLen + 1))));
    let output = "";
    for (let i = 0; i < len; i += 1) {
      output += chars[Math.floor(Math.random() * chars.length)];
    }
    return output;
  }

  function generateAdaptiveLesson(input) {
    const mistakes = input && input.mistakes ? input.mistakes : {};
    const weakKeys = Array.isArray(input && input.weakKeys) ? input.weakKeys : [];
    const wpm = Number((input && input.wpm) || 0);

    const inferredWeak = normalizeMistakes(mistakes).slice(0, 8);
    const emphasis = weakKeys.length ? weakKeys : inferredWeak;
    const focusChars = emphasis.length ? emphasis.map((k) => (k === "space" ? " " : k)).filter((v) => v !== "\n") : ["a", "s", "d", "f", "j", "k", "l", ";"];

    const complexity = wpm < 35 ? "easy" : wpm < 65 ? "medium" : "hard";
    const wordCount = complexity === "easy" ? 22 : complexity === "medium" ? 30 : 38;

    const words = [];
    for (let i = 0; i < wordCount; i += 1) {
      const base = buildWord(focusChars, complexity === "easy" ? 3 : 4, complexity === "hard" ? 8 : 6);
      if (i % 7 === 0) {
        words.push(base + ",");
      } else if (i % 11 === 0) {
        words.push(base + ".");
      } else {
        words.push(base);
      }
    }

    return words.join(" ").replace(/\s+\./g, ".").replace(/\s+,/g, ",");
  }

  function generateFingerDrill(drillType) {
    const map = {
      left_index: ["r", "t", "f", "g", "v", "b"],
      right_pinky: ["p", ";", "/", "[", "]", "'"],
      shift: ["a", "A", "s", "S", "d", "D", "f", "F"],
      left_pinky: ["q", "a", "z", "1"],
      right_index: ["y", "u", "h", "j", "n", "m"]
    };

    const chars = map[drillType] || map.left_index;
    const segments = [];
    for (let i = 0; i < 30; i += 1) {
      const c1 = chars[i % chars.length];
      const c2 = chars[(i + 1) % chars.length];
      segments.push(`${c1}${c2}${c1}${c1}`);
    }
    return segments.join(" ");
  }

  window.TypingSchool = window.TypingSchool || {};
  window.TypingSchool.LessonGenerator = {
    generateAdaptiveLesson,
    generateFingerDrill
  };
})();
