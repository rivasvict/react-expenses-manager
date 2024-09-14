import { useParams } from "react-router-dom/cjs/react-router-dom.min";
import EntryForm from "../EntryForm";
import {
  getEntryById,
  editEntry,
  removeEntry,
} from "../../../../redux/expensesManager/actionCreators";
import { connect } from "react-redux";
import { useEffect, useState } from "react";
import { withRouter } from "react-router-dom";

const EDIT = "Edit";
const EditEntry = ({
  entryType,
  selectedDate,
  history,
  onGetEntry,
  onSaveEntry,
  onRemoveEntry,
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
  const navigateBack = () => {
    history.goBack();
  };

  const handleSubmit = (event, { entryToAdd }) => {
    event.preventDefault();
    const entry = Object.assign({}, entryToAdd);
    const digitMatcher = /^\d*(\.)*\d+$/;
    const amount = entry.amount;
    // TODO: review the validation for the missing category
    if (amount && digitMatcher.test(amount) && entry.categories_path !== "") {
      onSaveEntry({ entry });
      navigateBack();
    }
  };

  const handleEntryRemoval = ({ entryId }) => {
    onRemoveEntry({ entryId });
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
  onRemoveEntry: (entryId) => dispatch(removeEntry(entryId)),
});

export default connect(
  mapStateToProps,
  mapActionsToProps
)(withRouter(EditEntry));
