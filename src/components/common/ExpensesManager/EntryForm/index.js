// TODO: This file has no colocated unit test; it was edited, not created,
// by the EN/ES translations change. Tracked in:
// https://github.com/rivasvict/react-expenses-manager/issues/187
import React, { Component } from "react";
import CategorySelector from "../CategorySelector";
import { getEntryCategoryOption } from "../../../../helpers/entriesHelper/entriesHelper";

import { Button, Form, Col, Row } from "react-bootstrap";
import "./styles.scss";
import { FormButton, FormContent, InputNumber, InputText } from "../../Forms";
import ContentTileSection from "../../ContentTitleSection";
import { MainContentContainer } from "../../MainContentContainer";
import { withTranslation } from "../../../../i18n";

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
    const { t } = this.props;
    const entryType = this.state.type;
    // Pass the user's buckets and standalone categories so newly created
    // expense categories become selectable here, whether or not they have a
    // bucket (spending limit) yet (issue #100).
    const categoryOptions = getEntryCategoryOption(
      this.state.type,
      this.props.buckets,
      this.props.unbudgetedCategories
    );
    // `operation` is "add" | "edit"; the full phrase is one key per
    // combination so each language can order and inflect it naturally.
    const title = t(`entryForm.heading.${this.props.operation}.${entryType}`);

    return (
      <MainContentContainer pageTitle={t(`entryForm.pageTitle.${entryType}`)}>
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
                <Form.Label htmlFor="entry-amount">
                  {t("entryForm.amount")}
                </Form.Label>
                <InputNumber
                  type="number"
                  id="entry-amount"
                  name="amount"
                  placeholder={t(`entryForm.amountPlaceholder.${entryType}`)}
                  value={this.state.amount}
                  onChange={this.handleInputChange}
                ></InputNumber>
              </Form.Group>
              <Form.Group className="vertical-standard-space">
                <Form.Label htmlFor="entry-description">
                  {t("entryForm.description")}{" "}
                  <span className="optional-hint">
                    {t("entryForm.optional")}
                  </span>
                </Form.Label>
                <InputText
                  type="text"
                  id="entry-description"
                  name="description"
                  placeholder={t("entryForm.description")}
                  value={this.state.description}
                  onChange={this.handleInputChange}
                ></InputText>
              </Form.Group>
              <Form.Group className="vertical-standard-space">
                <Form.Label htmlFor="entry-category" id="entry-category-label">
                  {t("entryForm.category")}
                </Form.Label>
                <CategorySelector
                  id="entry-category"
                  name="categories"
                  value={this.state.categories_path}
                  handleChange={this.setCategory}
                  categoryOptions={categoryOptions}
                  emptyOptionLabel={t("entryForm.selectCategory")}
                />
              </Form.Group>
              {this.props.allowRecurring && (
                <Form.Group className="vertical-standard-space recurring-toggle-row d-flex justify-content-between align-items-center">
                  <Form.Label className="mb-0" htmlFor="entry-recurring-switch">
                    {t("entryForm.recurring")}
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
                {t("common.submit")}
              </FormButton>
              <Button
                variant="secondary"
                className="vertical-standard-space"
                onClick={() => this.props.onCancel()}
              >
                {t("common.cancel")}
              </Button>
              {this.props.handleEntryRemoval && (
                <Button
                  variant="danger"
                  className="vertical-standard-space"
                  onClick={() =>
                    this.props.handleEntryRemoval({ entryId: this.state.id })
                  }
                >
                  {t("entryForm.remove")}
                </Button>
              )}
            </Col>
          </Row>
        </FormContent>
      </MainContentContainer>
    );
  }
}

export default withTranslation(EntryForm);
