import React, { Component } from 'react';
import EntriesSummary from './EntriesSummary';
import CategorySelector from './CategorySelector';
import { connect } from 'react-redux';
import { categoryChange } from '../redux/actions/index';

class EntrySummaryWithFilter extends Component {
  constructor(props) {
    super();

    this.onCategoryChange = props.onCategoryChange;
  }

  handleChange = (event) => {
    const { value } = event.currentTarget;
    this.onCategoryChange(value);
  }

  getFilteredEntriesByCategory = (category) => {
    return category.length ? this.props.entries.filter(entry => entry.category === category) : this.props.entries;
  };

  render() {
    return (
      <div>
        <CategorySelector name='category' value={this.props.category} handleChange={this.handleChange.bind(this)} categoryOptions={this.props.categoryOptions} />
        <EntriesSummary entries={this.getFilteredEntriesByCategory(this.props.category)} name={this.props.name} />
      </div>
    )
  }
}

const mapStateToProps = state => ({
  category: state.expensesManager.category
});

const mapActionsToProps = dispatch => ({
  onCategoryChange: event => dispatch(categoryChange(event))
});

export default connect(mapStateToProps, mapActionsToProps)(EntrySummaryWithFilter);