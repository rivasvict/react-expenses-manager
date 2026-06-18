import React from "react";
import { connect } from "react-redux";
import { withRouter, Link } from "react-router-dom";
import { Col, Container, ListGroup, Row, Button } from "react-bootstrap";
import { MainContentContainer } from "../../MainContentContainer";
import ContentTileSection from "../../ContentTitleSection";
import { getExpenseCategoryNames } from "../../../../helpers/entriesHelper/entriesHelper";
import "./styles.scss";

/**
 * Lists every expense category (with or without a bucket) and lets the user
 * create a brand new one (issue #100/#71). Creating a category here does not
 * require a spending limit; buckets are created afterwards by picking from
 * the categories that do not have one yet (see AddBucket).
 */
const Categories = ({ buckets, categories, history }) => {
  const categoryNames = getExpenseCategoryNames(buckets, categories);
  const handleGoBack = () => history.goBack();

  return (
    <MainContentContainer className="categories-container" pageTitle="Categories">
      {/*@ts-expect-error temporarily ignore this typescript error */}
      <ContentTileSection title="Categories">
        Every expense category, with or without a bucket
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
            >
              {categoryName}
              {!hasBucket && (
                <span className="category-no-bucket text-muted"> (no bucket)</span>
              )}
            </ListGroup.Item>
          );
        })}
      </ListGroup>
      <Container fluid>
        <Row>
          <Col>
            <Link
              to="/add-category"
              className="btn btn-primary btn-block add-category-link"
            >
              Add new category
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
              Go Back
            </Button>
          </Col>
        </Row>
      </Container>
    </MainContentContainer>
  );
};

const mapStateToProps = (state) => ({
  buckets: state.expensesManager.buckets,
  categories: state.expensesManager.categories,
});

export default connect(mapStateToProps)(withRouter(Categories));
