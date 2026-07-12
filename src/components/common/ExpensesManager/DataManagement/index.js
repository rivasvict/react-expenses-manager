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
import SyncCard from "./SyncCard";

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
      // have navigated elsewhere in the meantime. Push an absolute route
      // (not `goBack()`, which is relative to whatever the current history
      // entry happens to be by then) so landing on the dashboard is
      // deterministic regardless of how long the restore took.
      history.push("/");
    } catch (error) {
      setRestoreError(error.message || "The backup could not be restored");
    }
  };

  const handleClearAllData = () => {
    // Guard the irreversible wipe behind an explicit confirmation.
    const confirmed = window.confirm(
      "This permanently deletes every entry, bucket and category stored on this device. Are you sure?"
    );
    if (!confirmed) return;
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
            <Col className="data-section">
              <h2 className="data-section__title">Keep your data safe</h2>
              <p className="data-section__description">
                Everything you track lives only in this browser. Download a
                backup file regularly so you can restore it here or on another
                device.
              </p>
              <Button type="submit" variant="primary" onClick={handleBackup}>
                Download Backup
              </Button>
              <FileButton
                type="submit"
                variant="secondary"
                onClick={handleRestoreBackup}
                className="vertical-standard-space"
              >
                Restore Backup
              </FileButton>
              {restoreError && (
                <p
                  className="restore-backup-error text-danger vertical-standard-space"
                  role="alert"
                >
                  {restoreError}
                </p>
              )}
            </Col>
          </Row>
          {/* Sync with your party (multi-user sync, DESIGN §4): another way
              of keeping data safe, so it sits between backup and the danger
              zone. The existing cards above/below are untouched (AC-3.7). */}
          <Row>
            <SyncCard />
          </Row>
          <Row>
            <Col className="data-section data-section--danger">
              <h2 className="data-section__title">Danger zone</h2>
              <p className="data-section__description">
                Remove every entry, bucket and category from this device. This
                cannot be undone.
              </p>
              <Button
                type="submit"
                variant="danger"
                onClick={handleClearAllData}
              >
                Clear all data
              </Button>
            </Col>
          </Row>
        </Container>
        <Container className="bottom-content" fluid>
          <Row>
            <Col>
              <Button type="submit" variant="secondary" onClick={handleCancel}>
                Go Back
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
