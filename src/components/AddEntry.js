import React, { Component } from 'react';

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
    this.state = { ammount: '', description: '', type: props.entryType };
  }

  handleTextChange = (event) => {
    const { value, name } = event.currentTarget;
    this.setState(state => {
      return { [name]: value }
    })
  }

  handleSubmit = (event, { handleEntry, history }) => {
    event.preventDefault();
    const entry = Object.assign({}, this.state);
    const digitMatcher = /^\d+$/;
    if (entry.ammount && digitMatcher.test(entry.ammount)) {
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
            onChange={this.handleTextChange}>
          </input>
          <input
            type='text'
            name='description'
            placeholder='description'
            value={this.state.description}
            onChange={this.handleTextChange}>
          </input>
          <button onClick={event => this.handleSubmit(event, { handleEntry: this.props.handleEntry, history: this.props.history })}>Submit</button>
          <button onClick={() => this.navigateToDashboard(this.props.history)}>Cancel</button>
        </form>
      </div>
    )
  }
}

export default withRouter(AddEntry);
