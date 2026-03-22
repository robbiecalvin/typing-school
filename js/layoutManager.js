(function () {
  const STORAGE_KEY = "typingSchoolKeyboardLayout";

  const fallbackLayouts = [
    {
      id: "qwerty",
      name: "QWERTY",
      rows: [
        ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="],
        ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"],
        ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "Enter"],
        ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/", "Space"]
      ],
      finger_map: {}
    }
  ];

  async function loadLayouts() {
    try {
      const response = await fetch("data/keyboard_layouts.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load layouts");
      const data = await response.json();
      return Array.isArray(data) && data.length ? data : fallbackLayouts;
    } catch (_error) {
      return fallbackLayouts;
    }
  }

  function getSavedLayoutId() {
    try {
      return localStorage.getItem(STORAGE_KEY) || "qwerty";
    } catch (_error) {
      return "qwerty";
    }
  }

  function saveLayoutId(layoutId) {
    try {
      localStorage.setItem(STORAGE_KEY, layoutId);
    } catch (_error) {
      return;
    }
  }

  function findLayout(layouts, id) {
    return (layouts || []).find((layout) => layout.id === id) || layouts[0] || fallbackLayouts[0];
  }

  window.TypingSchool = window.TypingSchool || {};
  window.TypingSchool.LayoutManager = {
    loadLayouts,
    getSavedLayoutId,
    saveLayoutId,
    findLayout
  };
})();
