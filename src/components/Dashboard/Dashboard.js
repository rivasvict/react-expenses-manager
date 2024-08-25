import React from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import AddEntry from "../common/ExpensesManager/AddEntry/AddEntry";
import Summary from "../../components/common/ExpensesManager/Summaries/Summary";
import EntrySummaryWithFilter from "../common/ExpensesManager/Summaries/EntrySummaryWithFilter";

import { Switch, Route, useRouteMatch } from "react-router-dom";
import { Container } from "react-bootstrap";
import Header from "../common/Header";
import "./Dashboard.scss";
import WorkAreaContentContainer from "../common/WorkAreaContentContainer";
import DashboardContent from "./DashboardContent";

function Dashboard({ entries, selectedDate }) {
  const match = useRouteMatch();

  return (
    <main className="main-container">
      <Header />
      <Container fluid>
        <WorkAreaContentContainer>
          <Switch>
            <Route path={`${match.url}add-income`}>
              <AddEntry entryType="income" selectedDate={selectedDate} />
            </Route>
            <Route path={`${match.url}add-expense`}>
              <AddEntry entryType="expense" selectedDate={selectedDate} />
            </Route>
            <Route path={`${match.url}incomes`}>
              <EntrySummaryWithFilter
                selectedDate={selectedDate}
                entryType="income"
              />
            </Route>
            <Route path={`${match.url}expenses`}>
              <EntrySummaryWithFilter
                selectedDate={selectedDate}
                entryType="expense"
              />
            </Route>
            <Route path={`${match.url}summary`}>
              {/* TODO: Fix the issue that appears when the screen is refreshed on the summary route */}
              <Summary entries={entries} selectedDate={selectedDate} />
            </Route>
            <Route path={`${match.url}dashboard`}>
              <DashboardContent {...{ entries, match }} />
            </Route>
            <Route exact path={`${match.url}`}>
              <DashboardContent {...{ entries, match }} />
            </Route>
          </Switch>
        </WorkAreaContentContainer>
      </Container>
    </main>
  );
}

const mapStateToProps = (state) => ({
  entries: state.expensesManager.entries,
  selectedDate: state.expensesManager.selectedDate,
});

// TODO: Fix this propTypes and add it through the whole application
Dashboard.propTypes = {
  entries: PropTypes.shape({
    incomes: PropTypes.arrayOf(
      PropTypes.shape({
        amount: PropTypes.number.isRequired,
        description: PropTypes.string,
        timestamp: PropTypes.number.isRequired,
        type: PropTypes.string.isRequired,
        category: PropTypes.shape({
          id: PropTypes.number,
          name: PropTypes.string.isRequired,
        }),
      }).isRequired,
    ).isRequired,
    expenses: PropTypes.arrayOf(
      PropTypes.shape({
        amount: PropTypes.number.isRequired,
        description: PropTypes.string,
        timestamp: PropTypes.number.isRequired,
        type: PropTypes.string.isRequired,
        category: PropTypes.shape({
          id: PropTypes.number,
          name: PropTypes.string.isRequired,
        }),
      }).isRequired,
    ).isRequired,
  }).isRequired,
};

export default connect(mapStateToProps)(Dashboard);
