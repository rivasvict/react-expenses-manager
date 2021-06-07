import React, { Component } from 'react';
import EntriesSummary from './EntriesSummary';

class Summary extends Component {
  constructor() {
    super();
    this.state = { filter: '' }
  }

  handleChange = event => {
    const { value } = event.currentTarget;
    this.setState(() => {
      return { filter: value }
    });
  }

  getFilteredEntries = filter => {
    const entriesSummary = {
      incomes: <EntriesSummary entries={this.props.entries['incomes']} name='Incomes' />,
      expenses: <EntriesSummary entries={this.props.entries['expenses']} name='Expenses' />
    }
    
    return entriesSummary[filter] || <EntriesSummary entries={[...this.props.entries.incomes, ...this.props.entries.expenses]} name='Summary' />
  }

  render() {
    return (
      <div>
        <form>
          <select name='filter' value={this.state.filter} onChange={this.handleChange}>
            <option value=''>All incomes and expenses</option>
            <option value='incomes'>Incomes</option>
            <option value='expenses'>Expenses</option>
          </select>
        </form>
        {this.getFilteredEntries(this.state.filter)}
      </div>
    )
  }
}

export default Summary;