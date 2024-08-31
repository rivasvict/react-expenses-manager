import React, { useEffect, useRef } from "react";
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
import { Chart } from "chart.js/auto";

const DoughnutChart = ({ chartLabel, data }) => {
  const { labels, chartData } = data;
  const chartRef = useRef(null);
  useEffect(() => {
    if (chartRef.current) {
      const chart = new Chart(chartRef.current, {
        type: "doughnut",
        data: {
          labels,
          datasets: [
            {
              label: chartLabel,
              data: chartData,
              hoverOffset: 4,
              backgroundColor: [
                "rgb(240 185 11)", // Yellowish
                "rgb(112 122 138)", // Grayish-blue
                "rgb(135, 60, 95)", // A reddish-pink color
                "rgb(30, 150, 190)", // A light blue color
                "rgb(60, 180, 75)", // A green color
                "rgb(255, 105, 180)", // Hot pink
                "rgb(190, 75, 220)", // Purple
                "rgb(255, 140, 0)", // Dark orange
                "rgb(0, 128, 128)", // Teal
                "rgb(75, 0, 130)", // Indigo
                "rgb(255, 69, 0)", // Red-orange
                "rgb(0, 255, 127)", // Spring green
                "rgb(0, 100, 0)", // Dark green
                "rgb(255, 20, 147)", // Deep pink
                "rgb(64, 224, 208)", // Turquoise
              ],
            },
          ],
        },
        options: {
          plugins: {
            legend: {
              display: true,
              labels: {
                color: "white",
              },
            },
          },
        },
      });
      return () => {
        chart.destroy();
      };
    }
  }, [labels, chartData, chartLabel]);

  return <canvas ref={chartRef} />;
};

const BalanceChart = ({ incomesSum, expensesSum }) => {
  const incomePercentage = (incomesSum / (incomesSum + -expensesSum)) * 100;
  const expensePercentage = (-expensesSum / (incomesSum + -expensesSum)) * 100;

  return (
    <DoughnutChart
      data={{
        labels: ["Incomes", "Expenses"],
        chartData: [incomePercentage, expensePercentage],
      }}
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
      <Row className="balance-chart-container">
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
