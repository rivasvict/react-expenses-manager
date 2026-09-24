// TODO: This file has no colocated unit test; it was edited, not created,
// by the EN/ES translations change. Tracked in:
// https://github.com/rivasvict/react-expenses-manager/issues/187
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
import { useTranslation } from "../../../../i18n";

const Buckets = ({ selectedDate, entries, history, buckets }) => {
  const { t, language } = useTranslation();
  const screenTitle = `${getMonthNameDisplay(selectedDate.month, language)} ${selectedDate.year}`;
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
      // Availability can be zero or negative once debt is carried over. In
      // that case the debt itself (allowance - availability) already counts
      // as consumption against the allowance, on top of any new spending, so
      // the percentage is read as "how far past the 100% line" rather than
      // clamped to a fixed number (issue #155).
      const consuptionPercentage =
        availability > 0
          ? calculatePercentage(spending, availability)
          : 100 + calculatePercentage(spending - availability, allowance);
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
      pageTitle={t("buckets.pageTitle")}
    >
      {hasBuckets ? (
        <>
          <NavigableMonthHeader />
          {/*@ts-expect-error temporarily ignore this typescript error */}
          <ContentTileSection title={t("common.summary")}>
            {t("buckets.allocation", {
              month: screenTitle,
              amount: formatNumberForDisplay(totalBucketAllocation),
            })}
          </ContentTileSection>
          {monthlyBuckets.map((bucket, index) => (
            <Bucket
              key={`bucket-${bucket.name}-${bucket.availability}-${bucket.spending}-${index}`}
              category={bucket.label}
              allowance={bucket.allowance}
              carryOver={bucket.carryOver}
              spending={bucket.spending}
              remainder={bucket.remainder}
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
                alt={t("buckets.emptyTitle")}
              />
              <h2 className="buckets-empty-state__title">
                {t("buckets.emptyTitle")}
              </h2>
              <p className="buckets-empty-state__message">
                {t("buckets.emptyMessage")}
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
              {t("buckets.addNew")}
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
  entries: state.expensesManager.entries,
  buckets: state.expensesManager.buckets,
});

export default connect(mapStateToProps)(withRouter(Buckets));
