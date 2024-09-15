import React from "react";
import { Button, Col, Container, Form, Navbar, Row } from "react-bootstrap";
import { connect } from "react-redux";
import logoImage from "../../images/expenses_tracker_logo.png";
import { logOut } from "../../redux/userManager/actionCreators";
import ButtonLikeLink from "./ButtonLikeLink";
import "./Header.scss";
import {
  clearAllData,
  getBackupData,
  setBalance,
} from "../../redux/expensesManager/actionCreators";
import { getCurrentTimestamp } from "../../helpers/date";
import { csv2json } from "json-2-csv";
import { getEntryCategoryOption } from "../../helpers/entriesHelper/entriesHelper";
import { ENTRY_TYPES_PLURAL, ENTRY_TYPES_SINGULAR } from "../../constants";

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

const Header = ({
  /*onLogOut,*/ onGetBackupData,
  onUploadBackup,
  onClearAllData,
}) => {
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
      const expensesList = getEntryCategoryOption(
        ENTRY_TYPES_SINGULAR.EXPENSE
      ).map((item) => item.value);
      const incomesList = getEntryCategoryOption(
        ENTRY_TYPES_SINGULAR.INCOME
      ).map((item) => item.value);
      const categoriesList = [...expensesList, ...incomesList];
      const reader = new FileReader();
      reader.addEventListener("load", (onloadEvent) => {
        const fileContent = onloadEvent.target.result;
        console.log(fileContent);
        const balance = csv2json(fileContent, {
          parseValue: (value) => {
            const hasPotentialWrapper = value.includes(',"');
            const isCategory =
              hasPotentialWrapper &&
              categoriesList.includes(value.replace(/,"/g, "").toLowerCase());
            if (hasPotentialWrapper && isCategory) {
              return value
                .replace(/,"/g, "")
                .replace(/^/g, ",")
                .replace(/$/g, ",");
            }
            return value.replace(',"', "");
          },
        });
        onUploadBackup({ balance });
      });
      reader.readAsText(file);
    }
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
          <Button block type="submit" variant="danger" onClick={onClearAllData}>
            CLEAR ALL DATA
          </Button>
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
  onUploadBackup: ({ balance }) => dispatch(setBalance({ balance })),
  onClearAllData: () => dispatch(clearAllData()),
});

export default connect(null, mapActionsToProps)(Header);
