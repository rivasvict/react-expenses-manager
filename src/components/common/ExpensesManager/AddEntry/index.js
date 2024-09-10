import { getCurrentTimestamp } from "../../../../helpers/date";
import { getEntryModel } from "../../../../helpers/entriesHelper/entriesHelper";
import EntryForm from "../EntryForm";

const AddEntry = ({ entryType, selectedDate }) => {
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

export default AddEntry;
