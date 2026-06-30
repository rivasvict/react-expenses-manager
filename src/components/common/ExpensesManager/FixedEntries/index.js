import React from "react";
import { connect } from "react-redux";
import { withRouter, Link } from "react-router-dom";
import { Button, Col, Container, Row } from "react-bootstrap";
import { MainContentContainer } from "../../MainContentContainer";
import ContentTileSection from "../../ContentTitleSection";
import { NavigableMonthHeader } from "../../NavigableMonthHeader/index";
import EntriesSummary from "../Summaries/EntriesSummary";
import { getMonthNameDisplay } from "../../../../helpers/date";
import { ENTRY_TYPES_PLURAL } from "../../../../constants";
import "./styles.scss";

const getFixedOfType = (monthEntries, plural) =>
  (monthEntries?.[plural] || []).filter((entry) => entry.isFixed);

/**
 * Lists the recurring (fixed) incomes and expenses that apply to the viewed
 * month (issue #103), reusing the same row component as the regular monthly
 * summaries. Each row links to the shared edit screen, where changes apply from
 * the viewed month forward. New recurring entries are created from the normal
 * Add Income / Add Expense forms via the "Recurring" toggle.
 */
const FixedEntries = ({ entries, selectedDate, history }) => {
  const monthEntries = entries?.[selectedDate.year]?.[selectedDate.month] || {
    incomes: [],
    expenses: [],
  };
  const fixedIncomes = getFixedOfType(monthEntries, ENTRY_TYPES_PLURAL.INCOMES);
  const fixedExpenses = getFixedOfType(
    monthEntries,
    ENTRY_TYPES_PLURAL.EXPENSES
  );
  const hasAny = fixedIncomes.length > 0 || fixedExpenses.length > 0;
  const monthLabel = `${getMonthNameDisplay(selectedDate.month)} ${selectedDate.year}`;

  return (
    <MainContentContainer
      className="fixed-entries-container"
      pageTitle="Fixed entries"
    >
      {/*@ts-expect-error temporarily ignore this typescript error */}
      <ContentTileSection title="Fixed entries">
        {`Recurring incomes and expenses applying to ${monthLabel}`}
      </ContentTileSection>
      <NavigableMonthHeader />

      {hasAny ? (
        <>
          {fixedIncomes.length > 0 && (
            <EntriesSummary
              entries={fixedIncomes}
              name="incomes"
              entryType="income"
            />
          )}
          {fixedExpenses.length > 0 && (
            <EntriesSummary
              entries={fixedExpenses}
              name="expenses"
              entryType="expense"
            />
          )}
        </>
      ) : (
        <p className="fixed-entries-empty text-muted">
          No recurring entries apply to this month yet. Add one from Add Income
          or Add Expense and switch on “Recurring”.
        </p>
      )}

      <Container fluid>
        <Row className="vertical-standard-space">
          <Col>
            <Link
              to="/add-income"
              className="btn btn-primary btn-block add-fixed-income-link"
            >
              Add Income
            </Link>
          </Col>
        </Row>
        <Row className="vertical-standard-space">
          <Col>
            <Link
              to="/add-expense"
              className="btn btn-secondary btn-block add-fixed-expense-link"
            >
              Add Expense
            </Link>
          </Col>
        </Row>
        <Row className="vertical-standard-space">
          <Col>
            <Button
              type="button"
              variant="secondary"
              onClick={() => history.goBack()}
              className="cancel btn-block"
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
  selectedDate: state.expensesManager.selectedDate,
});

export default connect(mapStateToProps)(withRouter(FixedEntries));
