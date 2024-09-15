export const downloadFileFromData = (
  data,
  configuration = {
    mimeType: "text/csv;charset=utf-8;",
    fileName: "data",
    extension: "csv",
  }
) => {
  const {
    mimeType = "text/csv;charset=utf-8;",
    fileName = "data",
    extension = "csv",
  } = configuration;
  if (!extension || !mimeType || !mimeType.includes(extension))
    throw new Error(
      `The MIME type ${mimeType} does not contain the ${extension} type, make sure these two coincide`
    );
  const blob = new Blob([data], { type: mimeType });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}.${extension}`);

  // Append the link to the body (it won't be visible)
  document.body.appendChild(link);

  // Programmatically click the link to trigger the download
  link.click();

  // Clean up and remove the link
  document.body.removeChild(link);
  URL.revokeObjectURL();
};
