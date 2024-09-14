import React from "react";
import { Button, Col, Container, Form, Navbar, Row } from "react-bootstrap";
import { connect } from "react-redux";
import logoImage from "../../images/expenses_tracker_logo.png";
import { logOut } from "../../redux/userManager/actionCreators";
import ButtonLikeLink from "./ButtonLikeLink";
import "./Header.scss";
import {
  getBackupData,
  uploadBackup,
} from "../../redux/expensesManager/actionCreators";
import { getCurrentTimestamp } from "../../helpers/date";

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

const Header = ({ /*onLogOut,*/ onGetBackupData, onUploadBackup }) => {
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
  const handleUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener("load", (onloadEvent) => {
        const fileContent = onloadEvent.target.result;
        console.log(fileContent);
      });
      reader.readAsText(file);
    }
    // onUploadBackup();
  };
  return (
    <header>
      <Navbar expand="md" variant="dark">
        <Navbar.Brand href="#home">
          <img src={logoImage} alt="Expenses tracker logo" className="logo" />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <ButtonLikeLink to="/" buttonTitle="Home" />
          {/**
           * TODO:
           * Reinstate <AuthenticatedApp />
           * https://github.com/users/rivasvict/projects/3/views/1?pane=issue&itemId=75192915
           */}
          {/* <Button block type='submit' variant='secondary' onClick={onLogOut}>Sign out</Button> */}
          <Button block type="submit" variant="primary" onClick={handleBackup}>
            Download Backup
          </Button>
          <Form.Control
            block
            type="file"
            variant="secondary"
            onChange={handleUpload}
          />
        </Navbar.Collapse>
      </Navbar>
      <Container>
        <Row className="header-info">
          <Col xs={12} className="sub-title">
            <h3>Month Balance</h3>
          </Col>
        </Row>
      </Container>
    </header>
  );
};

const mapActionsToProps = (dispatch) => ({
  onLogOut: () => dispatch(logOut()),
  onGetBackupData: () => dispatch(getBackupData()),
  onUploadBackup: () => dispatch(uploadBackup()),
});

export default connect(null, mapActionsToProps)(Header);
