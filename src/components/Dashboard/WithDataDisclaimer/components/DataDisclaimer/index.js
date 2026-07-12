import React, { useState } from "react";
import { Button, Col, Container, Form, Modal } from "react-bootstrap";
/**
 * TODO: Improve imports with aliased paths
 * https://github.com/rivasvict/react-expenses-manager/issues/66
 */
import { BOOLEAN_ENUM } from "../../../../../constants";

const DataDisclaimerModal = ({ show, onHide }) => {
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
      <Modal.Header>Your data stays on this device</Modal.Header>
      <Modal.Body>
        This app is intended for product validation purposes. Nothing you put
        here is stored anywhere other than this very device, and your data
        lives for as long as the browser's data does not get cleared. You can
        download a backup at any time from Data Management.
        <Form.Check type="checkbox" id="data-disclaimer-checkbox">
          <Form.Check.Input
            type="checkbox"
            onClick={changeEverShowDataDisclaimer}
          />
          <Form.Check.Label>{`Don't show this message again`}</Form.Check.Label>
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
              Got it
            </Button>
          </Col>
        </Container>
      </Modal.Footer>
    </Modal>
  );
};

export default DataDisclaimerModal;
