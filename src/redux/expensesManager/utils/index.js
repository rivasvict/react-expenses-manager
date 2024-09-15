export const getDataFromFile =
  ({ dataParser }) =>
  ({ file }) => {
    return new Promise((resolve, reject) => {
      if (file) {
        const reader = new FileReader();
        reader.addEventListener("load", async (onloadEvent) => {
          const fileContent = onloadEvent.target.result;
          const balance = dataParser.csvToJson({ csv: fileContent });
          resolve(balance);
        });
        reader.addEventListener("error", (error) => reject(error));
        reader.readAsText(file);
      }
    });
  };
