import React, { useState } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { Col, Form, Row, Button } from "react-bootstrap";
import { MainContentContainer } from "../../MainContentContainer";
import { FormButton, FormContent, InputNumber, InputText } from "../../Forms";
import ContentTileSection from "../../ContentTitleSection";
import { addBucket } from "../../../../redux/expensesManager/actionCreators";
import { getBucketValidationError } from "../../../../helpers/entriesHelper/entriesHelper";

const DIGIT_MATCHER = /^\d*(\.)*\d+$/;
const BUCKETS_ROUTE = "/buckets";

/**
 * Lets the user create a brand new expense category together with its bucket
 * (issue #100). Because buckets are keyed 1:1 by their category name, creating
 * a bucket here is what makes a new expense category exist throughout the app.
 */
const AddBucket = ({ buckets, onAddBucket, history }) => {
  const [name, setName] = useState("");
  const [allowance, setAllowance] = useState("");
  const [error, setError] = useState(null);

  const goToBuckets = () => history.push(BUCKETS_ROUTE);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nameError = getBucketValidationError({ name, buckets });
    if (nameError) {
      setError(nameError);
      return;
    }

    if (!DIGIT_MATCHER.test(allowance)) {
      setError("Allowance must be a valid number");
      return;
    }

    try {
      await onAddBucket({
        bucket: { [name.trim()]: parseFloat(allowance) },
      });
      goToBuckets();
    } catch (submitError) {
      // The storage layer rejects duplicates/invalid names; surface the reason.
      setError(submitError.message || "The bucket could not be created");
    }
  };

  return (
    <MainContentContainer
      className="add-bucket"
      pageTitle="Operation: Add new bucket"
    >
      <ContentTileSection>Add new category bucket</ContentTileSection>
      <FormContent
        formProps={{ onSubmit: handleSubmit, className: "app-form" }}
        render={() => (
          <>
            <Row className="top-container container-fluid">
              <Col xs={12} className="top-content">
                <Form.Group>
                  <InputText
                    type="text"
                    name="name"
                    placeholder="Category name"
                    value={name}
                    onChange={(event) => {
                      setName(event.currentTarget.value);
                      setError(null);
                    }}
                  />
                </Form.Group>
                <Form.Group>
                  <InputNumber
                    type="number"
                    name="allowance"
                    placeholder="Insert bucket allowance"
                    value={allowance}
                    onChange={(event) => {
                      setAllowance(event.currentTarget.value);
                      setError(null);
                    }}
                    className="vertical-standard-space"
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
    </MainContentContainer>
  );
};

const mapStateToProps = (state) => ({
  buckets: state.expensesManager.buckets,
});

const mapActionsToProps = (dispatch) => ({
  onAddBucket: ({ bucket }) => dispatch(addBucket({ bucket })),
});

export default connect(mapStateToProps, mapActionsToProps)(withRouter(AddBucket));
