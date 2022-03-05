import React, { Component } from 'react';
import ContentTileSection from '../../ContentTitleSection';
import { FormSelect } from '../../Forms';
import { capitalize } from 'lodash';
import { MainContentContainer } from '../../MainContentContainer';
import EntriesSummary from './EntriesSummary';
import { IconRemote } from '../../Icons';
import { formatNumberForDisplay, getSumFromEntries } from '../../../../helpers/entriesHelper/entriesHelper';
import { getMonthNameDisplay } from '../../../../helpers/date';
import './Summary.scss';

/**
 * TODO: Turn this into a functional component
 * 
 * TODO: Add a way to navigate through months from this view
 * 
 * TODO: Make sure expenses are shown as negative values
 */
class Summary extends Component {
  constructor(props) {
    super();
    this.selectedDate = props.selectedDate;
    this.state = {
      selectedEntries: this.getFilteredEntries({ props }),
      selectedEntriesSum: formatNumberForDisplay(getSumFromEntries(this.getEntriesToSum({ props })))
    }
  }

  handleChange = event => {
    const { value } = event.currentTarget;
    this.setState(() => {
      return {
        selectedEntries: this.getFilteredEntries({ filter: value }),
        selectedEntriesSum: formatNumberForDisplay(getSumFromEntries(this.getEntriesToSum({ filter: value })))
      }
    });
  }

  getEntriesToSum = ({ filter = '', props = this.props }) => {
    const datedEntries = this.getDatedEntries({ props });

    return datedEntries[filter] || [...datedEntries['incomes'], ...datedEntries['expenses']];
  };

  getDatedEntries = ({ props = this.props }) => {
    const selectedYear = this.selectedDate.year;
    const selectedMonth = this.selectedDate.month;
    const entries = props.entries;
    return entries[selectedYear][selectedMonth];
  };

  getFilteredEntries = ({ filter = '', props = this.props }) => {
    const datedEntries = this.getDatedEntries({ props });
    const entriesSummary = {
      incomes: <EntriesSummary entries={datedEntries['incomes']} name='Incomes' selectedDate={this.selectedDate} />,
      expenses: <EntriesSummary entries={datedEntries['expenses']} name='Expenses' selectedDate={this.selectedDate} />
    }
    
    return entriesSummary[filter] ||
      <React.Fragment>
        {entriesSummary['incomes']}
        {entriesSummary['expenses']}
      </React.Fragment>
  }

  render() {
    return (
      <MainContentContainer className='summary-container'>
        <ContentTileSection title='Summary'>
          {/** TODO: Make sure the totalization is done here */}
          {`${capitalize(getMonthNameDisplay(this.selectedDate.month))} `}<IconRemote inLine={true} />{` ${this.state.selectedEntriesSum}`}
        </ContentTileSection>
        {/* TODO: Add the selectedDate display here for letting the user know which year and month he is looking or working at */}
        <FormSelect name='filler' value={this.state.filter} onChange={this.handleChange} className='select-entry-type'>
          <option value=''>All incomes and expenses</option>
          <option value='incomes'>Incomes</option>
          <option value='expenses'>Expenses</option>
        </FormSelect>
        {this.state.selectedEntries}
      </MainContentContainer>
    )
  }
}

export default Summary;