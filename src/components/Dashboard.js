import React, { Component } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import Results from './Results';
import AddEntry from './AddEntry';
import Summary from './Summary';
import EntrySummaryWithFilter from './EntrySummaryWithFilter'
import { getSumFromEntries } from '../helpers/entriesHelper';

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
    this.state = {
      entries: {
        incomes: [],
        outcomes: []
      }
    }

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

  addIncome = ammount => {
    this.addEntry(ammount, 'incomes');
  };

  addOutcome = ammount => {
    this.addEntry(ammount, 'outcomes');
  }

  addEntry = (entry, entryType) => {
    this.setState(state => {
      const entriesToInsert = [...state.entries[entryType], entry];
      const newState = _.chain({}).merge(state).merge({entries: {[entryType]: entriesToInsert}}).value();
      return newState;
    });
  };

  getSum = entryType => {
    if (this.state.entries[entryType]) {
      const entries = this.state.entries[entryType];
      return getSumFromEntries(entries);
    }
  }

  render() {
    return (
      <div style={dasahboardStyle}>
        <Switch>
          <Route exact path={`${this.props.match.url}`}>
            <Link to={`${this.props.match.url}add-income`}>Add income</Link>
            <Results 
              incomes={this.getSum('incomes')} 
              outcomes={this.getSum('outcomes')}
              entries={this.state.entries}/>
            <Link to={`${this.props.match.url}add-expense`}>Add expense</Link>
          </Route>
          <Route path={`${this.props.match.url}add-income`}>
            <AddEntry entryType='income' handleEntry={this.addIncome} entryModel={this.getEntryModel('income')} categoryOptions={this.getEntryCategoryOption('income')}/>
          </Route>
          <Route path={`${this.props.match.url}add-expense`}>
            <AddEntry entryType='outcome' handleEntry={this.addOutcome} entryModel={this.getEntryModel('outcome')} categoryOptions={this.getEntryCategoryOption('outcome')}/>
          </Route>
          <Route path='/incomes'>
            <EntrySummaryWithFilter categoryOptions={this.getEntryCategoryOption('income')} entries={this.state.entries['incomes']} name='Incomes'/>
          </Route>
          <Route path='/outcomes'>
            <EntrySummaryWithFilter categoryOptions={this.getEntryCategoryOption('outcome')} entries={this.state.entries['outcomes']} name='Outcomes'/>
          </Route>
          <Route path='/summary'>
            <Summary entries={this.state.entries} />
          </Route>
        </Switch>
      </div>
    )
  }
}

const mapStateToProps = state => {
  return state;
};

export default connect(mapStateToProps)(Dashboard);
