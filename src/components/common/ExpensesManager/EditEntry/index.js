import { useParams } from "react-router-dom/cjs/react-router-dom.min";
import EntryForm from "../EntryForm";
import {
  getEntryById,
  editEntry,
  // removeEntry,
} from "../../../../redux/expensesManager/actionCreators";
import { connect } from "react-redux";
import { useEffect, useState } from "react";
import { withRouter } from "react-router-dom";

const EditEntry = ({
  entryType,
  selectedDate,
  onGetEntry,
  history,
  onSaveEntry,
}) => {
  const params = useParams();
  const { entryId } = params;
  const [entry, setEntry] = useState(null);
  useEffect(() => {
    (async () => {
      const entryToDisplay = await onGetEntry({ entryId });
      setEntry(entryToDisplay);
    })();
  }, [entryId, onGetEntry]);
  /**
   * Next steps:
   * 4. Add a callback handler for the submit action
   * 5. Add the deletion flow (including button and callback)
   */
  /* TODO: Use back history navigation instead of a specific route for cancel action */
  const navigateToDashboard = () => {
    history.push("/dashboard");
  };

  const handleSubmit = (event, { entryToAdd }) => {
    event.preventDefault();
    const entry = Object.assign({}, entryToAdd);
    const digitMatcher = /^\d*(\.)*\d+$/;
    const amount = entry.amount;
    // TODO: review the validation for the missing category
    if (amount && digitMatcher.test(amount) && entry.categories_path !== "") {
      onSaveEntry({ entry });
      navigateToDashboard();
    }
  };

  return entry ? (
    <EntryForm
      entry={entry}
      selectedDate={selectedDate}
      type={entryType}
      handleSubmit={handleSubmit}
    />
  ) : (
    <>Entry not found</>
  );
};

const mapStateToProps = (state) => ({
  entries: state.expensesManager.entries,
});

const mapActionsToProps = (dispatch) => ({
  onGetEntry: (entryId) => dispatch(getEntryById(entryId)),
  onSaveEntry: ({ entryId, entry }) => dispatch(editEntry({ entryId, entry })),
  // onRemoveEntry: (entryId) => dispatch(removeEntry(entryId)),
});

export default connect(
  mapStateToProps,
  mapActionsToProps
)(withRouter(EditEntry));
