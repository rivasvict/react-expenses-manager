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
import jszipModule from "jszip";
import { getCurrentTimestamp } from "../../../../helpers/date";

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
      const { balanceCsv, balanceFileName, bucketsCsv, bucketsFileName } =
        await onGetBackupData();

      // Create a zip containing both CSV files and trigger download.
      const JSZip = jszipModule.default ?? jszipModule;
      const zip = new JSZip();

      zip.file(balanceFileName || "balance.csv", balanceCsv);
      zip.file(bucketsFileName || "buckets.csv", bucketsCsv);

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const ts = getCurrentTimestamp();
      const zipFileName = `backup_${ts}`;

      return downloadFileFromData(zipBlob, {
        fileName: zipFileName,
        extension: "zip",
        mimeType: "application/zip",
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleUploadEntries = async (event) => {
    try {
      const file = event.target.files[0];
      await onUploadBackup({ file, type: "balance" });
      goBack();
    } catch (error) {
      console.log(error);
    }
  };

  const handleUploadBuckets = async (event) => {
    try {
      const file = event.target.files[0];
      await onUploadBackup({ file, type: "buckets" });
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
                Download Backup Data
              </Button>
            </Col>
          </Row>
          <Row>
            <Col>
              <FileButton
                type="submit"
                variant="secondary"
                onClick={handleUploadEntries}
              >
                Restore Income/Expenses Data
              </FileButton>
            </Col>
          </Row>
          <Row>
            <Col>
              <FileButton
                type="submit"
                variant="secondary"
                onClick={handleUploadBuckets}
              >
                Restore Buckets Data
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
  onUploadBackup: ({ file, type }) => dispatch(uploadBackup({ file, type })),
  onClearAllData: () => dispatch(clearAllData()),
});

export default connect(null, mapActionsToProps)(withRouter(DataManagement));
