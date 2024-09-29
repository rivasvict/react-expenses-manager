import React from "react";
import { Row, Col, Container, Button } from "react-bootstrap";
import "./styles.scss";
import ScreenTitle from "../ScreenTitle";
import { getMonthNameDisplay } from "../../../helpers/date";
import { setSelectedDate } from "../../../redux/expensesManager/actionCreators";
import { connect } from "react-redux";
import {
  doesAdjacentDateExist,
  handleDateSelectionPointers,
} from "./utils/index.ts";

const NavigableMonthHeader = ({
  entries,
  selectedDate,
  onSelectedDateChange,
}) => {
  return (
    <Container fluid>
      <Row className="month-header">
        <Col xs={3}>
          {doesAdjacentDateExist({
            dateAdjacencyType: "prev",
            selectedDate,
            entries,
          }) ? (
            <Button
              onClick={() =>
                handleDateSelectionPointers({
                  entries,
                  selectedDate,
                  onSelectedDateChange,
                  dateAdjacencyType: "prev",
                })
              }
            >
              Prev
            </Button>
          ) : null}
        </Col>
        <Col xs={6}>
          <ScreenTitle
            screenTitle={`${getMonthNameDisplay(selectedDate.month)} ${selectedDate.year}`}
          />
        </Col>
        <Col xs={3}>
          {doesAdjacentDateExist({
            dateAdjacencyType: "next",
            selectedDate,
            entries,
          }) ? (
            <Button
              onClick={() =>
                handleDateSelectionPointers({
                  entries,
                  selectedDate,
                  onSelectedDateChange,
                  dateAdjacencyType: "next",
                })
              }
            >
              Next
            </Button>
          ) : null}
        </Col>
      </Row>
    </Container>
  );
};

const mapStateToProps = (state) => ({
  entries: state.expensesManager.entries,
  selectedDate: state.expensesManager.selectedDate,
});

const mapActionsToProps = (dispatch) => ({
  onSelectedDateChange: (newSelectedDate) =>
    dispatch(setSelectedDate(newSelectedDate)),
});

export default connect(
  mapStateToProps,
  mapActionsToProps
)(NavigableMonthHeader);
