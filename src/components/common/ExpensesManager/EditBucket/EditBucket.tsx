import React, { useRef, useState } from "react";
import { connect } from "react-redux";
import { withRouter, useParams } from "react-router-dom";
import { MainContentContainer } from "../../MainContentContainer";
import { editBucket } from "../../../../redux/expensesManager/actionCreators";
import { Button, Col, Container, Row } from "react-bootstrap";
import {
  getBucketConsumptionPercentage,
  getCarriedBucketsForMonth,
} from "../../../../helpers/entriesHelper/entriesHelper";
import {
  BucketExpense,
  getAllBucketWeeks,
  getBucketWeeks,
  getElapsedDays,
  getExpectedSpending,
} from "../../../../helpers/bucketPace/bucketPace";
import { getStoredWeeklyView } from "../../../../helpers/weeklyView/weeklyView";
import { formatDayMonth } from "../../../../helpers/shortDate/shortDate";
import { getMonthNameDisplay } from "../../../../helpers/date.js";
import { useTranslation } from "../../../../i18n";
import BucketSummary from "./BucketSummary";
import BucketWeeks from "./BucketWeeks";
import NoExpenses from "./NoExpenses";
import PaceLineChart from "./PaceLineChart";
import WeekBarsChart from "./WeekBarsChart";
import AllowanceSheet from "./AllowanceSheet";
import "./styles.scss";

// The same slug the Buckets list links with.
const slugOf = (name: string) => name.toLowerCase().replace(/\s/g, "-");

/**
 * How a bucket stands this month and where its money went, with its monthly
 * allowance editable in a sheet (design/features/bucket-expenses/ui/decision.md).
 */
const EditBucket = ({ onEditBucket, history, selectedDate, buckets, entries }) => {
  const { t, language } = useTranslation();
  const { bucketName: slug } = useParams<{ bucketName: string }>();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const name = Object.keys(buckets).find((candidate) => slugOf(candidate) === slug);

  if (!name) return <MainContentContainer className="edit-bucket">{null}</MainContentContainer>;

  const { allowance, carryOver, availability, spending, remainder } =
    getCarriedBucketsForMonth({
      entries,
      buckets: { [name]: buckets[name] },
      selectedDate,
    })[name];
  const today = new Date();
  const monthName = getMonthNameDisplay(selectedDate.month, language);
  const monthLabel = `${monthName} ${selectedDate.year}`;
  const path = `,${name.toLowerCase()},`;
  const expenses = (entries?.[selectedDate.year]?.[selectedDate.month]?.expenses || [])
    .filter((entry) => entry.categories_path === path);
  const weeks = getBucketWeeks<BucketExpense>({ expenses, availability, selectedDate, today });
  const view = getStoredWeeklyView();
  const expected = getExpectedSpending({ availability, selectedDate, today });
  const expectedDate = formatDayMonth(
    new Date(
      selectedDate.year,
      selectedDate.month,
      getElapsedDays({ selectedDate, today }),
      12
    ).getTime(),
    language
  );

  const closeSheet = () => {
    setIsSheetOpen(false);
    editButtonRef.current?.focus();
  };

  return (
    <MainContentContainer
      className="edit-bucket"
      pageTitle={t("editBucket.pageTitle", { name })}
    >
      <BucketSummary
        monthLabel={monthLabel}
        percentage={getBucketConsumptionPercentage({ allowance, availability, spending })}
        spending={spending}
        remainder={remainder}
        availability={availability}
        allowance={allowance}
        carryOver={carryOver}
        expected={expected}
        expectedDate={expectedDate}
        editButtonRef={editButtonRef}
        onEdit={() => setIsSheetOpen(true)}
      >
        {weeks.length > 0 && view === "bars" && (
          <WeekBarsChart
            weeks={getAllBucketWeeks<BucketExpense>({ expenses, availability, selectedDate, today })}
            year={selectedDate.year}
            month={selectedDate.month}
            availability={availability}
          />
        )}
        {weeks.length > 0 && view === "line" && (
          <PaceLineChart
            expenses={expenses}
            availability={availability}
            selectedDate={selectedDate}
            today={today}
          />
        )}
      </BucketSummary>
      {weeks.length > 0 ? (
        <BucketWeeks
          weeks={weeks}
          year={selectedDate.year}
          month={selectedDate.month}
          bucketName={name}
          view={view}
        />
      ) : (
        <NoExpenses bucketName={name} monthLabel={monthLabel} />
      )}
      <Container fluid className="edit-bucket-footer">
        <Row className="vertical-standard-space">
          <Col>
            <Button variant="secondary" className="cancel" onClick={history.goBack}>
              {t("common.goBack")}
            </Button>
          </Col>
        </Row>
      </Container>
      {isSheetOpen && (
        <AllowanceSheet
          initialValue={allowance}
          onSave={(value) =>
            onEditBucket({ bucket: { [name]: value }, selectedDate })
          }
          onClose={closeSheet}
        />
      )}
    </MainContentContainer>
  );
};

const mapStateToProps = (state) => ({
  selectedDate: state.expensesManager.selectedDate,
  buckets: state.expensesManager.buckets,
  entries: state.expensesManager.entries,
});

const mapActionsToProps = (dispatch) => ({
  onEditBucket: ({ bucket, selectedDate }) =>
    dispatch(editBucket({ bucket, selectedDate })),
});

export default connect(mapStateToProps, mapActionsToProps)(withRouter(EditBucket));
