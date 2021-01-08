import React, { Component } from 'react';
import CategorySelector from '../CategorySelector';
import { connect } from 'react-redux';
import { addIncome, addOutcome } from '../../../../redux/expensesManager/actionCreators';
import { getEntryModel, getEntryCategoryOption } from '../../../../helpers/entriesHelper'; 

import { withRouter } from 'react-router-dom';

const addEntryStyle = {
  zIndex: '10000',
  backgroundColor: 'white',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'fixed',
  width: '100%',
  height: '100%'
};

const getActionFromEntryType = ({ entryType, props }) => {
  const entryTypeToActionDictionary = {
    income: props['onAddIncome'],
    outcome: props['onAddOutcome']
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
    if (entry.ammount && digitMatcher.test(entry.ammount) && entry.category !== '') {
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
      <div style={addEntryStyle}>
        Add new {this.props.entryType}
        <input
          type='text'
          name='ammount'
          placeholder={this.props.entryType}
          value={this.state.ammount}
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
      </div>
    )
  }
}

const mapStateToProps = state => ({
});

const mapActionToProps = dispatch => ({
  onAddIncome: income => dispatch(addIncome(income)),
  onAddOutcome: expense => dispatch(addOutcome(expense))
});

export default connect(mapStateToProps, mapActionToProps)(withRouter(AddEntry));
