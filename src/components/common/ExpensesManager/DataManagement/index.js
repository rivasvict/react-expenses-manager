// TODO: This file has no colocated unit test; it was edited, not created,
// by the EN/ES translations change. Tracked in:
// https://github.com/rivasvict/react-expenses-manager/issues/187
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
import { useTranslation } from "../../../../i18n";

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
  const { t, language, setLanguage } = useTranslation();
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
      // Backup validation errors carry a translation key; anything else
      // (e.g. a storage failure) falls back to its own message.
      setRestoreError(
        error.translationKey
          ? t(error.translationKey, error.translationParams)
          : error.message || t("dataManagement.restoreFailed")
      );
    }
  };

  const handleClearAllData = async () => {
    // Guard the irreversible wipe behind an explicit confirmation.
    const confirmed = window.confirm(t("dataManagement.clearConfirm"));
    if (!confirmed) return;
    await onClearAllData();
    // The wipe clears localStorage wholesale; the UI language is a device
    // setting rather than tracked data, so write it back.
    setLanguage(language);
    goBack();
  };

  const handleCancel = () => goBack();

  return (
    <MainContentContainer
      className="data-management"
      pageTitle={t("nav.dataManagement")}
    >
      <Container className="buttons-container" fluid>
        <Container className="top-content" fluid>
          <Row>
            <Col className="data-section">
              <h2 className="data-section__title">
                {t("dataManagement.backupTitle")}
              </h2>
              <p className="data-section__description">
                {t("dataManagement.backupDescription")}
              </p>
              <Button type="submit" variant="primary" onClick={handleBackup}>
                {t("dataManagement.download")}
              </Button>
              <FileButton
                type="submit"
                variant="secondary"
                onClick={handleRestoreBackup}
                className="vertical-standard-space"
              >
                {t("dataManagement.restore")}
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
          {/* Sync with your party (docs/multi-user-sync/DESIGN.md §4):
              another way of keeping data safe, so it sits between backup
              and the danger zone. The existing cards above/below are
              untouched (AC-3.7, docs/multi-user-sync/PRD.md). */}
          <Row>
            <SyncCard />
          </Row>
          <Row>
            <Col className="data-section data-section--danger">
              <h2 className="data-section__title">
                {t("dataManagement.dangerTitle")}
              </h2>
              <p className="data-section__description">
                {t("dataManagement.dangerDescription")}
              </p>
              <Button
                type="submit"
                variant="danger"
                onClick={handleClearAllData}
              >
                {t("dataManagement.clearAll")}
              </Button>
            </Col>
          </Row>
        </Container>
        <Container className="bottom-content" fluid>
          <Row>
            <Col>
              <Button type="submit" variant="secondary" onClick={handleCancel}>
                {t("common.goBack")}
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
