import React, { Component } from "react";
import CategorySelector from "../CategorySelector";
import { getEntryCategoryOption } from "../../../../helpers/entriesHelper/entriesHelper";

import { Button, Form, Col, Row } from "react-bootstrap";
import { FormButton, FormContent, InputNumber, InputText } from "../../Forms";
import { capitalize } from "lodash";
import ContentTileSection from "../../ContentTitleSection";
import { MainContentContainer } from "../../MainContentContainer";

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

  render() {
    const categoryOptions = getEntryCategoryOption(this.state.type);
    const operationTitle = this.props.operationTitle
      ? `${this.props.operationTitle} `
      : "";

    return (
      <MainContentContainer>
        <ContentTileSection>
          {`${operationTitle}${capitalize(this.state.type)}`}
        </ContentTileSection>
        <FormContent
          formProps={{
            onSubmit: (event) =>
              this.props.handleSubmit(event, {
                entryToAdd: this.state,
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
              {this.props.handleEntryRemoval && (
                <Button
                  variant="danger"
                  onClick={() =>
                    this.props.handleEntryRemoval({ entryId: this.state.id })
                  }
                >
                  REMOVE ENTRY
                </Button>
              )}
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
            </Col>
          </Row>
        </FormContent>
      </MainContentContainer>
    );
  }
}

export default EntryForm;
