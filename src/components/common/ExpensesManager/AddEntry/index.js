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

  const handleSubmit = (event, { handleEntry, history, selectedDate }) => {
    event.preventDefault();
    const entry = Object.assign({}, this.state);
    const digitMatcher = /^\d*(\.)*\d+$/;
    const amount = entry.amount;
    // TODO: review the validation for the missing category
    if (amount && digitMatcher.test(amount) && entry.categories_path !== "") {
      handleEntry({ entry, selectedDate });
      this.navigateToDashboard(history);
    }
  };

  return (
    <EntryForm
      entry={newEntry}
      selectedDate={selectedDate}
      handleSubmit={handleSubmit}
    />
  );
};

export default AddEntry;
