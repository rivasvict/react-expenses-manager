import { useParams } from "react-router-dom/cjs/react-router-dom.min";
import { getCurrentTimestamp } from "../../../../helpers/date";
import { getEntryModel } from "../../../../helpers/entriesHelper/entriesHelper";
import EntryForm from "../EntryForm";

const EditEntry = ({ entryType, selectedDate }) => {
  const params = useParams();
  console.log(params);
  /**
   * Next steps:
   * 1. Make sure to give a proper id to any new created entry in src/components/common/ExpensesManager/AddEntry/index.js
   * 2. Add here a fetch for the requested entry by id
   * 3. Handle error of entry not found
   * 4. Add a callback handler for the submit action
   * 5. Add the deletion flow (including button and callback)
   */
  const newEntry = getEntryModel({
    entryType,
    // TODO: Make sure the date calculation takes the hours and seconds into account
    // also, make sure the timestamp calculation happens at the actual entry creation
    // Not at the component rendering time
    timestamp: getCurrentTimestamp({
      month: selectedDate.month,
      year: selectedDate.year,
    }),
  });
  return <EntryForm entry={newEntry} selectedDate={selectedDate} />;
};

export default EditEntry;
