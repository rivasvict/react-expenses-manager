import { connect } from "react-redux";
import {
  getBalance,
  getBuckets,
} from "../../redux/expensesManager/actionCreators";
import { useEffect } from "react";

/**
 *  This is just a component that calls getBalance from redux to set the balance
 */
const WithBalance = ({ onGetBalance, children, onGetBuckets, buckets }) => {
  useEffect(() => {
    /** Get/set the balance from redux */
    onGetBalance();
    /** Get/set buckets from redux */
    onGetBuckets({ buckets });
  }, []);
  return children;
};

const mapActionToProps = (dispatch) => ({
  onGetBalance: () => dispatch(getBalance()),
  onGetBuckets: ({ buckets }) => dispatch(getBuckets({ buckets })),
});

const mapStateToProps = (state) => ({
  buckets: state.expensesManager.buckets,
});

export default connect(mapStateToProps, mapActionToProps)(WithBalance);
