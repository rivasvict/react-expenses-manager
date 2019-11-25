import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
// import _ from 'lodash';
import Results from './Results';
import AddEntry from './AddEntry';
import Summary from './Summary';
import EntrySummaryWithFilter from './EntrySummaryWithFilter'
import { getSumFromEntries } from '../helpers/entriesHelper';
import { addOutcome, addIncome } from '../redux/actions';

import { Switch, Route, Link } from 'react-router-dom';

const dasahboardStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh'
};

class Dashboard extends Component {
  constructor(props) {
    super();
    this.onAddOutcome = props.onAddOutcome;
    this.onAddIncome = props.onAddIncome;

    this.categoryOptions = {
      outcome: [
        { name: 'Food', value: 'food' },
        { name: 'House', value: 'house' }
      ],
      income: [
        { name: 'Salary', value: 'salary' },
        { name: 'Loan', value: 'loan' }
      ]
    };
  }

  getEntryModel = (entryType) => {
    return { ammount: '', description: '', type: entryType, category: '' };
  }

  getEntryCategoryOption = (entryType) => {
    return this.categoryOptions[entryType];
  }

  getSum = entryType => {
    if (this.entries[entryType]) {
      const entries = this.entries[entryType];
      return getSumFromEntries(entries);
    }
  }

  render() {
    this.entries = this.props.entries;
    return (
      <div style={dasahboardStyle}>
        <Switch>
          <Route exact path={`${this.props.match.url}`}>
            <Link to={`${this.props.match.url}add-income`}>Add income</Link>
            <Results 
              incomes={this.getSum('incomes')} 
              outcomes={this.getSum('outcomes')}
              entries={this.entries}/>
            <Link to={`${this.props.match.url}add-expense`}>Add expense</Link>
          </Route>
          <Route path={`${this.props.match.url}add-income`}>
            <AddEntry entryType='income' handleEntry={this.onAddIncome} entryModel={this.getEntryModel('income')} categoryOptions={this.getEntryCategoryOption('income')}/>
          </Route>
          <Route path={`${this.props.match.url}add-expense`}>
            <AddEntry entryType='outcome' handleEntry={this.onAddOutcome} entryModel={this.getEntryModel('outcome')} categoryOptions={this.getEntryCategoryOption('outcome')}/>
          </Route>
          <Route path='/incomes'>
            <EntrySummaryWithFilter categoryOptions={this.getEntryCategoryOption('income')} entries={this.entries['incomes']} name='Incomes'/>
          </Route>
          <Route path='/outcomes'>
            <EntrySummaryWithFilter categoryOptions={this.getEntryCategoryOption('outcome')} entries={this.entries['outcomes']} name='Outcomes'/>
          </Route>
          <Route path='/summary'>
            <Summary entries={this.entries} />
          </Route>
        </Switch>
      </div>
    )
  }
}

const mapStateToProps = state => ({
  entries: state.expensesManager.entries
});

const mapActionsToProps = dispatch => ({
  onAddOutcome: expense => dispatch(addOutcome(expense)),
  onAddIncome: income => dispatch(addIncome(income))
});

Dashboard.propTypes = {
  entries: PropTypes.shape({
    incomes: PropTypes.arrayOf(
      PropTypes.shape({
        ammount: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        category: PropTypes.string.isRequired
      }).isRequired
    ).isRequired,
    outcomes: PropTypes.arrayOf(
      PropTypes.shape({
        ammount: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        category: PropTypes.string.isRequired
      }).isRequired
    ).isRequired
  }).isRequired
};

export default connect(mapStateToProps, mapActionsToProps)(Dashboard);
