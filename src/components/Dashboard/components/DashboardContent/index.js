import React from "react";
import { Col, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import Results from "../../../Results";
import { calculateTotal } from "../../../../helpers/general";
import { connect } from "react-redux";
import {
  formatNumberForDisplay,
  getSum,
} from "../../../../helpers/entriesHelper/entriesHelper";
import "./styles.scss";
import { IconRemote } from "../../../common/Icons";
import ContentTileSection from "../../../common/ContentTitleSection";
import { MainContentContainer } from "../../../common/MainContentContainer";
import BalanceChart from "./components/BalanceChart";
import ChartContainerRowWrapper from "../../../common/ChartContainerRowWrapper";
import { NavigableMonthHeader } from "../../../common/NavigableMonthHeader/index.ts";

const DashboardContent = ({ entries, match, selectedDate }) => {
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
    <MainContentContainer
      className="dashboard-content"
      pageTitle="Monthly Balance"
    >
      <ContentTileSection title="Summary" to={summaryUrl}>
        {`Savings `}
        <IconRemote inLine={true} />
        {` ${formatNumberForDisplay(totalSum)}`}
      </ContentTileSection>
      <NavigableMonthHeader />
      <ChartContainerRowWrapper>
        <BalanceChart incomesSum={incomesSum} expensesSum={expensesSum} />
      </ChartContainerRowWrapper>
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

export default connect(mapStateToProps)(DashboardContent);
