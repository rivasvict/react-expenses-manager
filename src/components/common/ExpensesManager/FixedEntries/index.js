import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { Button, Col, Container, Form, Row, Table } from "react-bootstrap";
import { MainContentContainer } from "../../MainContentContainer";
import ContentTileSection from "../../ContentTitleSection";
import { NavigableMonthHeader } from "../../NavigableMonthHeader/index";
import {
  setFixedEntry,
  removeFixedEntry,
} from "../../../../redux/expensesManager/actionCreators";
import {
  INCOME_CATEGORIES,
  getExpenseCategoryNames,
} from "../../../../helpers/entriesHelper/entriesHelper";
import { resolveFixedAmount } from "../../../../helpers/fixedEntriesHelper/fixedEntriesHelper";
import { getMonthKey, getMonthNameDisplay } from "../../../../helpers/date";
import { ENTRY_TYPES_SINGULAR } from "../../../../constants";
import "./styles.scss";

const slugify = (value) => value.toLowerCase().replace(/\s/g, "-");
const draftKey = (type, category) => `${type}::${category}`;

/**
 * Lets the user set, edit and remove fixed (recurring) incomes/expenses per
 * category (issue #103). Changes are made while viewing a month (the navigable
 * header) and take effect from that month forward — past months keep their
 * previous value. Removing a fixed entry behaves the same way (from the viewed
 * month forward).
 */
const FixedEntrySection = ({
  type,
  title,
  categories,
  fixedEntries,
  monthKey,
  drafts,
  onDraftChange,
  onSave,
  onRemove,
}) => (
  <>
    {/*@ts-expect-error temporarily ignore this typescript error */}
    <ContentTileSection title={title}>{title}</ContentTileSection>
    <Table responsive className={`fixed-entries-table fixed-entries-${type}`}>
      <thead>
        <tr>
          <th>Category</th>
          <th>Fixed amount</th>
          <th aria-label="actions" />
        </tr>
      </thead>
      <tbody>
        {categories.map((category) => {
          const slug = slugify(category);
          const resolved = resolveFixedAmount(
            fixedEntries?.[type]?.[category],
            monthKey
          );
          const key = draftKey(type, category);
          const draft = drafts[key];
          const inputValue =
            draft !== undefined ? draft : resolved === null ? "" : String(resolved);
          const hasFixed = resolved !== null;

          return (
            <tr key={key} data-testid={`fixed-${type}-${slug}`}>
              <td className="fixed-entries-category">{category}</td>
              <td>
                <Form.Control
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="No fixed amount"
                  aria-label={`Fixed ${type} amount for ${category}`}
                  data-testid={`fixed-input-${type}-${slug}`}
                  value={inputValue}
                  onChange={(event) =>
                    onDraftChange(key, event.currentTarget.value)
                  }
                />
              </td>
              <td className="fixed-entries-actions">
                <Button
                  size="sm"
                  variant="primary"
                  data-testid={`fixed-save-${type}-${slug}`}
                  onClick={() => onSave({ type, category })}
                >
                  Save
                </Button>{" "}
                <Button
                  size="sm"
                  variant="danger"
                  disabled={!hasFixed}
                  data-testid={`fixed-remove-${type}-${slug}`}
                  onClick={() => onRemove({ type, category })}
                >
                  Remove
                </Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  </>
);

const FixedEntries = ({
  selectedDate,
  fixedEntries,
  buckets,
  unbudgetedCategories,
  onSetFixedEntry,
  onRemoveFixedEntry,
  history,
}) => {
  const monthKey = getMonthKey(selectedDate);
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState(null);

  // When the viewed month changes, drop the in-progress edits so the inputs
  // reflect the amounts that are actually active for the newly selected month.
  useEffect(() => {
    setDrafts({});
    setError(null);
  }, [monthKey]);

  const incomeCategories = INCOME_CATEGORIES;
  const expenseCategories = getExpenseCategoryNames(buckets, unbudgetedCategories);

  const handleDraftChange = (key, value) => {
    setDrafts((current) => ({ ...current, [key]: value }));
    setError(null);
  };

  const clearDraft = (key) =>
    setDrafts((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });

  const handleSave = async ({ type, category }) => {
    const key = draftKey(type, category);
    const resolved = resolveFixedAmount(fixedEntries?.[type]?.[category], monthKey);
    const raw = drafts[key] !== undefined ? drafts[key] : resolved;
    const amount = Number(raw);

    if (raw === "" || raw === null || raw === undefined || Number.isNaN(amount)) {
      setError(`Please enter a valid amount for ${category}`);
      return;
    }
    if (amount < 0) {
      setError(`A fixed amount for ${category} cannot be negative`);
      return;
    }

    await onSetFixedEntry({ type, category, amount, from: monthKey });
    clearDraft(key);
  };

  const handleRemove = async ({ type, category }) => {
    await onRemoveFixedEntry({ type, category, from: monthKey });
    clearDraft(draftKey(type, category));
  };

  const monthLabel = `${getMonthNameDisplay(selectedDate.month)} ${selectedDate.year}`;

  return (
    <MainContentContainer
      className="fixed-entries-container"
      pageTitle="Fixed entries"
    >
      {/*@ts-expect-error temporarily ignore this typescript error */}
      <ContentTileSection title="Fixed entries">
        {`Recurring incomes and expenses applied from ${monthLabel} forward`}
      </ContentTileSection>
      <NavigableMonthHeader />
      {error && (
        <p className="fixed-entries-error text-danger" role="alert">
          {error}
        </p>
      )}
      <FixedEntrySection
        type={ENTRY_TYPES_SINGULAR.INCOME}
        title="Fixed incomes"
        categories={incomeCategories}
        fixedEntries={fixedEntries}
        monthKey={monthKey}
        drafts={drafts}
        onDraftChange={handleDraftChange}
        onSave={handleSave}
        onRemove={handleRemove}
      />
      <FixedEntrySection
        type={ENTRY_TYPES_SINGULAR.EXPENSE}
        title="Fixed expenses"
        categories={expenseCategories}
        fixedEntries={fixedEntries}
        monthKey={monthKey}
        drafts={drafts}
        onDraftChange={handleDraftChange}
        onSave={handleSave}
        onRemove={handleRemove}
      />
      <Container fluid>
        <Row className="vertical-standard-space">
          <Col>
            <Button
              type="button"
              variant="secondary"
              onClick={() => history.goBack()}
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
  selectedDate: state.expensesManager.selectedDate,
  fixedEntries: state.expensesManager.fixedEntries,
  buckets: state.expensesManager.buckets,
  unbudgetedCategories: state.expensesManager.unbudgetedCategories,
});

const mapActionsToProps = (dispatch) => ({
  onSetFixedEntry: ({ type, category, amount, from }) =>
    dispatch(setFixedEntry({ type, category, amount, from })),
  onRemoveFixedEntry: ({ type, category, from }) =>
    dispatch(removeFixedEntry({ type, category, from })),
});

export default connect(
  mapStateToProps,
  mapActionsToProps
)(withRouter(FixedEntries));
