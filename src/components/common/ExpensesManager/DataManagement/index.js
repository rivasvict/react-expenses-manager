import React from "react";
import {
  clearAllData,
  getBackupData,
  setBalance,
} from "../../../../redux/expensesManager/actionCreators";
import { connect } from "react-redux";
import { Button, Form } from "react-bootstrap";
import { getEntryCategoryOption } from "../../../../helpers/entriesHelper/entriesHelper";
import { ENTRY_TYPES_SINGULAR } from "../../../../constants";
import { getCurrentTimestamp } from "../../../../helpers/date";
import { csv2json } from "json-2-csv";
import { withRouter } from "react-router-dom";
import { MainContentContainer } from "../../MainContentContainer";

const downloadFileFromData = (
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

const getDataFromFile = (file) => {
  return new Promise((resolve, reject) => {
    if (file) {
      const expensesList = getEntryCategoryOption(
        ENTRY_TYPES_SINGULAR.EXPENSE
      ).map((item) => item.value);
      const incomesList = getEntryCategoryOption(
        ENTRY_TYPES_SINGULAR.INCOME
      ).map((item) => item.value);
      const categoriesList = [...expensesList, ...incomesList];
      const reader = new FileReader();
      reader.addEventListener("load", async (onloadEvent) => {
        const fileContent = onloadEvent.target.result;
        const balance = csv2json(fileContent, {
          parseValue: (value) => {
            const hasPotentialWrapper = value.includes(',"');
            const isCategory =
              hasPotentialWrapper &&
              categoriesList.includes(value.replace(/,"/g, "").toLowerCase());
            if (hasPotentialWrapper && isCategory) {
              return value
                .replace(/,"/g, "")
                .replace(/^/g, ",")
                .replace(/$/g, ",");
            }
            return value.replace(',"', "");
          },
        });
        resolve(balance);
      });
      reader.addEventListener("error", (error) => reject(error));
      reader.readAsText(file);
    }
  });
};

const DataManagement = ({
  onGetBackupData,
  onUploadBackup,
  onClearAllData,
  history,
}) => {
  const handleBackup = async () => {
    try {
      const csvContent = await onGetBackupData();
      downloadFileFromData(csvContent, {
        fileName: `balance-backup-${getCurrentTimestamp()}`,
      });
    } catch (error) {
      console.log(error);
    }
  };
  const handleUpload = async (event) => {
    const file = event.target.files[0];
    const balance = await getDataFromFile(file);
    await onUploadBackup({ balance });
    history.goBack();
  };
  const handleClearAllData = () => {
    onClearAllData();
    history.goBack();
  };
  return (
    <MainContentContainer
      className="data-management"
      pageTitle="Data Management"
    >
      <Button block type="submit" variant="primary" onClick={handleBackup}>
        Download Backup
      </Button>
      <Form.Control
        block
        type="file"
        variant="secondary"
        onChange={handleUpload}
      />
      <Button block type="submit" variant="danger" onClick={handleClearAllData}>
        CLEAR ALL DATA
      </Button>
    </MainContentContainer>
  );
};

const mapActionsToProps = (dispatch) => ({
  onGetBackupData: () => dispatch(getBackupData()),
  onUploadBackup: ({ balance }) => dispatch(setBalance({ balance })),
  onClearAllData: () => dispatch(clearAllData()),
});

export default connect(null, mapActionsToProps)(withRouter(DataManagement));
