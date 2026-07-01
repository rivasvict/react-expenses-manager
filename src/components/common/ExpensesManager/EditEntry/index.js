import { useParams } from "react-router-dom/cjs/react-router-dom.min";
import EntryForm from "../EntryForm";
import {
  getEntryById,
  editEntry,
  removeEntry,
  addFixedEntry,
  editFixedEntry,
  removeFixedEntry,
} from "../../../../redux/expensesManager/actionCreators";
import { connect } from "react-redux";
import { useEffect, useState } from "react";
import { withRouter } from "react-router-dom";
import { getMonthKey } from "../../../../helpers/date";
import { resolveFixedEntryState } from "../../../../helpers/fixedEntriesHelper/fixedEntriesHelper";

const EDIT = "Edit";

// Materialized recurring entries carry a synthetic `fixed-<id>` id (issue #103).
const FIXED_ID_PREFIX = "fixed-";
const isFixedEntryId = (entryId) => entryId?.startsWith(FIXED_ID_PREFIX);
const getFixedId = (entryId) => entryId.slice(FIXED_ID_PREFIX.length);

const EditEntry = ({
  entryType,
  selectedDate,
  history,
  buckets,
  unbudgetedCategories,
  fixedEntries,
  onGetEntry,
  onSaveEntry,
  onRemoveEntry,
  onAddFixedEntry,
  onEditFixedEntry,
  onRemoveFixedEntry,
}) => {
  const params = useParams();
  const { entryId } = params;
  const isFixed = isFixedEntryId(entryId);
  const fixedId = isFixed ? getFixedId(entryId) : null;
  // Edits/removals to a recurring entry are anchored to the viewed month, so
  // they take effect from that month forward (issue #103).
  const fromMonth = getMonthKey(selectedDate);

  const [entry, setEntry] = useState(null);
  useEffect(() => {
    if (isFixed) {
      // Resolve the recurring entry's active state for the viewed month from
      // the store, so the form shows what currently applies that month.
      const definition = (fixedEntries || []).find(
        (candidate) => candidate.id === fixedId
      );
      const state = definition
        ? resolveFixedEntryState(definition.history, fromMonth)
        : null;
      setEntry(
        state
          ? {
              id: entryId,
              fixedId,
              isFixed: true,
              type: definition.type,
              amount: state.amount,
              description: state.description,
              categories_path: state.categories_path,
            }
          : null
      );
      return;
    }
    (async () => {
      const entryToDisplay = await onGetEntry({ entryId });
      setEntry(entryToDisplay);
    })();
  }, [entryId, isFixed, fixedId, fromMonth, fixedEntries, onGetEntry]);

  const navigateBack = () => {
    history.goBack();
  };

  const handleSubmit = (event, { entryToAdd, isRecurring }) => {
    event.preventDefault();
    const editedEntry = Object.assign({}, entryToAdd);
    const digitMatcher = /^\d*(\.)*\d+$/;
    const amount = editedEntry.amount;
    // TODO: review the validation for the missing category
    if (
      amount &&
      digitMatcher.test(amount) &&
      editedEntry.categories_path !== ""
    ) {
      if (isFixed) {
        if (isRecurring === false) {
          // User switched off recurring → remove from this month forward.
          onRemoveFixedEntry({ id: fixedId, from: fromMonth });
        } else {
          onEditFixedEntry({
            id: fixedId,
            from: fromMonth,
            amount: editedEntry.amount,
            description: editedEntry.description,
            categories_path: editedEntry.categories_path,
          });
        }
      } else if (isRecurring) {
        // User switched a one-off entry to recurring: promote it to a fixed
        // entry effective from the viewed month and remove it from the balance.
        onAddFixedEntry({ entry: editedEntry, from: fromMonth });
        onRemoveEntry({ entryId });
      } else {
        onSaveEntry({ entry: editedEntry });
      }
      navigateBack();
    }
  };

  const handleEntryRemoval = () => {
    if (isFixed) {
      onRemoveFixedEntry({ id: fixedId, from: fromMonth });
    } else {
      onRemoveEntry({ entryId });
    }
    // TODO: Try using back navigation instead
    navigateBack();
  };

  return entry ? (
    <EntryForm
      entry={entry}
      selectedDate={selectedDate}
      type={entryType}
      handleSubmit={handleSubmit}
      handleEntryRemoval={handleEntryRemoval}
      operationTitle={EDIT}
      onCancel={navigateBack}
      allowRecurring={true}
      buckets={buckets}
      unbudgetedCategories={unbudgetedCategories}
    />
  ) : (
    <>Entry not found</>
  );
};

const mapStateToProps = (state) => ({
  entries: state.expensesManager.entries,
  buckets: state.expensesManager.buckets,
  unbudgetedCategories: state.expensesManager.unbudgetedCategories,
  fixedEntries: state.expensesManager.fixedEntries,
});

const mapActionsToProps = (dispatch) => ({
  onGetEntry: (entryId) => dispatch(getEntryById(entryId)),
  onSaveEntry: ({ entryId, entry }) => dispatch(editEntry({ entryId, entry })),
  onRemoveEntry: ({ entryId }) => dispatch(removeEntry({ entryId })),
  onAddFixedEntry: ({ entry, from }) => dispatch(addFixedEntry({ entry, from })),
  onEditFixedEntry: ({ id, from, amount, description, categories_path }) =>
    dispatch(editFixedEntry({ id, from, amount, description, categories_path })),
  onRemoveFixedEntry: ({ id, from }) =>
    dispatch(removeFixedEntry({ id, from })),
});

export default connect(
  mapStateToProps,
  mapActionsToProps
)(withRouter(EditEntry));
