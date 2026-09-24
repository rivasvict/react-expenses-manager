// TODO: This file has no colocated unit test; it was edited, not created,
// by the EN/ES translations change. Tracked in:
// https://github.com/rivasvict/react-expenses-manager/issues/187
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
import {
  getActiveLimitForMonth,
  getBucketAllowanceValidationError,
  toYearMonth,
} from "../../../../helpers/entriesHelper/entriesHelper";
import { useTranslation } from "../../../../i18n";

const ALLOWANCE_MATCHER = /^-?\d*(\.)*\d+$/;

const EditBucket = ({ onGetBucket, onEditBucket, history, selectedDate }) => {
  const translator = useTranslation();
  const { t } = translator;
  const params = useParams();
  const { bucketName } = params;
  const [bucket, setBucket] = useState<{ name: string; value: number | "" }>({ name: "", value: 0 });
  const [error, setError] = useState<string | null>(null);

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
      pageTitle={t("editBucket.pageTitle", { name: bucket?.name })}
    >
      {/** @ts-ignore: React bootstrap's typing issue */}
      <FormContent
        formProps={{
          onSubmit: (event) => {
            event.preventDefault();

            const allowanceError = getBucketAllowanceValidationError(
              bucket.value,
              translator
            );
            if (allowanceError) {
              setError(allowanceError);
              return;
            }

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
                    <Form.Label htmlFor="bucket-amount">
                      {t("bucketForm.monthlyAllowance")}
                    </Form.Label>
                    <p className="field-hint">{t("editBucket.hint")}</p>
                    <InputNumber
                      type="number"
                      id="bucket-amount"
                      name="amount"
                      placeholder={t("bucketForm.amountPlaceholder")}
                      value={bucket?.value}
                      onChange={(event) => {
                        const value = event?.currentTarget?.value;
                        setError(null);
                        if (!value) {
                          setBucket({ name: bucket?.name, value: "" });
                          return;
                        }
                        if (ALLOWANCE_MATCHER.test(value)) {
                          setBucket({
                            name: bucket?.name,
                            value: parseFloat(value),
                          });
                        }
                      }}
                    ></InputNumber>
                  </Form.Group>
                  {error && (
                    <p className="edit-bucket-error text-danger" role="alert">
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
                    {t("common.submit")}
                  </FormButton>
                  <Button
                    variant="secondary"
                    className="vertical-standard-space"
                    onClick={history.goBack}
                  >
                    {t("common.cancel")}
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
