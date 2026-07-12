import React from "react";
import "./styles.scss";
import { Icon } from "@iconify/react";
import chevronLeft from "@iconify-icons/codicon/chevron-left";
import chevronRight from "@iconify-icons/codicon/chevron-right";
import ScreenTitle from "../ScreenTitle";
import { getMonthNameDisplay } from "../../../helpers/date";
import { setSelectedDate } from "../../../redux/expensesManager/actionCreators";
import { connect } from "react-redux";
import {
  doesAdjacentDateExist,
  handleDateSelectionPointers,
} from "./utils/index";

const NavigableMonthHeader = ({
  entries,
  selectedDate,
  onSelectedDateChange,
}) => {
  const canGo = (dateAdjacencyType) =>
    doesAdjacentDateExist({ dateAdjacencyType, selectedDate, entries });

  const go = (dateAdjacencyType) =>
    handleDateSelectionPointers({
      entries,
      selectedDate,
      onSelectedDateChange,
      dateAdjacencyType,
    });

  return (
    <div className="month-header">
      {canGo("prev") ? (
        <button
          type="button"
          className="month-header__step"
          aria-label="Previous month"
          onClick={() => go("prev")}
        >
          <Icon icon={chevronLeft} aria-hidden="true" />
        </button>
      ) : (
        <span className="month-header__step month-header__step--placeholder" />
      )}
      <ScreenTitle
        screenTitle={`${getMonthNameDisplay(selectedDate.month)} ${selectedDate.year}`}
      />
      {canGo("next") ? (
        <button
          type="button"
          className="month-header__step"
          aria-label="Next month"
          onClick={() => go("next")}
        >
          <Icon icon={chevronRight} aria-hidden="true" />
        </button>
      ) : (
        <span className="month-header__step month-header__step--placeholder" />
      )}
    </div>
  );
};

const mapStateToProps = (state) => ({
  entries: state.expensesManager.entries,
  selectedDate: state.expensesManager.selectedDate,
});

const mapActionsToProps = (dispatch) => ({
  onSelectedDateChange: (newSelectedDate) =>
    dispatch(setSelectedDate(newSelectedDate)),
});

export default connect(
  mapStateToProps,
  mapActionsToProps
)(NavigableMonthHeader);
