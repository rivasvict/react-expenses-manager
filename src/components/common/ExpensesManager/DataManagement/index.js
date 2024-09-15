import React from "react";
import {
  clearAllData,
  getBackupData,
  uploadBackup,
} from "../../../../redux/expensesManager/actionCreators";
import { connect } from "react-redux";
import { Button, Form } from "react-bootstrap";
import { withRouter } from "react-router-dom";
import { MainContentContainer } from "../../MainContentContainer";
import { downloadFileFromData } from "./utils";

const DataManagement = ({
  onGetBackupData,
  onUploadBackup,
  onClearAllData,
  history,
}) => {
  const handleBackup = async () => {
    try {
      const { csvContent, fileName } = await onGetBackupData();
      downloadFileFromData(csvContent, {
        fileName,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleUpload = async (event) => {
    try {
      const file = event.target.files[0];
      await onUploadBackup({ file });
      history.goBack();
    } catch (error) {
      console.log(error);
    }
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
  onUploadBackup: ({ file }) => dispatch(uploadBackup({ file })),
  onClearAllData: () => dispatch(clearAllData()),
});

export default connect(null, mapActionsToProps)(withRouter(DataManagement));
