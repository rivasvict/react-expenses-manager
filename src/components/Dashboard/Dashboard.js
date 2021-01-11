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
  <Col xs={12} className='dashboard-content-container vertical-standard-space-padding'>
    <Row className='top-container'>
      <Col xs={12} className='top-content'>
        <Results
          entries={entries}
          baseUrl={match.url} />
      </Col>
    </Row>
    <Row>
      <Col xs={12} className='bottom-content'>
        <Link to={`${match.url}/add-income`} className='btn btn-primary btn-block'>Add Income</Link>
        <Link to={`${match.url}/add-expense`} className='btn btn-secondary btn-block'>Add Expenses</Link>
      </Col>
    </Row>
  </Col>
);

function Dashboard({ entries }) {
  const match = useRouteMatch();

  return (
    <main className='main-container'>
      <Header />
      <Container fluid>
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
    </main>
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
