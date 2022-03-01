import React, { Component } from 'react';
import CategorySelector from '../CategorySelector';
import { connect } from 'react-redux';
import { addIncome, addExpense } from '../../../../redux/expensesManager/actionCreators';
import { getEntryModel, getEntryCategoryOption } from '../../../../helpers/entriesHelper/entriesHelper';

import { withRouter } from 'react-router-dom';
import { getTimestampFromMonthAndYear } from '../../../../helpers/date';
import { Button, Form } from 'react-bootstrap';
import { FormButton, FormContent, InputNumber, InputText } from '../../Forms';
import { capitalize } from 'lodash';
import ContentTileSection from '../../ContentTitleSection';
import { MainContentContainer } from '../../MainContentContainer';

const getActionFromEntryType = ({ entryType, props }) => {
  const entryTypeToActionDictionary = {
    income: props['onAddIncome'],
    expense: props['onAddExpense']
  };

  return entryTypeToActionDictionary[entryType];
};

// TODO: Change this to a function component instead of a class component
class AddEntry extends Component {
  constructor(props) {
    super();
    this.state = getEntryModel({
      entryType: props.entryType,
      // TODO: Make sure the date calculation takes the hours and seconds into account
      timestamp: getTimestampFromMonthAndYear({
        month: props.selectedDate.month,
        year: props.selectedDate.year
      })
    });
  }

  handleInputChange = (event) => {
    const { value, name } = event.currentTarget;
    this.setState(() => {
      return { [name]: value }
    })
  }

  setCategory = (event) => {
    const { value } = event.currentTarget;
    this.setState(() => ({ categories_path: value }))
  }

  handleSubmit = (event, { handleEntry, history, selectedDate }) => {
    event.preventDefault();
    const entry = Object.assign({}, this.state);
    const digitMatcher = /^\d+(\.)*\d+$/;
    const amount = entry.amount;
    // TODO: review the validation for the missing category
    if (amount && digitMatcher.test(amount) && entry.categories_path !== '') {
      handleEntry({ entry, selectedDate });
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
      <MainContentContainer>
        <FormContent formProps={{
          onSubmit: event => this.handleSubmit(event, { handleEntry: handleEntry, history: this.props.history, selectedDate: this.props.selectedDate }),
          className: 'app-form'
        }}>
          {/* TODO: Add the selectedDate display here for letting the user know which year and month he is looking or working at */}
          <ContentTileSection>
            Add new {capitalize(this.props.entryType)}
          </ContentTileSection>
          <Form.Group>
            <InputNumber
              type='number'
              name='amount'
              placeholder={capitalize(this.props.entryType)}
              value={this.state.amount}
              onChange={this.handleInputChange}>
            </InputNumber>
          </Form.Group>
          <Form.Group>
            <InputText
              type='text'
              name='description'
              placeholder='Description'
              value={this.state.description}
              onChange={this.handleInputChange}>
            </InputText>
          </Form.Group>
          <Form.Group>
            <CategorySelector name='category' value={this.state.categories_path} handleChange={this.setCategory} categoryOptions={categoryOptions} />
          </Form.Group>
          <FormButton varian='primary' name='submit' type='submit'>
            Submit
          </FormButton>
          <Button block variant='secondary' className='vertical-standard-space' onClick={() => this.navigateToDashboard(this.props.history)}>Cancel</Button>
        </FormContent>
      </MainContentContainer>
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
