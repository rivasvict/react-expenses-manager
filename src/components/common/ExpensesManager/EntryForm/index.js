import React, { Component } from "react";
import CategorySelector from "../CategorySelector";
import { getEntryCategoryOption } from "../../../../helpers/entriesHelper/entriesHelper";

import { Button, Form, Col, Row } from "react-bootstrap";
import "./styles.scss";
import { FormButton, FormContent, InputNumber, InputText } from "../../Forms";
import { capitalize } from "lodash";
import ContentTileSection from "../../ContentTitleSection";
import { MainContentContainer } from "../../MainContentContainer";

// TODO: Change this to a function component instead of a class component
class EntryForm extends Component {
  constructor(props) {
    super();
    // `isRecurring` drives the "fixed entry" toggle (issue #103). It is seeded
    // from the entry being edited (an already-fixed entry) or the `recurring`
    // prop, and defaults to off so the normal flow creates a one-off entry.
    this.state = {
      ...props.entry,
      isRecurring: Boolean(props.entry?.isFixed || props.recurring),
    };
  }

  handleInputChange = (event) => {
    const { value, name } = event.currentTarget;
    this.setState(() => {
      return { [name]: value };
    });
  };

  toggleRecurring = (event) => {
    const { checked } = event.currentTarget;
    this.setState(() => ({ isRecurring: checked }));
  };

  setCategory = (event) => {
    const { value } = event.currentTarget;
    this.setState(() => ({ categories_path: value }));
  };

  render() {
    const entryNameForDisplay = capitalize(this.state.type);
    // Pass the user's buckets and standalone categories so newly created
    // expense categories become selectable here, whether or not they have a
    // bucket (spending limit) yet (issue #100).
    const categoryOptions = getEntryCategoryOption(
      this.state.type,
      this.props.buckets,
      this.props.unbudgetedCategories
    );
    const operationTitle = this.props.operationTitle
      ? `${this.props.operationTitle} `
      : "";
    const title = `${operationTitle}${entryNameForDisplay}`;

    return (
      <MainContentContainer pageTitle={`${entryNameForDisplay} entry`}>
        <ContentTileSection className={`entry-form-heading entry-form-heading--${this.state.type}`}>
          {title}
        </ContentTileSection>
        <FormContent
          formProps={{
            onSubmit: (event) =>
              this.props.handleSubmit(event, {
                entryToAdd: this.state,
                isRecurring: this.state.isRecurring,
              }),
            className: "app-form",
          }}
        >
          <Row className="top-container container-fluid">
            <Col xs={12} className="top-content">
              <Form.Group>
                <Form.Label htmlFor="entry-amount">Amount</Form.Label>
                <InputNumber
                  type="number"
                  id="entry-amount"
                  name="amount"
                  placeholder={`Insert ${capitalize(this.state.type)} amount`}
                  value={this.state.amount}
                  onChange={this.handleInputChange}
                ></InputNumber>
              </Form.Group>
              <Form.Group className="vertical-standard-space">
                <Form.Label htmlFor="entry-description">
                  Description <span className="optional-hint">(optional)</span>
                </Form.Label>
                <InputText
                  type="text"
                  id="entry-description"
                  name="description"
                  placeholder="Description"
                  value={this.state.description}
                  onChange={this.handleInputChange}
                ></InputText>
              </Form.Group>
              <Form.Group className="vertical-standard-space">
                <Form.Label htmlFor="entry-category">Category</Form.Label>
                <CategorySelector
                  id="entry-category"
                  name="categories"
                  value={this.state.categories_path}
                  handleChange={this.setCategory}
                  categoryOptions={categoryOptions}
                  emptyOptionLabel="Select a category"
                />
              </Form.Group>
              {this.props.allowRecurring && (
                <Form.Group className="vertical-standard-space recurring-toggle-row d-flex justify-content-between align-items-center">
                  <Form.Label className="mb-0" htmlFor="entry-recurring-switch">
                    Recurring (applies every month)
                  </Form.Label>
                  <Form.Check
                    type="switch"
                    id="entry-recurring-switch"
                    name="isRecurring"
                    label=""
                    checked={Boolean(this.state.isRecurring)}
                    onChange={this.toggleRecurring}
                    className="recurring-switch"
                  />
                </Form.Group>
              )}
            </Col>
          </Row>
          <Row className="bottom-container container-fluid vertical-standard-space">
            <Col xs={12} className="bottom-content">
              <FormButton
                variant="primary"
                name="submit"
                type="submit"
                className="vertical-standard-space"
              >
                Submit
              </FormButton>
              <Button
                variant="secondary"
                className="vertical-standard-space"
                onClick={() => this.props.onCancel()}
              >
                Cancel
              </Button>
              {this.props.handleEntryRemoval && (
                <Button
                  variant="danger"
                  className="vertical-standard-space"
                  onClick={() =>
                    this.props.handleEntryRemoval({ entryId: this.state.id })
                  }
                >
                  Remove entry
                </Button>
              )}
            </Col>
          </Row>
        </FormContent>
      </MainContentContainer>
    );
  }
}

export default EntryForm;
