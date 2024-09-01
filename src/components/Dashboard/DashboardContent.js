import React from "react";
import { Button, Col, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import Results from "../Results";
import { getMonthNameDisplay } from "../../helpers/date";
import {
  getNewSelectedDate,
  doesAdjacentDateExist,
  calculateTotal,
} from "../../helpers/general";
import ScreenTitle from "../common/ScreenTitle";
import { connect } from "react-redux";
import { setSelectedDate } from "../../redux/expensesManager/actionCreators";
import {
  formatNumberForDisplay,
  getSum,
} from "../../helpers/entriesHelper/entriesHelper";
import "./DashboardContent.scss";
import { IconRemote } from "../common/Icons";
import ContentTileSection from "../common/ContentTitleSection";
import { MainContentContainer } from "../common/MainContentContainer";
import DoughnutChart from "../common/DoughnutChart";

const BalanceChart = ({ incomesSum, expensesSum }) => {
  const totalSum = incomesSum + Math.abs(expensesSum);
  const incomePercentage = (incomesSum / totalSum) * 100;
  const expensePercentage = (Math.abs(expensesSum) / totalSum) * 100;

  return (
    <DoughnutChart
      data={{
        labels: ["Incomes", "Expenses"],
        chartData: [incomePercentage, expensePercentage],
      }}
      shouldShow={!!totalSum}
    />
  );
};

const handleDateSelectionPointers = ({
  entries,
  selectedDate,
  onSelectedDateChange,
  dateAdjacencyType,
}) =>
  onSelectedDateChange(
    getNewSelectedDate({
      entries,
      dateAdjacencyType,
      currentSelectedDate: selectedDate,
    })
  );

const DashboardContent = ({
  entries,
  match,
  selectedDate,
  onSelectedDateChange,
}) => {
  const monthBalance = (entries[selectedDate.year] &&
    entries[selectedDate.year][selectedDate.month]) || {
    incomes: [],
    expenses: [],
  };
  const summaryUrl = `${match.url}summary`;
  const incomesName = "incomes";
  const expensesName = "expenses";
  const incomesSum = getSum({ entryType: incomesName, entries: monthBalance });
  const expensesSum = getSum({
    entryType: expensesName,
    entries: monthBalance,
  });
  const totalSum = calculateTotal(incomesSum, expensesSum);
  return (
    <MainContentContainer className="dashboard-content">
      <ContentTileSection title="Summary" to={summaryUrl}>
        {`Savings `}
        <IconRemote inLine={true} />
        {` ${formatNumberForDisplay(totalSum)}`}
      </ContentTileSection>
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
      <Row className="chart-container">
        <Col xs={6}>
          <BalanceChart incomesSum={incomesSum} expensesSum={expensesSum} />
        </Col>
      </Row>
      <MonthContent {...{ entries: monthBalance, match }} />
    </MainContentContainer>
  );
};

const MonthContent = ({ entries, match }) => (
  <React.Fragment>
    <Row className="top-container">
      <Col xs={12} className="top-content">
        <Results entries={entries} baseUrl={match.url} />
      </Col>
    </Row>
    <Row className="bottom-container">
      <Col xs={12} className="bottom-content">
        <Link
          to={`${match.url}add-income`}
          className="btn btn-primary btn-block"
        >
          Add Income
        </Link>
        <Link
          to={`${match.url}add-expense`}
          className="btn btn-secondary btn-block vertical-standard-space"
        >
          Add Expenses
        </Link>
      </Col>
    </Row>
  </React.Fragment>
);

const mapStateToProps = (state) => ({
  entries: state.expensesManager.entries,
  selectedDate: state.expensesManager.selectedDate,
});

const mapActionsToProps = (dispatch) => ({
  onSelectedDateChange: (newSelectedDate) =>
    dispatch(setSelectedDate(newSelectedDate)),
});

export default connect(mapStateToProps, mapActionsToProps)(DashboardContent);
