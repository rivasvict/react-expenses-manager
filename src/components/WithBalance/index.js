import { connect } from "react-redux";
import { getBalance } from "../../redux/expensesManager/actionCreators";

/**
 *  This is just a component that calls getBalance from redux to set the balance
 */
const WithBalance = ({ onGetBalance, children }) => {
  /** Get/set the balance from redux */
  onGetBalance();
  return children;
};

const mapActionToProps = (dispatch) => ({
  onGetBalance: () => dispatch(getBalance()),
});

const mapStateToProps = () => ({});

export default connect(mapStateToProps, mapActionToProps)(WithBalance);
