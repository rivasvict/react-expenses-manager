import { connect } from "react-redux";
import {
  getMonthKey,
  getTimestampFromMonthAndYear,
} from "../../../../helpers/date";
import { getEntryModel } from "../../../../helpers/entriesHelper/entriesHelper";
import EntryForm from "../EntryForm";
import { withRouter } from "react-router-dom";
import {
  addExpense,
  addIncome,
  addFixedEntry,
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
  onAddFixedEntry,
  buckets,
  unbudgetedCategories,
  history,
  location,
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

  const handleSubmit = (event, { entryToAdd, isRecurring }) => {
    event.preventDefault();
    const entry = {
      ...entryToAdd,
      type: entryType,
      date: getTimestampFromMonthAndYear({
        month: selectedDate.month,
        year: selectedDate.year,
      }),
    };
    const digitMatcher = /^\d*(\.)*\d+$/;
    const amount = entry.amount;
    // TODO: review the validation for the missing category
    if (amount && digitMatcher.test(amount) && entry.categories_path !== "") {
      // A recurring entry is stored as a fixed entry effective from the viewed
      // month (issue #103); otherwise it is a one-off entry for that month.
      if (isRecurring) {
        onAddFixedEntry({ entry, from: getMonthKey(selectedDate) });
      } else {
        handleEntry({ entry, selectedDate });
      }
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
      allowRecurring={true}
      recurring={Boolean(location?.state?.recurring)}
      buckets={buckets}
      unbudgetedCategories={unbudgetedCategories}
    />
  );
};

const mapStateToProps = (state) => ({
  buckets: state.expensesManager.buckets,
  unbudgetedCategories: state.expensesManager.unbudgetedCategories,
});

const mapActionToProps = (dispatch) => ({
  onAddIncome: (income) => dispatch(addIncome(income)),
  onAddExpense: (expense) => dispatch(addExpense(expense)),
  onAddFixedEntry: ({ entry, from }) => dispatch(addFixedEntry({ entry, from })),
});

export default connect(mapStateToProps, mapActionToProps)(withRouter(AddEntry));
