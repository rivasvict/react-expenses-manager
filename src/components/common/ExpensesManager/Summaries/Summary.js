import React, { Component } from 'react';
import ContentTileSection from '../../ContentTitleSection';
import { FormSelect } from '../../Forms';
import { capitalize } from 'lodash';
import { MainContentContainer } from '../../MainContentContainer';
import EntriesSummary from './EntriesSummary';
import { IconRemote } from '../../Icons';
import { formatNumberForDisplay } from '../../../../helpers/entriesHelper/entriesHelper';
import { getMonthNameDisplay } from '../../../../helpers/date';
import './Summary.scss';

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
      <MainContentContainer className='summary-container'>
        <ContentTileSection title='Summary'>
          {/** TODO: Make sure the totalization is done here */}
          {`${capitalize(getMonthNameDisplay(this.selectedDate.month))} `}<IconRemote inLine={true} />{` PEEENDINGNUMBER ${formatNumberForDisplay(22)}`}
        </ContentTileSection>
        {/* TODO: Add the selectedDate display here for letting the user know which year and month he is looking or working at */}
        <FormSelect name='filler' value={this.state.filter} onChange={this.handleChange} className='select-entry-type'>
          <option value=''>All incomes and expenses</option>
          <option value='incomes'>Incomes</option>
          <option value='expenses'>Expenses</option>
        </FormSelect>
        {this.getFilteredEntries(this.state.filter)}
      </MainContentContainer>
    )
  }
}

export default Summary;