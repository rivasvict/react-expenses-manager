// TODO: This file has no colocated unit test; it was edited, not created,
// by the EN/ES translations change. Tracked in:
// https://github.com/rivasvict/react-expenses-manager/issues/187
import React, { useRef, useState } from "react";
import "./styles.scss";
import { Icon } from "@iconify/react";
import chevronLeft from "@iconify-icons/codicon/chevron-left";
import chevronRight from "@iconify-icons/codicon/chevron-right";
import chevronDown from "@iconify-icons/codicon/chevron-down";
import { getMonthNameDisplay } from "../../../helpers/date";
import { setSelectedDate } from "../../../redux/expensesManager/actionCreators";
import { connect } from "react-redux";
import { useTranslation } from "../../../i18n";
import MonthPickerSheet from "./MonthPickerSheet";
import { getMonthAvailability } from "./utils/monthAvailability";
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
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pillRef = useRef<HTMLButtonElement>(null);
  const { years, hasMonth } = getMonthAvailability(entries, selectedDate.year);

  const closePicker = () => {
    setIsPickerOpen(false);
    pillRef.current?.focus();
  };
  const pickMonth = (date) => {
    onSelectedDateChange(date);
    closePicker();
  };

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
      <h1 className="title month-header__title">
        <button
          type="button"
          className="month-header__pill"
          aria-haspopup="dialog"
          ref={pillRef}
          onClick={() => setIsPickerOpen(true)}
        >
          {`${getMonthNameDisplay(selectedDate.month, language)} ${selectedDate.year}`}
          <Icon icon={chevronDown} aria-hidden="true" />
        </button>
      </h1>
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
      {isPickerOpen && (
        <MonthPickerSheet
          selectedDate={selectedDate}
          years={years}
          hasMonth={hasMonth}
          onSelect={pickMonth}
          onClose={closePicker}
        />
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
