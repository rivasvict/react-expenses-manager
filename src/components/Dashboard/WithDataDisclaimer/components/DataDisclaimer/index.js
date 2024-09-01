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
      <Modal.Header>Data Disclaimer</Modal.Header>
      <Modal.Body>
        This app is intended for product validation purposes. No data you put
        here is being stored in any other location than this very device. The
        data will live as long as the browser's data does not get cleared.
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
              I Aknowledge
            </Button>
          </Col>
        </Container>
      </Modal.Footer>
    </Modal>
  );
};

export default DataDisclaimerModal;
