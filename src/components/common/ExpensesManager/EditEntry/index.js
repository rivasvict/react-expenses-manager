import { useParams } from "react-router-dom/cjs/react-router-dom.min";
import EntryForm from "../EntryForm";
import {
  getEntryById,
  editEntry,
  // removeEntry,
} from "../../../../redux/expensesManager/actionCreators";
import { connect } from "react-redux";
import { useEffect, useState } from "react";

const EditEntry = ({ entryType, selectedDate, onGetEntry }) => {
  const params = useParams();
  const { entryId } = params;
  const [entry, setEntry] = useState(null);
  useEffect(() => {
    (async () => {
      const entryToDisplay = await onGetEntry(entryId);
      setEntry(entryToDisplay);
    })();
  }, [entryId, onGetEntry]);
  /**
   * Next steps:
   * 3. Handle error of entry not found
   * 4. Add a callback handler for the submit action
   * 5. Add the deletion flow (including button and callback)
   */
  return entry ? (
    <EntryForm entry={entry} selectedDate={selectedDate} type={entryType} />
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

export default connect(mapStateToProps, mapActionsToProps)(EditEntry);
