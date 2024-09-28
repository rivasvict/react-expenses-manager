import React from "react";
import { MainContentContainer } from "../../MainContentContainer";
import { Bucket } from "./components/index.ts";
import "./styles.scss";
import ContentTileSection from "../../ContentTitleSection.js";
import { Col, Row, Button, Container } from "react-bootstrap";
import ScreenTitle from "../../ScreenTitle.js";
import { getMonthNameDisplay } from "../../../../helpers/date.js";
import {
  formatNumberForDisplay,
  getFilteredEntriesByCategory,
} from "../../../../helpers/entriesHelper/entriesHelper.js";
import { ENTRY_TYPES_PLURAL } from "../../../../constants.js";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
const bucketsMap = {
  "Eating out": 300,
  Alcohol: 150,
  "House stuff": 100,
  Beauty: 100,
  Transportation: 300,
  "Fun activities": 200,
  Unexpected: 300,
  Sports: 250,
  "Cathy bucket": 200,
  "Victor bucket": 200,
  Education: 86.45,
};

const Buckets = ({ selectedDate, entries, history }) => {
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
  const monthlyBuckets = Object.keys(bucketsMap)
    .map((bucketName) => ({
      name: bucketName.toLowerCase(),
      limit: bucketsMap[bucketName],
      currentValue:
        summarizedEntriesByCategory[`,${bucketName.toLowerCase()},`] || 0,
      label: bucketName,
    }))
    .sort((a, b) => {
      const aPercentage = (a.currentValue / a.limit) * 100;
      const bPercentage = (b.currentValue / b.limit) * 100;
      return bPercentage - aPercentage;
    });
  const totalBucketAllocation = Object.keys(bucketsMap).reduce(
    (sum, bucketName) => bucketsMap[bucketName] + sum,
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
      <Row className="month-header">
        <Col xs={3}>
          {true ? <Button onClick={() => {}}>Prev</Button> : null}
        </Col>
        <Col xs={6}>
          <ScreenTitle screenTitle={screenTitle} />
        </Col>
        <Col xs={3}>
          {true ? <Button onClick={() => {}}>Next</Button> : null}
        </Col>
      </Row>
      {monthlyBuckets.map((bucket) => (
        <Bucket
          category={bucket.label}
          limitAmount={bucket.limit}
          currentValue={bucket.currentValue}
        />
      ))}
      <Container fluid>
        <Row>
          <Col>
            <Button
              type="submit"
              variant="secondary"
              onClick={handleGoBack}
              className="full"
            >
              Go Back
            </Button>
          </Col>
        </Row>
      </Container>
    </MainContentContainer>
  );
};

// export default Buckets;

const mapStateToProps = (state) => ({
  // category: state.expensesManager.category,
  entries: state.expensesManager.entries,
});

const mapActionsToProps = (dispatch) => ({
  // onCategoryChange: (event) => dispatch(categoryChange(event)),
});

export default connect(mapStateToProps, mapActionsToProps)(withRouter(Buckets));
