// Reads an uploaded File's raw text content (issue #109's single-file backup
// restore doesn't need CSV parsing, just the JSON text).
export const readFileAsText = ({ file }) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file was selected"));
      return;
    }
    // A fresh FileReader per call, with `once: true` listeners: each fires at
    // most once and then detaches itself, so nothing accumulates across
    // repeated restores. There is nothing shared/module-level here for a
    // second upload to collide with — it gets its own reader and listeners.
    const reader = new FileReader();
    reader.addEventListener(
      "load",
      (onloadEvent) => resolve(onloadEvent.target.result),
      { once: true }
    );
    reader.addEventListener("error", (error) => reject(error), { once: true });
    reader.readAsText(file);
  });
};
