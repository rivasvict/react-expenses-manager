import React, { useState } from "react";
import { connect } from "react-redux";
import { withRouter, Link } from "react-router-dom";
import { Col, Form, Row, Button } from "react-bootstrap";
import { MainContentContainer } from "../../MainContentContainer";
import { FormButton, FormContent, FormSelect, InputNumber } from "../../Forms";
import ContentTileSection from "../../ContentTitleSection";
import { addBucket } from "../../../../redux/expensesManager/actionCreators";
import {
  getBucketValidationError,
  getUnbudgetedCategories,
} from "../../../../helpers/entriesHelper/entriesHelper";

const DIGIT_MATCHER = /^\d*(\.)*\d+$/;
const BUCKETS_ROUTE = "/buckets";

/**
 * Lets the user set a spending limit (bucket) for an existing category
 * (issue #100). Categories are created separately, in their own context (see
 * AddCategory); this form only lists the categories that do not have a
 * bucket yet, since a category needs to exist before it can get one.
 */
const AddBucket = ({ buckets, unbudgetedCategories, onAddBucket, history }) => {
  const categoriesWithoutBucket = getUnbudgetedCategories({
    buckets,
    unbudgetedCategories,
  });
  const [categoryName, setCategoryName] = useState("");
  const [allowance, setAllowance] = useState("");
  const [error, setError] = useState(null);

  const goToBuckets = () => history.push(BUCKETS_ROUTE);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const categoryError = getBucketValidationError({ categoryName, buckets });
    if (categoryError) {
      setError(categoryError);
      return;
    }

    if (!DIGIT_MATCHER.test(allowance)) {
      setError("Allowance must be a valid number");
      return;
    }

    try {
      await onAddBucket({
        bucket: { [categoryName]: parseFloat(allowance) },
      });
      goToBuckets();
    } catch (submitError) {
      // The storage layer rejects duplicates/invalid names; surface the reason.
      setError(submitError.message || "The bucket could not be created");
    }
  };

  return (
    <MainContentContainer className="add-bucket" pageTitle="Buckets">
      <ContentTileSection>Add new bucket</ContentTileSection>
      {categoriesWithoutBucket.length === 0 ? (
        <p className="add-bucket-no-categories">
          Every category already has a bucket. <Link to="/add-category">Add a new category</Link> first.
        </p>
      ) : (
      <FormContent
        formProps={{ onSubmit: handleSubmit, className: "app-form" }}
        render={() => (
          <>
            <Row className="top-container container-fluid">
              <Col xs={12} className="top-content">
                <Form.Group>
                  <Form.Label htmlFor="categoryName">Category</Form.Label>
                  <p className="field-hint">
                    Pick one of your existing categories to give it a monthly
                    spending limit.
                  </p>
                  <FormSelect
                    id="categoryName"
                    name="categoryName"
                    value={categoryName}
                    onChange={(event) => {
                      setCategoryName(event.currentTarget.value);
                      setError(null);
                    }}
                  >
                    <option value="">Select a category</option>
                    {categoriesWithoutBucket.map((category) => (
                      <option value={category} key={category}>
                        {category}
                      </option>
                    ))}
                  </FormSelect>
                </Form.Group>
                <Form.Group className="vertical-standard-space">
                  <Form.Label htmlFor="bucket-allowance">
                    Monthly allowance
                  </Form.Label>
                  <InputNumber
                    type="number"
                    id="bucket-allowance"
                    name="allowance"
                    placeholder="Insert bucket allowance"
                    value={allowance}
                    onChange={(event) => {
                      setAllowance(event.currentTarget.value);
                      setError(null);
                    }}
                  />
                </Form.Group>
                {error && (
                  <p className="add-bucket-error text-danger" role="alert">
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
                  onClick={goToBuckets}
                >
                  Cancel
                </Button>
              </Col>
            </Row>
          </>
        )}
      />
      )}
    </MainContentContainer>
  );
};

const mapStateToProps = (state) => ({
  buckets: state.expensesManager.buckets,
  unbudgetedCategories: state.expensesManager.unbudgetedCategories,
});

const mapActionsToProps = (dispatch) => ({
  onAddBucket: ({ bucket }) => dispatch(addBucket({ bucket })),
});

export default connect(mapStateToProps, mapActionsToProps)(withRouter(AddBucket));
