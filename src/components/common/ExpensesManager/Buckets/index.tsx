import React from "react";
import { MainContentContainer } from "../../MainContentContainer";
import { Bucket } from "./components/index.ts";
import "./styles.scss";
import ContentTileSection from "../../ContentTitleSection.js";
import { Col, Row, Button, Container } from "react-bootstrap";
import { getMonthNameDisplay } from "../../../../helpers/date.js";
import {
  calculatePercentage,
  formatNumberForDisplay,
  getFilteredEntriesByCategory,
} from "../../../../helpers/entriesHelper/entriesHelper.js";
import { ENTRY_TYPES_PLURAL } from "../../../../constants.js";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { NavigableMonthHeader } from "../../NavigableMonthHeader/index.ts";

const Buckets = ({ selectedDate, entries, history, buckets }) => {
  const screenTitle = `${getMonthNameDisplay(selectedDate.month)} ${selectedDate.year}`;

  /**
   * TODO: Unify with https://github.com/rivasvict/react-expenses-manager/blob/9ff4df209c5927dba44c3bc1d71f7cc559df6525/src/components/common/ExpensesManager/Summaries/EntriesSummaryWithFilter/index.js#L43-L48
   */
  const entriesOfMonth = getFilteredEntriesByCategory({
    entries,
    selectedDate,
    category: "",
    entryTypePlural: ENTRY_TYPES_PLURAL.EXPENSES,
  });
  /**
   * TODO: Unify with https://github.com/rivasvict/react-expenses-manager/blob/9ff4df209c5927dba44c3bc1d71f7cc559df6525/src/components/common/ExpensesManager/Summaries/EntriesSummaryWithFilter/components/EntriesSummaryChart/index.js#L7-L17
   */
  const summarizedEntriesByCategory = entriesOfMonth.reduce(
    (summarizedEntries, entry) => {
      return {
        ...summarizedEntries,
        [entry.categories_path]: summarizedEntries[entry.categories_path]
          ? summarizedEntries[entry.categories_path] + parseFloat(entry.amount)
          : parseFloat(entry.amount),
      };
    },
    {}
  );

  /** TODO: Put into a separate util file */
  const monthlyBuckets = Object.keys(buckets)
    .map((bucketName) => {
      const limit = buckets[bucketName];
      const currentValue =
        summarizedEntriesByCategory[`,${bucketName.toLowerCase()},`] || 0;
      const consuptionPercentage = calculatePercentage(currentValue, limit);
      return {
        name: bucketName.toLowerCase(),
        limit: buckets[bucketName],
        currentValue:
          summarizedEntriesByCategory[`,${bucketName.toLowerCase()},`] || 0,
        label: bucketName,
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
          key={`bucket-${bucket.name}-${bucket.limit}-${bucket.currentValue}-${index}`}
          category={bucket.label}
          limitAmount={bucket.limit}
          currentValue={bucket.currentValue}
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
