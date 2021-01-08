import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Results from '../Results';
import AddEntry from '../common/ExpensesManager/AddEntry/AddEntry';
import Summary from '../../components/common/ExpensesManager/Summaries/Summary';
import EntrySummaryWithFilter from '../common/ExpensesManager/Summaries/EntrySummaryWithFilter'

import { Switch, Route, Link, useRouteMatch } from 'react-router-dom';

const dasahboardStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh'
};

function Dashboard({ entries }) {
  const match = useRouteMatch();

  return (
    <div style={dasahboardStyle}>
      <Switch>
        <Route exact path={`${match.url}`}>
          <Link to={`${match.url}/add-income`}>Add income</Link>
          <Results 
            entries={entries}
            baseUrl={match.url}/>
          <Link to={`${match.url}/add-expense`}>Add expense</Link>
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
    </div>
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
