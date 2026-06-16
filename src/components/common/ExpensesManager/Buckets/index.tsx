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
import { withRouter } from "react-router-dom";
import { NavigableMonthHeader } from "../../NavigableMonthHeader/index";

const Buckets = ({ selectedDate, entries, history, buckets }) => {
  const screenTitle = `${getMonthNameDisplay(selectedDate.month)} ${selectedDate.year}`;

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
    (sum, bucketName) => buckets[bucketName] + sum,
    0
  );

  const handleGoBack = () => history.goBack();

  return (
    <MainContentContainer
      className="buckets-container"
      pageTitle="Monthly Buckets"
    >
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
          remainder={bucket.remainder}
          consuptionPercentage={bucket.consuptionPercentage}
        />
      ))}
      <Container fluid>
        <Row>
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
