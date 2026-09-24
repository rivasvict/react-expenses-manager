// TODO: This file has no colocated unit test; it was edited, not created,
// by the EN/ES translations change. Tracked in:
// https://github.com/rivasvict/react-expenses-manager/issues/187
import React, { useState } from "react";
import { Button, Col, Container, Form, Modal } from "react-bootstrap";
/**
 * TODO: Improve imports with aliased paths
 * https://github.com/rivasvict/react-expenses-manager/issues/66
 */
import { BOOLEAN_ENUM } from "../../../../../constants";
import { useTranslation } from "../../../../../i18n";

const DataDisclaimerModal = ({ show, onHide }) => {
  const { t } = useTranslation();
  const [everShowDataDisclaimer, setEverSHowDataDisclaimer] = useState(
    BOOLEAN_ENUM.TRUE
  );

  const changeEverShowDataDisclaimer = (event) => {
    setEverSHowDataDisclaimer(
      !event?.target?.checked ? BOOLEAN_ENUM.TRUE : BOOLEAN_ENUM.FALSE
    );
  };

  const onHideHandler = () => onHide({ everShowDataDisclaimer });

  return (
    <Modal show={show} onHide={onHideHandler} centered>
      <Modal.Header>{t("dataDisclaimer.title")}</Modal.Header>
      <Modal.Body>
        {t("dataDisclaimer.body")}
        <Form.Check type="checkbox" id="data-disclaimer-checkbox">
          <Form.Check.Input
            type="checkbox"
            onClick={changeEverShowDataDisclaimer}
          />
          <Form.Check.Label>{t("dataDisclaimer.dontShowAgain")}</Form.Check.Label>
        </Form.Check>
      </Modal.Body>
      <Modal.Footer>
        <Container fluid className="g-0">
          <Col xs={12} className="bottom-content">
            <Button
              onClick={onHideHandler}
              variant="primary"
              className="full-width"
            >
              {t("dataDisclaimer.confirm")}
            </Button>
          </Col>
        </Container>
      </Modal.Footer>
    </Modal>
  );
};

export default DataDisclaimerModal;
