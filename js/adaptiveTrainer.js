(function () {
  function sortedWeakKeys(mistakeTable) {
    return Object.entries(mistakeTable || {})
      .filter(([, count]) => Number(count) > 0)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .map(([key]) => key);
  }

  function normalizeDisplayKey(key) {
    if (key === "space") return " ";
    if (key === "enter") return "\n";
    return key;
  }

  function generatePracticeString(mistakeTable, length) {
    const weakKeys = sortedWeakKeys(mistakeTable).slice(0, 6);
    const targetLength = Math.max(24, Number(length || 80));

    if (!weakKeys.length) {
      return "asdf jkl; asdf jkl; keep rhythm and accuracy first.";
    }

    const chars = weakKeys.map(normalizeDisplayKey);
    let output = "";
    let idx = 0;
    while (output.length < targetLength) {
      const c1 = chars[idx % chars.length];
      const c2 = chars[(idx + 1) % chars.length];
      output += `${c1}${c2}${c1}${c1}${c2} `;
      idx += 1;
    }
    return output.slice(0, targetLength).replace(/\n/g, " ");
  }

  function topMistakes(mistakeTable, limit) {
    return sortedWeakKeys(mistakeTable).slice(0, Number(limit || 5)).map((key) => ({
      key,
      count: Number(mistakeTable[key] || 0)
    }));
  }

  window.TypingSchool = window.TypingSchool || {};
  window.TypingSchool.AdaptiveTrainer = {
    generatePracticeString,
    topMistakes
  };
})();
