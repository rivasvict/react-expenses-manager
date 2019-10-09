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
    this.state = { ammount: '' };
  }

  handleTextChange = (event) => {
    const value = event.currentTarget.value;
    this.setState(state => {
      return { ammount: value }
    })
  }

  handleSubmit = (event, { handleEntry, history }) => {
    event.preventDefault();
    const ammount = this.state.ammount;
    if (ammount) {
      handleEntry(ammount);
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
          <input type='text' placeholder={this.props.entryType} value={this.state.ammount} onChange={this.handleTextChange}></input>
          <button onClick={event => this.handleSubmit(event, { handleEntry: this.props.handleEntry, history: this.props.history })}>Submit</button>
          <button onClick={() => this.navigateToDashboard(this.props.history)}>Cancel</button>
        </form>
      </div>
    )
  }
}

export default withRouter(AddEntry);
