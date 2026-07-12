import React, { useEffect, useRef } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import AddEntry from "../common/ExpensesManager/AddEntry";
import Summary from "../common/ExpensesManager/Summaries/Summary";
import EntrySummaryWithFilter from "../common/ExpensesManager/Summaries/EntriesSummaryWithFilter";

import { Switch, Route, useRouteMatch } from "react-router-dom";
import { Container } from "react-bootstrap";
import Header from "../common/Header";
import "./styles.scss";
import WorkAreaContentContainer from "../common/WorkAreaContentContainer";
import DashboardContent from "./components/DashboardContent";
import { addViewHeightMobileConfig } from "../../helpers/general";
import EditEntry from "../common/ExpensesManager/EditEntry";
import DataManagement from "../common/ExpensesManager/DataManagement";
import Buckets from "../common/ExpensesManager/Buckets/index.tsx";
import { EditBucket } from "../common/ExpensesManager/EditBucket/index.ts";
import AddBucket from "../common/ExpensesManager/AddBucket";
import AddCategory from "../common/ExpensesManager/AddCategory";
import Categories from "../common/ExpensesManager/Categories";
import FixedEntries from "../common/ExpensesManager/FixedEntries";
import Account from "../Account";
import SignUpScreen from "../Account/SignUpScreen";
import SignInScreen from "../Account/SignInScreen";

function Dashboard({ entries, selectedDate }) {
  useEffect(() => {
    /**
     * TODO: Make sure this calculation also occurs when resizing the screen
     * as well and implement a debounced call.
     * https://github.com/rivasvict/react-expenses-manager/issues/63
     */
    addViewHeightMobileConfig();
  }, []);
  const mainRef = useRef(null);
  const match = useRouteMatch();

  return (
    <main className="main-container container-background" ref={mainRef}>
      <Header />
      <Container fluid className="dashboard-container">
        <WorkAreaContentContainer>
          <Switch>
            <Route path={`${match.url}add-income`}>
              <AddEntry entryType="income" selectedDate={selectedDate} />
            </Route>
            <Route path={`${match.url}edit-income/:entryId`}>
              <EditEntry entryType="income" selectedDate={selectedDate} />
            </Route>
            <Route path={`${match.url}add-expense`}>
              <AddEntry entryType="expense" selectedDate={selectedDate} />
            </Route>
            <Route path={`${match.url}edit-expense/:entryId`}>
              <EditEntry entryType="income" selectedDate={selectedDate} />
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
            <Route path={`${match.url}data-management`}>
              <DataManagement />
            </Route>
            <Route path={`${match.url}add-bucket`}>
              <AddBucket />
            </Route>
            <Route path={`${match.url}add-category`}>
              <AddCategory />
            </Route>
            <Route path={`${match.url}categories`}>
              <Categories />
            </Route>
            <Route path={`${match.url}fixed-entries`}>
              <FixedEntries />
            </Route>
            <Route path={`${match.url}buckets`}>
              <Buckets selectedDate={selectedDate} />
            </Route>
            {/* Account/auth screens (multi-user sync, DESIGN §2). Additive:
                no existing route is gated by the session (AC-1.7). */}
            <Route path={`${match.url}account`}>
              <Account />
            </Route>
            <Route path={`${match.url}sign-up`}>
              <SignUpScreen />
            </Route>
            <Route path={`${match.url}sign-in`}>
              <SignInScreen />
            </Route>
            {/** TODO: Work with a bucketId instead of a bucketName */}
            <Route path={`${match.url}edit-bucket/:bucketName`}>
              <EditBucket />
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

// TODO(#108): Replace with a precise PropTypes.shape that mirrors the real
// nested tree { [year]: { [month]: { incomes: Entry[], expenses: Entry[] } } }.
Dashboard.propTypes = {
  entries: PropTypes.object.isRequired,
};

export default connect(mapStateToProps)(Dashboard);
