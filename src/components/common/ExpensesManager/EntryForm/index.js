import React, { Component } from "react";
import CategorySelector from "../CategorySelector";
import { connect } from "react-redux";
import {
  addIncome,
  addExpense,
} from "../../../../redux/expensesManager/actionCreators";
import { getEntryCategoryOption } from "../../../../helpers/entriesHelper/entriesHelper";

import { withRouter } from "react-router-dom";
import { Button, Form, Col, Row } from "react-bootstrap";
import { FormButton, FormContent, InputNumber, InputText } from "../../Forms";
import { capitalize } from "lodash";
import ContentTileSection from "../../ContentTitleSection";
import { MainContentContainer } from "../../MainContentContainer";

const getActionFromEntryType = ({ entryType, props }) => {
  const entryTypeToActionDictionary = {
    income: props["onAddIncome"],
    expense: props["onAddExpense"],
  };

  return entryTypeToActionDictionary[entryType];
};

// TODO: Change this to a function component instead of a class component
class EntryForm extends Component {
  constructor(props) {
    super();
    this.state = props.entry;
  }

  handleInputChange = (event) => {
    const { value, name } = event.currentTarget;
    this.setState(() => {
      return { [name]: value };
    });
  };

  setCategory = (event) => {
    const { value } = event.currentTarget;
    this.setState(() => ({ categories_path: value }));
  };

  handleSubmit = (event, { handleEntry, history, selectedDate }) => {
    event.preventDefault();
    const entry = Object.assign({}, this.state);
    const digitMatcher = /^\d*(\.)*\d+$/;
    const amount = entry.amount;
    // TODO: review the validation for the missing category
    if (amount && digitMatcher.test(amount) && entry.categories_path !== "") {
      handleEntry({ entry, selectedDate });
      this.navigateToDashboard(history);
    }
  };

  /* TODO: Use back history navigation instead of a specific route for cancel action */
  navigateToDashboard = (history) => {
    history.push("/dashboard");
  };

  render() {
    const handleEntry = getActionFromEntryType({
      entryType: this.state.type,
      props: this.props,
    });
    const categoryOptions = getEntryCategoryOption(this.state.type);

    return (
      <MainContentContainer>
        <ContentTileSection>
          Add new {capitalize(this.props.type)}
        </ContentTileSection>
        <FormContent
          formProps={{
            onSubmit: (event) =>
              this.handleSubmit(event, {
                handleEntry,
                history: this.props.history,
                selectedDate: this.props.selectedDate,
              }),
            className: "app-form",
          }}
        >
          <Row className="top-container container-fluid">
            <Col xs={12} className="top-content">
              <Form.Group>
                <InputNumber
                  type="number"
                  name="amount"
                  placeholder={capitalize(this.props.type)}
                  value={this.state.amount}
                  onChange={this.handleInputChange}
                ></InputNumber>
              </Form.Group>
              <Form.Group>
                <InputText
                  type="text"
                  name="description"
                  placeholder="Description"
                  value={this.state.description}
                  onChange={this.handleInputChange}
                  className="vertical-standard-space"
                ></InputText>
              </Form.Group>
              <Form.Group>
                <CategorySelector
                  name="category"
                  value={this.state.categories_path}
                  handleChange={this.setCategory}
                  categoryOptions={categoryOptions}
                  className="vertical-standard-space"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="bottom-container container-fluid vertical-standard-space">
            <Col xs={12} className="bottom-content">
              <FormButton variant="primary" name="submit" type="submit">
                Submit
              </FormButton>
              {/* TODO: Use back history navigation instead of a specific route for cancel action */}
              <Button
                variant="secondary"
                className="vertical-standard-space"
                onClick={() => this.navigateToDashboard(this.props.history)}
              >
                Cancel
              </Button>
            </Col>
          </Row>
        </FormContent>
      </MainContentContainer>
    );
  }
}

const mapStateToProps = (state) => ({});

const mapActionToProps = (dispatch) => ({
  onAddIncome: (income) => dispatch(addIncome(income)),
  onAddExpense: (expense) => dispatch(addExpense(expense)),
});

export default connect(
  mapStateToProps,
  mapActionToProps
)(withRouter(EntryForm));
