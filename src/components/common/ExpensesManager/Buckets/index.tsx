import React from "react";
import { MainContentContainer } from "../../MainContentContainer";
import { Bucket } from "./components/index";
import "./styles.scss";
import ContentTileSection from "../../ContentTitleSection.js";
import { Col, Row, Button, Container } from "react-bootstrap";
import { getMonthNameDisplay } from "../../../../helpers/date.js";
import {
  calculatePercentage,
  formatNumberForDisplay,
  getCarriedBucketsForMonth,
} from "../../../../helpers/entriesHelper/entriesHelper.js";
import { connect } from "react-redux";
import { withRouter, Link } from "react-router-dom";
import { NavigableMonthHeader } from "../../NavigableMonthHeader/index";
import emptyBucketsImage from "../../../../images/buckets-empty.png";

const Buckets = ({ selectedDate, entries, history, buckets }) => {
  const screenTitle = `${getMonthNameDisplay(selectedDate.month)} ${selectedDate.year}`;
  const hasBuckets = Object.keys(buckets).length > 0;

  /**
   * Carry-on buckets: each bucket's availability is the accumulation of its
   * allowance plus the remainder carried over from previous months. See
   * `getCarriedBucketsForMonth` for the recurrence.
   */
  const carriedBuckets = getCarriedBucketsForMonth({
    entries,
    buckets,
    selectedDate,
  });

  const monthlyBuckets = Object.keys(buckets)
    .map((bucketName) => {
      const { allowance, carryOver, availability, spending, remainder } =
        carriedBuckets[bucketName];
      // Availability can be zero or negative once debt is carried over, so we
      // guard the percentage calculation (it rejects a zero/undefined whole).
      const consuptionPercentage =
        availability > 0
          ? calculatePercentage(spending, availability)
          : spending > 0
            ? 100
            : 0;
      return {
        name: bucketName.toLowerCase(),
        label: bucketName,
        allowance,
        carryOver,
        availability,
        spending,
        remainder,
        consuptionPercentage,
      };
    })
    .sort((a, b) => {
      return b.consuptionPercentage - a.consuptionPercentage;
    });

  const totalBucketAllocation = Object.keys(buckets).reduce(
    (sum, bucketName) => (carriedBuckets[bucketName]?.allowance ?? 0) + sum,
    0
  );

  const handleGoBack = () => history.goBack();

  return (
    <MainContentContainer
      className="buckets-container"
      pageTitle="Monthly Buckets"
    >
      {hasBuckets ? (
        <>
          {/*@ts-expect-error temporarily ignore this typescript error */}
          <ContentTileSection title="Summary">
            {`${screenTitle} allocation: ${formatNumberForDisplay(totalBucketAllocation)}`}
          </ContentTileSection>
          <NavigableMonthHeader />
          {monthlyBuckets.map((bucket, index) => (
            <Bucket
              key={`bucket-${bucket.name}-${bucket.availability}-${bucket.spending}-${index}`}
              category={bucket.label}
              allowance={bucket.allowance}
              carryOver={bucket.carryOver}
              availability={bucket.availability}
              spending={bucket.spending}
              consuptionPercentage={bucket.consuptionPercentage}
            />
          ))}
        </>
      ) : (
        <Container fluid className="buckets-empty-state" data-testid="buckets-empty-state">
          <Row>
            <Col className="text-center">
              <img
                className="buckets-empty-state__image"
                src={emptyBucketsImage}
                alt="No buckets yet"
              />
              <h2 className="buckets-empty-state__title">No buckets yet</h2>
              <p className="buckets-empty-state__message">
                You haven&apos;t added any buckets. Add your first bucket to
                start tracking your monthly spending limits.
              </p>
            </Col>
          </Row>
        </Container>
      )}
      <Container fluid>
        <Row className="vertical-standard-space">
          <Col>
            <Link
              to="/add-bucket"
              className="btn btn-primary btn-block add-bucket-link"
            >
              Add new bucket
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
  entries: state.expensesManager.entries,
  buckets: state.expensesManager.buckets,
});

export default connect(mapStateToProps)(withRouter(Buckets));
