import React, { Component } from 'react';
import _ from 'lodash';
import Results from './Results';
import AddEntry from './AddEntry';
import EntriesSummary from './EntriesSummary';
import Summary from './Summary';

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
      return entries.reduce((total, entry) => {
        total = parseInt(total);
        total += parseInt(entry.ammount);
        return total;
      }, 0);
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
            <AddEntry entryType='income' handleEntry={this.addIncome} />
          </Route>
          <Route path={`${this.props.match.url}add-expense`}>
            <AddEntry entryType='outcome' handleEntry={this.addOutcome} />
          </Route>
          <Route path='/incomes'>
            <EntriesSummary entries={this.state.entries['incomes']} name='Incomes'/>
          </Route>
          <Route path='/outcomes'>
            <EntriesSummary entries={this.state.entries['outcomes']} name='Outcomes' />
          </Route>
          <Route path='/summary'>
            <Summary entries={this.state.entries} />
          </Route>
        </Switch>
      </div>
    )
  }
}

export default Dashboard;
