import React, { useState } from "react";
import {
  clearAllData,
  getBackupData,
  restoreBackup,
} from "../../../../redux/expensesManager/actionCreators";
import { connect } from "react-redux";
import { Button, Col, Container, Row } from "react-bootstrap";
import { withRouter } from "react-router-dom";
import { MainContentContainer } from "../../MainContentContainer";
import { downloadFileFromData } from "./utils";
import { FileButton } from "./components";

import "./styles.scss";

/**
 * Single-file backup & restore (issue #109): one Download control produces a
 * single JSON file with the whole app (entries, buckets, categories, fixed
 * entries), and one Restore control rebuilds the app from that file.
 */
const DataManagement = ({
  onGetBackupData,
  onRestoreBackup,
  onClearAllData,
  history,
}) => {
  const [restoreError, setRestoreError] = useState(null);

  const goBack = () => {
    history.goBack();
  };

  const handleBackup = async () => {
    try {
      const { json, fileName } = await onGetBackupData();
      return downloadFileFromData(json, {
        fileName,
        extension: "json",
        mimeType: "application/json",
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleRestoreBackup = async (event) => {
    try {
      const file = event.target.files[0];
      await onRestoreBackup({ file });
      setRestoreError(null);
      // Reading the file is async, so by the time this resolves the user may
      // already have navigated elsewhere; unlike the other actions here, we
      // don't navigate away on success (a relative `goBack()` could revert
      // wherever they've since gone). The restored data is already live via
      // Redux everywhere else in the app.
    } catch (error) {
      setRestoreError(error.message || "The backup could not be restored");
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
                Download Backup
              </Button>
            </Col>
          </Row>
          <Row>
            <Col>
              <FileButton
                type="submit"
                variant="secondary"
                onClick={handleRestoreBackup}
              >
                Restore Backup
              </FileButton>
            </Col>
          </Row>
          {restoreError && (
            <Row>
              <Col>
                <p className="restore-backup-error text-danger" role="alert">
                  {restoreError}
                </p>
              </Col>
            </Row>
          )}
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
  onRestoreBackup: ({ file }) => dispatch(restoreBackup({ file })),
  onClearAllData: () => dispatch(clearAllData()),
});

export default connect(null, mapActionsToProps)(withRouter(DataManagement));
