// TODO: This file has no colocated unit test; it was edited, not created,
// by the EN/ES translations change. Tracked in:
// https://github.com/rivasvict/react-expenses-manager/issues/187
import React from "react";
import "./styles.scss";
import { Icon } from "@iconify/react";
import chevronLeft from "@iconify-icons/codicon/chevron-left";
import chevronRight from "@iconify-icons/codicon/chevron-right";
import ScreenTitle from "../ScreenTitle";
import { getMonthNameDisplay } from "../../../helpers/date";
import { setSelectedDate } from "../../../redux/expensesManager/actionCreators";
import { connect } from "react-redux";
import { useTranslation } from "../../../i18n";
import {
  doesAdjacentDateExist,
  handleDateSelectionPointers,
} from "./utils/index";

const NavigableMonthHeader = ({
  entries,
  selectedDate,
  onSelectedDateChange,
}) => {
  const { t, language } = useTranslation();
  const canGo = (dateAdjacencyType) =>
    doesAdjacentDateExist({ dateAdjacencyType, selectedDate, entries });

  const go = (dateAdjacencyType) =>
    handleDateSelectionPointers({
      entries,
      selectedDate,
      onSelectedDateChange,
      dateAdjacencyType,
    });

  // At the first/last month with data the stepper stays put but goes disabled,
  // instead of vanishing (candidate 2) — the control never teleports under the
  // thumb, and screen readers announce it as disabled rather than silently
  // dropping it.
  const canGoPrev = canGo("prev");
  const canGoNext = canGo("next");

  return (
    <div className="month-header">
      <button
        type="button"
        className="month-header__step"
        aria-label={t("monthHeader.previous")}
        onClick={() => go("prev")}
        disabled={!canGoPrev}
        aria-disabled={!canGoPrev}
      >
        <Icon icon={chevronLeft} aria-hidden="true" />
      </button>
      <ScreenTitle
        screenTitle={`${getMonthNameDisplay(selectedDate.month, language)} ${selectedDate.year}`}
      />
      <button
        type="button"
        className="month-header__step"
        aria-label={t("monthHeader.next")}
        onClick={() => go("next")}
        disabled={!canGoNext}
        aria-disabled={!canGoNext}
      >
        <Icon icon={chevronRight} aria-hidden="true" />
      </button>
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
