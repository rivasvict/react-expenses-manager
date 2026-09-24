// TODO: This file has no colocated unit test; it was edited, not created,
// by the EN/ES translations change. Tracked in:
// https://github.com/rivasvict/react-expenses-manager/issues/187
import React from "react";
import { connect } from "react-redux";
import { withRouter, Link } from "react-router-dom";
import { Col, Container, ListGroup, Row, Button } from "react-bootstrap";
import { MainContentContainer } from "../../MainContentContainer";
import ContentTileSection from "../../ContentTitleSection";
import { getExpenseCategoryNames } from "../../../../helpers/entriesHelper/entriesHelper";
import { useTranslation } from "../../../../i18n";
import "./styles.scss";

/**
 * Lists every expense category (with or without a bucket) and lets the user
 * create a brand new one (issue #100/#71). Creating a category here does not
 * require a spending limit; buckets are created afterwards by picking from
 * the categories that do not have one yet (see AddBucket).
 */
const Categories = ({ buckets, unbudgetedCategories, history }) => {
  const { t } = useTranslation();
  const categoryNames = getExpenseCategoryNames(buckets, unbudgetedCategories);
  const handleGoBack = () => history.goBack();

  return (
    <MainContentContainer
      className="categories-container"
      pageTitle={t("categories.pageTitle")}
    >
      <ContentTileSection title={t("categories.pageTitle")}>
        {t("categories.subtitle")}
      </ContentTileSection>
      <ListGroup className="categories-list">
        {categoryNames.map((categoryName) => {
          const hasBucket = Object.keys(buckets || {}).some(
            (bucketName) => bucketName.toLowerCase() === categoryName.toLowerCase()
          );
          return (
            <ListGroup.Item
              key={categoryName}
              data-testid={`category-${categoryName.toLowerCase()}`}
              className={hasBucket ? "has-bucket" : ""}
            >
              {categoryName}
              {!hasBucket && (
                <span className="category-no-bucket text-muted">
                  {" "}
                  {t("categories.noBucket")}
                </span>
              )}
            </ListGroup.Item>
          );
        })}
      </ListGroup>
      <Container fluid>
        <Row className="vertical-standard-space">
          <Col>
            <Link
              to="/add-category"
              className="btn btn-primary btn-block add-category-link"
            >
              {t("categories.addNew")}
            </Link>
          </Col>
        </Row>
        <Row className="vertical-standard-space">
          <Col>
            <Button
              type="submit"
              variant="secondary"
              onClick={handleGoBack}
              className="cancel"
            >
              {t("common.goBack")}
            </Button>
          </Col>
        </Row>
      </Container>
    </MainContentContainer>
  );
};

const mapStateToProps = (state) => ({
  buckets: state.expensesManager.buckets,
  unbudgetedCategories: state.expensesManager.unbudgetedCategories,
});

export default connect(mapStateToProps)(withRouter(Categories));
