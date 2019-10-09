import React, { Component } from 'react';
import _ from 'lodash';
import Results from './Results';
import AddEntry from './AddEntry';

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
    this.setState(state => {
      const incomes = [...state.entries.incomes, ammount];
      const newState = _.chain({}).merge(state).merge({entries: {incomes}}).value();
      return newState;
    });
  };

  getSum = entryType => {
    if (!this.state.entries[entryType]) {
      debugger;
    }
    const ammounts = this.state.entries[entryType];
    return ammounts.reduce((total, ammount) => {
      total = parseInt(total);
      total += parseInt(ammount);
      return total;
    }, 0);
  }

  render() {
    return (
      <div style={dasahboardStyle}>
        <Link to={`${this.props.match.url}add-income`}>Add income</Link>
        <Results 
          incomes={this.getSum('incomes')} 
          outcomes={this.getSum('outcomes')}/>
        <Link to={`${this.props.match.url}add-expense`}>Add expense</Link>
        <Switch>
          <Route path={`${this.props.match.url}add-income`}>
            <AddEntry entryType='income' handleEntry={this.addIncome} />
          </Route>
          <Route path={`${this.props.match.url}add-expense`}>
            <AddEntry entryType='outcome' />
          </Route>
        </Switch>
      </div>
    )
  }
}

export default Dashboard;
