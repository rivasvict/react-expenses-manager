import React, { Component } from 'react';
import EntriesSummary from './EntriesSummary';

class Summary extends Component {
  constructor(props) {
    super();
    this.state = { filter: '' }
    this.selectedDate = props.selectedDate;
  }

  handleChange = event => {
    const { value } = event.currentTarget;
    this.setState(() => {
      return { filter: value }
    });
  }

  getFilteredEntries = filter => {
    const selectedYear = this.selectedDate.year;
    const selectedMonth = this.selectedDate.month;
    const entries = this.props.entries;
    const datedEntries = entries[selectedYear][selectedMonth];
    const entriesSummary = {
      incomes: <EntriesSummary entries={datedEntries['incomes']} name='Incomes' selectedDate={this.selectedDate} />,
      expenses: <EntriesSummary entries={datedEntries['expenses']} name='Expenses' selectedDate={this.selectedDate} />
    }
    
    return entriesSummary[filter] || <EntriesSummary entries={[...datedEntries.incomes, ...datedEntries.expenses]} name='Summary' />
  }

  render() {
    return (
      <div>
        {/* TODO: Add the selectedDate display here for letting the user know which year and month he is looking or working at */}
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