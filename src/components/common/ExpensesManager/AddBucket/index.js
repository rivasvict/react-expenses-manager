// TODO: This file has no colocated unit test; it was edited, not created,
// by the EN/ES translations change. Tracked in:
// https://github.com/rivasvict/react-expenses-manager/issues/187
import React, { useState } from "react";
import { connect } from "react-redux";
import { withRouter, Link } from "react-router-dom";
import { Col, Form, Row, Button } from "react-bootstrap";
import { MainContentContainer } from "../../MainContentContainer";
import { FormButton, FormContent, InputNumber } from "../../Forms";
import CategorySearchSelect from "../../CategorySearchSelect";
import ContentTileSection from "../../ContentTitleSection";
import { addBucket } from "../../../../redux/expensesManager/actionCreators";
import {
  getBucketValidationError,
  getBucketAllowanceValidationError,
  getUnbudgetedCategories,
} from "../../../../helpers/entriesHelper/entriesHelper";
import { Trans, useTranslation } from "../../../../i18n";

const BUCKETS_ROUTE = "/buckets";

/**
 * Lets the user set a spending limit (bucket) for an existing category
 * (issue #100). Categories are created separately, in their own context (see
 * AddCategory); this form only lists the categories that do not have a
 * bucket yet, since a category needs to exist before it can get one.
 */
const AddBucket = ({ buckets, unbudgetedCategories, onAddBucket, history }) => {
  const translator = useTranslation();
  const { t } = translator;
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

    const categoryError = getBucketValidationError(
      { categoryName, buckets },
      translator
    );
    if (categoryError) {
      setError(categoryError);
      return;
    }

    const allowanceError = getBucketAllowanceValidationError(
      allowance,
      translator
    );
    if (allowanceError) {
      setError(allowanceError);
      return;
    }

    try {
      await onAddBucket({
        bucket: { [categoryName]: parseFloat(allowance) },
      });
      goToBuckets();
    } catch (submitError) {
      // The storage layer rejects duplicates/invalid names; surface the reason.
      setError(submitError.message || t("addBucket.createFailed"));
    }
  };

  return (
    <MainContentContainer
      className="add-bucket"
      pageTitle={t("addBucket.pageTitle")}
    >
      <ContentTileSection>{t("buckets.addNew")}</ContentTileSection>
      {categoriesWithoutBucket.length === 0 ? (
        <p className="add-bucket-no-categories">
          <Trans
            i18nKey="addBucket.noCategories"
            components={{
              link: (label) => <Link to="/add-category">{label}</Link>,
            }}
          />
        </p>
      ) : (
      <FormContent
        formProps={{ onSubmit: handleSubmit, className: "app-form" }}
        render={() => (
          <>
            <Row className="top-container container-fluid">
              <Col xs={12} className="top-content">
                <Form.Group>
                  <Form.Label htmlFor="categoryName" id="categoryName-label">
                    {t("entryForm.category")}
                  </Form.Label>
                  <p className="field-hint">{t("addBucket.categoryHint")}</p>
                  <CategorySearchSelect
                    id="categoryName"
                    name="categoryName"
                    value={categoryName}
                    emptyOptionLabel={t("entryForm.selectCategory")}
                    options={categoriesWithoutBucket.map((category) => ({
                      value: category,
                      label: category,
                    }))}
                    onChange={(newCategoryName) => {
                      setCategoryName(newCategoryName);
                      setError(null);
                    }}
                  />
                </Form.Group>
                <Form.Group className="vertical-standard-space">
                  <Form.Label htmlFor="bucket-allowance">
                    {t("bucketForm.monthlyAllowance")}
                  </Form.Label>
                  <InputNumber
                    type="number"
                    id="bucket-allowance"
                    name="allowance"
                    placeholder={t("addBucket.allowancePlaceholder")}
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
                  {t("common.submit")}
                </FormButton>
                <Button
                  variant="secondary"
                  className="vertical-standard-space"
                  onClick={goToBuckets}
                >
                  {t("common.cancel")}
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
