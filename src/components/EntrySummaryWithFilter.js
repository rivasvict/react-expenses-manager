import React, { Component } from 'react';
import EntriesSummary from './EntriesSummary';
import CategorySelector from './CategorySelector';

class EntrySummaryWithFilter extends Component {
  constructor(pros) {
    super();
    this.state = {
      category: ''
    }
  }

  handleChange = (event) => {
    const { value } = event.currentTarget;
    this.setState(() => {
      return {
        category: value
      }
    });
  }

  getFilteredEntriesByCategory = (category) => {
    return category.length ? this.props.entries.filter(entry => entry.category === category) : this.props.entries;
  };

  render() {
    return (
      <div>
        <CategorySelector name='category' value={this.state.category} handleChange={this.handleChange} categoryOptions={this.props.categoryOptions} />
        <EntriesSummary entries={this.getFilteredEntriesByCategory(this.state.category)} name={this.props.name} />
      </div>
    )
  }
}

export default EntrySummaryWithFilter;