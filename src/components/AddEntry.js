import React, { Component } from 'react';
import CategorySelector from './CategorySelector';

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

class AddEntry extends Component {
  constructor(props) {
    super();
    this.state = props.entryModel;
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
    history.push('/');
  }

  render() {
    return (
      <div style={addEntryStyle}>
        Add new {this.props.entryType}
        <form>
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
          <CategorySelector name='category' value={this.state.category} handleChange={this.handleInputChange} categoryOptions={this.props.categoryOptions} />
          <button name='submit' onClick={event => this.handleSubmit(event, { handleEntry: this.props.handleEntry, history: this.props.history })}>Submit</button>
          <button onClick={() => this.navigateToDashboard(this.props.history)}>Cancel</button>
        </form>
      </div>
    )
  }
}

export default withRouter(AddEntry);
