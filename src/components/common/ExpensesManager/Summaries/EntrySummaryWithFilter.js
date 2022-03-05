import React, { Component } from 'react';
import EntriesSummary from './EntriesSummary';
import CategorySelector from '../CategorySelector';
import { connect } from 'react-redux';
import { categoryChange } from '../../../../redux/expensesManager/actionCreators';
import { formatNumberForDisplay, getEntryCategoryOption, getSumFromEntries } from '../../../../helpers/entriesHelper/entriesHelper'; 
import { MainContentContainer } from '../../MainContentContainer';
import ContentTileSection from '../../ContentTitleSection';
import { IconRemote } from '../../Icons';
import { capitalize } from 'lodash';
import './EntrySummaryWithFilter.scss';

class EntrySummaryWithFilter extends Component {
  constructor(props) {
    super();

    this.onCategoryChange = props.onCategoryChange;
    this.selectedDate = props.selectedDate;
  }

  handleChange = (event) => {
    const { value } = event.currentTarget;
    this.onCategoryChange(value);
  }

  getFilteredEntriesByCategory = ({ category, entryNamePlural }) => {
    const selectedYear = this.selectedDate.year;
    const selectedMonth = this.selectedDate.month;
    const entries = this.props.entries[selectedYear][selectedMonth][entryNamePlural];
    return category.length ? entries.filter(entry => entry.categories_path.match(category)) : entries;
  };

  render() {
    const categoryOptions = getEntryCategoryOption(this.props.entryType);
    const entryNamePlural = `${this.props.entryType}s`;
    const name = entryNamePlural;
    const totalSum = getSumFromEntries(this.getFilteredEntriesByCategory({ category: this.props.category, entryNamePlural }));
    return (
      <MainContentContainer className='entry-summary-with-filter'>
        <ContentTileSection title='Summary'>
          {`${capitalize(entryNamePlural)} `}<IconRemote inLine={true} />{` ${formatNumberForDisplay(totalSum)}`}
        </ContentTileSection>
        {/* TODO: Add the selectedDate display here for letting the user know which year and month he is looking or working at */}
        <CategorySelector
          name='category'
          value={this.props.category}
          handleChange={this.handleChange.bind(this)}
          categoryOptions={categoryOptions}
          className='category-select'
        />
        <EntriesSummary entries={this.getFilteredEntriesByCategory({ category: this.props.category, entryNamePlural })} name={name} />
      </MainContentContainer>
    )
  }
}

const mapStateToProps = state => ({
  category: state.expensesManager.category,
  entries: state.expensesManager.entries
});

const mapActionsToProps = dispatch => ({
  onCategoryChange: event => dispatch(categoryChange(event))
});

export default connect(mapStateToProps, mapActionsToProps)(EntrySummaryWithFilter);