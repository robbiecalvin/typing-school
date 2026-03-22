(function () {
  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportJson(state) {
    downloadFile("typing-school-stats.json", JSON.stringify(state, null, 2), "application/json");
  }

  function toCsvRow(values) {
    return values
      .map((value) => `"${String(value == null ? "" : value).replace(/"/g, '""')}"`)
      .join(",");
  }

  function exportCsv(state) {
    const history = (state && state.typing_history) || [];
    const header = ["date", "type", "wpm", "accuracy", "chars", "errors", "words"];
    const rows = [toCsvRow(header)];

    history.forEach((item) => {
      rows.push(toCsvRow([
        item.date,
        item.type,
        item.wpm,
        item.accuracy,
        item.chars,
        item.errors,
        item.words
      ]));
    });

    downloadFile("typing-school-history.csv", rows.join("\n"), "text/csv;charset=utf-8");
  }

  window.TypingSchool = window.TypingSchool || {};
  window.TypingSchool.SessionExporter = {
    exportJson,
    exportCsv
  };
})();
