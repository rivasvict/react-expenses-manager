import React, { useState } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { Col, Form, Row, Button } from "react-bootstrap";
import { MainContentContainer } from "../../MainContentContainer";
import { FormButton, FormContent, InputText } from "../../Forms";
import ContentTileSection from "../../ContentTitleSection";
import { addCategory } from "../../../../redux/expensesManager/actionCreators";
import { getCategoryValidationError } from "../../../../helpers/entriesHelper/entriesHelper";

const CATEGORIES_ROUTE = "/categories";

/**
 * Lets the user create a brand new expense category on its own (issue #100).
 * A category created here has no spending limit yet; it is immediately
 * selectable when adding an expense, and shows up as an option when later
 * creating a bucket (see AddBucket).
 */
const AddCategory = ({ buckets, unbudgetedCategories, onAddCategory, history }) => {
  const [name, setName] = useState("");
  const [error, setError] = useState(null);

  const goToCategories = () => history.push(CATEGORIES_ROUTE);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nameError = getCategoryValidationError({
      name,
      buckets,
      unbudgetedCategories,
    });
    if (nameError) {
      setError(nameError);
      return;
    }

    try {
      await onAddCategory({ category: name.trim() });
      goToCategories();
    } catch (submitError) {
      setError(submitError.message || "The category could not be created");
    }
  };

  return (
    <MainContentContainer className="add-category" pageTitle="Categories">
      <ContentTileSection>Add new category</ContentTileSection>
      <FormContent
        formProps={{ onSubmit: handleSubmit, className: "app-form" }}
        render={() => (
          <>
            <Row className="top-container container-fluid">
              <Col xs={12} className="top-content">
                <Form.Group>
                  <Form.Label htmlFor="category-name">Name</Form.Label>
                  <p className="field-hint">
                    Categories group your expenses. You can add a spending
                    limit (bucket) to a category later.
                  </p>
                  <InputText
                    type="text"
                    id="category-name"
                    name="name"
                    placeholder="Category name"
                    value={name}
                    onChange={(event) => {
                      setName(event.currentTarget.value);
                      setError(null);
                    }}
                  />
                </Form.Group>
                {error && (
                  <p className="add-category-error text-danger" role="alert">
                    {error}
                  </p>
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
                  onClick={goToCategories}
                >
                  Cancel
                </Button>
              </Col>
            </Row>
          </>
        )}
      />
    </MainContentContainer>
  );
};

const mapStateToProps = (state) => ({
  buckets: state.expensesManager.buckets,
  unbudgetedCategories: state.expensesManager.unbudgetedCategories,
});

const mapActionsToProps = (dispatch) => ({
  onAddCategory: ({ category }) => dispatch(addCategory({ category })),
});

export default connect(
  mapStateToProps,
  mapActionsToProps
)(withRouter(AddCategory));
