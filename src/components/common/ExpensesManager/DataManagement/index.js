import React from "react";
import {
  clearAllData,
  getBackupData,
  uploadBackup,
} from "../../../../redux/expensesManager/actionCreators";
import { connect } from "react-redux";
import { Button, Col, Container, Row } from "react-bootstrap";
import { withRouter } from "react-router-dom";
import { MainContentContainer } from "../../MainContentContainer";
import { downloadFileFromData } from "./utils";
import { FileButton } from "./components";
import "./styles.scss";

const DataManagement = ({
  onGetBackupData,
  onUploadBackup,
  onClearAllData,
  history,
}) => {
  const goBack = () => {
    history.goBack();
  };

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
      goBack();
    } catch (error) {
      console.log(error);
    }
  };

  const handleClearAllData = () => {
    onClearAllData();
    goBack();
  };

  const handleCancel = () => goBack();

  return (
    <MainContentContainer
      className="data-management"
      pageTitle="Data Management"
    >
      <Container className="buttons-container" fluid>
        <Container className="top-content" fluid>
          <Row>
            <Col>
              <Button type="submit" variant="primary" onClick={handleBackup}>
                Download Backup File
              </Button>
            </Col>
          </Row>
          <Row>
            <Col>
              <FileButton
                type="submit"
                variant="secondary"
                onClick={handleUpload}
              >
                Restore Backup From File
              </FileButton>
            </Col>
          </Row>
          <Row>
            <Col>
              <Button
                type="submit"
                variant="danger"
                onClick={handleClearAllData}
              >
                CLEAR ALL DATA
              </Button>
            </Col>
          </Row>
        </Container>
        <Container className="bottom-content" fluid>
          <Row>
            <Col>
              <Button type="submit" variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
            </Col>
          </Row>
        </Container>
      </Container>
    </MainContentContainer>
  );
};

const mapActionsToProps = (dispatch) => ({
  onGetBackupData: () => dispatch(getBackupData()),
  onUploadBackup: ({ file }) => dispatch(uploadBackup({ file })),
  onClearAllData: () => dispatch(clearAllData()),
});

export default connect(null, mapActionsToProps)(withRouter(DataManagement));
