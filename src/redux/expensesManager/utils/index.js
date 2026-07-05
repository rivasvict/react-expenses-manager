// Reads an uploaded File's raw text content (issue #109's single-file backup
// restore doesn't need CSV parsing, just the JSON text).
export const readFileAsText = ({ file }) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file was selected"));
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", (onloadEvent) => {
      resolve(onloadEvent.target.result);
    });
    reader.addEventListener("error", (error) => reject(error));
    reader.readAsText(file);
  });
};
