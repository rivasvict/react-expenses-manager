import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { MainContentContainer } from "../../MainContentContainer";
import { useParams } from "react-router-dom/cjs/react-router-dom";
import {
  getBucket,
  editBucket,
} from "../../../../redux/expensesManager/actionCreators";
import { FormButton, FormContent, InputNumber } from "../../Forms";
import { Col, Form, Row, Button } from "react-bootstrap";

const EditBucket = ({ onGetBucket, onEditBucket, history }) => {
  const params = useParams();
  const { bucketName } = params;
  const [bucket, setBucket] = useState({ name: "", value: 0 });

  useEffect(() => {
    (async () => {
      /**
       * TODO: Define central expected type from the database
       */
      const bucketFromDb: Record<string, number> = await onGetBucket({
        bucketName,
      });
      /**
       * TODO: Temporary way to extract the value and name of the bucket
       * while I find a better way to structure buckets in the database
       **/
      const [name, value] = Object.entries(bucketFromDb)[0];
      setBucket({ name, value });
    })();
  }, []);

  const saveBucket = async (editedBucketValue) => {
    try {
      await onEditBucket({ bucket: editedBucketValue });
      history.goBack();
    } catch (error) {
      throw error;
    }
  };

  return (
    <MainContentContainer
      className="edit-bucket"
      pageTitle={`Edit bucket: ${bucket?.name}`}
    >
      {/** @ts-ignore: React bootstrap's typing issue */}
      <FormContent
        formProps={{
          onSubmit: (event) => {
            event.preventDefault();
            const editedBucket = { [bucket.name]: bucket.value };
            saveBucket(editedBucket);
            history.goBack();
          },
          className: "app-form",
        }}
        render={() => {
          return (
            <>
              <Row className="top-container container-fluid">
                <Col xs={12} className="top-content">
                  <Form.Group>
                    <InputNumber
                      type="number"
                      name="amount"
                      placeholder={`Insert bucket amount`}
                      value={bucket?.value}
                      onChange={(event) => {
                        const value = event?.currentTarget?.value;
                        const digitMatcher = /^\d*(\.)*\d+$/;
                        if (value && digitMatcher.test(value)) {
                          setBucket({
                            name: bucket?.name,
                            value: parseFloat(value),
                          });
                        }
                      }}
                    ></InputNumber>
                  </Form.Group>
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
                    onClick={history.goBack}
                  >
                    Cancel
                  </Button>
                </Col>
              </Row>
            </>
          );
        }}
      />
    </MainContentContainer>
  );
};

const mapStateToProps = (state) => ({ buckets: state.expensesManager.buckets });

const mapActionsToProps = (dispatch) => ({
  onGetBucket: ({ bucketName }) => dispatch(getBucket({ bucketName })),
  onEditBucket: ({ bucket }) => dispatch(editBucket({ bucket })),
});

export default connect(
  mapActionsToProps,
  mapActionsToProps
)(withRouter(EditBucket));
