import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Results from '../Results';
import AddEntry from '../common/ExpensesManager/AddEntry/AddEntry';
import Summary from '../../components/common/ExpensesManager/Summaries/Summary';
import EntrySummaryWithFilter from '../common/ExpensesManager/Summaries/EntrySummaryWithFilter'

import { Switch, Route, Link, useRouteMatch } from 'react-router-dom';
import { Col, Container, Row } from 'react-bootstrap';
import Header from '../common/Header';
import './Dashboard.scss';
import './DashboardContent.scss';

const DashboardContent = ({ entries, match }) => (
  <Row className='dashboard-content-container vertical-standard-space-padding'>
    <Col xs={12}>
      <Results
        entries={entries}
        baseUrl={match.url} />
    </Col>
    <Col xs={12}>
      <Link to={`${match.url}/add-income`} className='btn btn-primary btn-block vertical-standard-space'>Add Income</Link>
    </Col>
    <Col xs={12}>
      <Link to={`${match.url}/add-expense`} className='btn btn-secondary btn-block'>Add Expenses</Link>
    </Col>
  </Row>
);

function Dashboard({ entries }) {
  const match = useRouteMatch();

  return (
    <React.Fragment>
      <Header />
      <Container fluid className='main-container'>
        <Switch>
          <Route exact path={`${match.url}`}>
            <DashboardContent {...{ entries, match }} />
          </Route>
          <Route path={`${match.url}/add-income`}>
            <AddEntry entryType='income' />
          </Route>
          <Route path={`${match.url}/add-expense`}>
            <AddEntry entryType='outcome' />
          </Route>
          <Route path={`${match.url}/incomes`}>
            <EntrySummaryWithFilter entryType='income' />
          </Route>
          <Route path={`${match.url}/outcomes`}>
            <EntrySummaryWithFilter entryType='outcome' />
          </Route>
          <Route path={`${match.url}/summary`}>
            <Summary entries={entries} />
          </Route>
        </Switch>
      </Container>
    </React.Fragment>
  )
}

const mapStateToProps = state => ({
  entries: state.expensesManager.entries
});

Dashboard.propTypes = {
  entries: PropTypes.shape({
    incomes: PropTypes.arrayOf(
      PropTypes.shape({
        ammount: PropTypes.number.isRequired,
        description: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        category: PropTypes.string.isRequired
      }).isRequired
    ).isRequired,
    outcomes: PropTypes.arrayOf(
      PropTypes.shape({
        ammount: PropTypes.number.isRequired,
        description: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        category: PropTypes.string.isRequired
      }).isRequired
    ).isRequired
  }).isRequired
};

export default connect(mapStateToProps)(Dashboard);
