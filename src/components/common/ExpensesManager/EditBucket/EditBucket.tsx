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
import { getActiveLimitForMonth, toYearMonth } from "../../../../helpers/entriesHelper/entriesHelper";

const EditBucket = ({ onGetBucket, onEditBucket, history, selectedDate }) => {
  const params = useParams();
  const { bucketName } = params;
  const [bucket, setBucket] = useState<{ name: string; value: number | "" }>({ name: "", value: 0 });

  useEffect(() => {
    (async () => {
      const bucketFromDb: Record<string, number | Array<{ from: string; limit: number }>> =
        await onGetBucket({ bucketName });
      const [name, bucketsHistory] = Object.entries(bucketFromDb)[0] as [
        string,
        number | Array<{ from: string; limit: number }>
      ];
      const yearMonth = toYearMonth(selectedDate.year, selectedDate.month);
      const value = getActiveLimitForMonth(bucketsHistory, yearMonth);
      setBucket({ name, value });
    })();
  }, [bucketName, onGetBucket, selectedDate]);

  const saveBucket = async (editedBucketValue) => {
    try {
      await onEditBucket({ bucket: editedBucketValue, selectedDate });
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
            const editedBucket = { [bucket.name]: Number(bucket.value) };
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
                        if (!value) {
                          setBucket({ name: bucket?.name, value: "" });
                          return;
                        }
                        const digitMatcher = /^\d*(\.)*\d+$/;
                        if (digitMatcher.test(value)) {
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

const mapStateToProps = (state) => ({
  selectedDate: state.expensesManager.selectedDate,
});

const mapActionsToProps = (dispatch) => ({
  onGetBucket: ({ bucketName }) => dispatch(getBucket({ bucketName })),
  onEditBucket: ({ bucket, selectedDate }) =>
    dispatch(editBucket({ bucket, selectedDate })),
});

export default connect(
  mapStateToProps,
  mapActionsToProps
)(withRouter(EditBucket));
