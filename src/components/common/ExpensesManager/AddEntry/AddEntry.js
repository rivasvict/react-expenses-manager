import React, { Component } from 'react';
import CategorySelector from '../CategorySelector';
import { connect } from 'react-redux';
import { addIncome, addExpense } from '../../../../redux/expensesManager/actionCreators';
import { getEntryModel, getEntryCategoryOption } from '../../../../helpers/entriesHelper'; 

import { withRouter } from 'react-router-dom';

const getActionFromEntryType = ({ entryType, props }) => {
  const entryTypeToActionDictionary = {
    income: props['onAddIncome'],
    expense: props['onAddExpense']
  };

  return entryTypeToActionDictionary[entryType];
};

class AddEntry extends Component {
  constructor(props) {
    super();
    this.state = getEntryModel(props.entryType);
  }

  handleInputChange = (event) => {
    const { value, name } = event.currentTarget;
    this.setState(() => {
      return { [name]: value }
    })
  }

  handleSubmit = (event, { handleEntry, history }) => {
    event.preventDefault();
    const entry = Object.assign({}, this.state);
    const digitMatcher = /^\d+$/;
    if (entry.amount && digitMatcher.test(entry.amount) && entry.category !== '') {
      handleEntry(entry);
      this.navigateToDashboard(history);
    }
  }

  navigateToDashboard = (history) => {
    history.push('/dashboard');
  }

  render() {
    const handleEntry = getActionFromEntryType({ entryType: this.props.entryType, props: this.props });
    const categoryOptions = getEntryCategoryOption(this.props.entryType);

    return (
      <React.Fragment>
        Add new {this.props.entryType}
        <input
          type='text'
          name='amount'
          placeholder={this.props.entryType}
          value={this.state.amount}
          onChange={this.handleInputChange}>
        </input>
        <input
          type='text'
          name='description'
          placeholder='description'
          value={this.state.description}
          onChange={this.handleInputChange}>
        </input>
        <CategorySelector name='category' value={this.state.category} handleChange={this.handleInputChange} categoryOptions={categoryOptions} />
        <button name='submit' onClick={event => this.handleSubmit(event, { handleEntry: handleEntry, history: this.props.history })}>Submit</button>
        <button onClick={() => this.navigateToDashboard(this.props.history)}>Cancel</button>
      </React.Fragment>
    )
  }
}

const mapStateToProps = state => ({
});

const mapActionToProps = dispatch => ({
  onAddIncome: income => dispatch(addIncome(income)),
  onAddExpense: expense => dispatch(addExpense(expense))
});

export default connect(mapStateToProps, mapActionToProps)(withRouter(AddEntry));
