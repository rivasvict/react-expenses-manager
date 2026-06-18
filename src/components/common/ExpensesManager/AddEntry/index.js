import { connect } from "react-redux";
import { getTimestampFromMonthAndYear } from "../../../../helpers/date";
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
  buckets,
  history,
}) => {
  const newEntry = getEntryModel({ entryType });

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
    const entry = {
      ...entryToAdd,
      date: getTimestampFromMonthAndYear({
        month: selectedDate.month,
        year: selectedDate.year,
      }),
    };
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
      buckets={buckets}
    />
  );
};

const mapStateToProps = (state) => ({
  buckets: state.expensesManager.buckets,
});

const mapActionToProps = (dispatch) => ({
  onAddIncome: (income) => dispatch(addIncome(income)),
  onAddExpense: (expense) => dispatch(addExpense(expense)),
});

export default connect(mapStateToProps, mapActionToProps)(withRouter(AddEntry));
