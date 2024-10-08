import { connect } from "react-redux";
import { getCurrentTimestamp } from "../../../../helpers/date";
import { getEntryModel } from "../../../../helpers/entriesHelper/entriesHelper";
import EntryForm from "../EntryForm";
import { withRouter } from "react-router-dom";
import {
  addExpense,
  addIncome,
} from "../../../../redux/expensesManager/actionCreators";

const ADD_NEW = "Add new";

const getActionFromEntryType = ({ entryType, actions }) => {
  const entryTypeToActionDictionary = {
    income: actions["onAddIncome"],
    expense: actions["onAddExpense"],
  };

  return entryTypeToActionDictionary[entryType];
};

const AddEntry = ({
  entryType,
  selectedDate,
  onAddIncome,
  onAddExpense,
  history,
}) => {
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

  const navigateBack = () => {
    history.goBack();
  };

  const handleEntry = getActionFromEntryType({
    entryType,
    actions: {
      onAddIncome,
      onAddExpense,
    },
  });

  const handleSubmit = (event, { entryToAdd }) => {
    event.preventDefault();
    const entry = Object.assign({}, entryToAdd);
    const digitMatcher = /^\d*(\.)*\d+$/;
    const amount = entry.amount;
    // TODO: review the validation for the missing category
    if (amount && digitMatcher.test(amount) && entry.categories_path !== "") {
      handleEntry({ entry, selectedDate });
      navigateBack();
    }
  };

  return (
    <EntryForm
      entry={newEntry}
      selectedDate={selectedDate}
      handleSubmit={handleSubmit}
      onCancel={navigateBack}
      operationTitle={ADD_NEW}
    />
  );
};

const mapStateToProps = (state) => ({});

const mapActionToProps = (dispatch) => ({
  onAddIncome: (income) => dispatch(addIncome(income)),
  onAddExpense: (expense) => dispatch(addExpense(expense)),
});

export default connect(mapStateToProps, mapActionToProps)(withRouter(AddEntry));
