import React, { Component } from 'react';
import EntriesSummary from './EntriesSummary';
import CategorySelector from '../CategorySelector';
import { connect } from 'react-redux';
import { categoryChange } from '../../../../redux/expensesManager/actionCreators';
import { getEntryCategoryOption } from '../../../../helpers/entriesHelper'; 

class EntrySummaryWithFilter extends Component {
  constructor(props) {
    super();

    this.onCategoryChange = props.onCategoryChange;
  }

  handleChange = (event) => {
    const { value } = event.currentTarget;
    this.onCategoryChange(value);
  }

  getFilteredEntriesByCategory = ({ category, entryNamePlural }) => {
    const entries = this.props.entries[entryNamePlural];
    return category.length ? entries.filter(entry => entry.category.name === category) : entries;
  };

  render() {
    const categoryOptions =getEntryCategoryOption(this.props.entryType);
    const entryNamePlural = `${this.props.entryType}s`;
    const name = entryNamePlural;
    return (
      <React.Fragment>
        <CategorySelector name='category' value={this.props.category} handleChange={this.handleChange.bind(this)} categoryOptions={categoryOptions} />
        <EntriesSummary entries={this.getFilteredEntriesByCategory({ category: this.props.category, entryNamePlural })} name={name} />
      </React.Fragment>
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