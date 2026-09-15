import { connect } from "react-redux";
import {
  getBalance,
  getBuckets,
  getCategories,
  getEntryFilters,
} from "../../redux/expensesManager/actionCreators";
import { useEffect } from "react";

/**
 *  This is just a component that calls getBalance from redux to set the balance
 */
const WithBalance = ({
  onGetBalance,
  children,
  onGetBuckets,
  buckets,
  onGetCategories,
  onGetEntryFilters,
}) => {
  useEffect(() => {
    /** Get/set the balance from redux */
    onGetBalance();
    /** Get/set buckets from redux */
    onGetBuckets({ buckets });
    /** Get/set the user's standalone categories from redux (issue #100) */
    onGetCategories();
    /** Hydrate the persisted entry-list filters & sorting from redux */
    onGetEntryFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return children;
};

const mapActionToProps = (dispatch) => ({
  onGetBalance: () => dispatch(getBalance()),
  onGetBuckets: ({ buckets }) => dispatch(getBuckets({ buckets })),
  onGetCategories: () => dispatch(getCategories()),
  onGetEntryFilters: () => dispatch(getEntryFilters()),
});

const mapStateToProps = (state) => ({
  buckets: state.expensesManager.buckets,
});

export default connect(mapStateToProps, mapActionToProps)(WithBalance);
