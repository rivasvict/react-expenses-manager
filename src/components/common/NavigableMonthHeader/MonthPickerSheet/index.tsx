import React, { useState } from "react";
import { Icon } from "@iconify/react";
import chevronLeft from "@iconify-icons/codicon/chevron-left";
import chevronRight from "@iconify-icons/codicon/chevron-right";
import { upperFirst } from "lodash";
import { useTranslation } from "../../../../i18n";
import { getMonthLabel } from "../../../../helpers/savingsTrend/monthLabels";
import BottomSheet from "../../BottomSheet";
import "./styles.scss";

interface MonthDate {
  year: number;
  month: number;
}

interface MonthPickerSheetProps {
  selectedDate: MonthDate;
  /** Years with data, oldest first. */
  years: number[];
  hasMonth: (year: number, month: number) => boolean;
  onSelect: (date: MonthDate) => void;
  onClose: () => void;
}

const MONTHS = Array.from({ length: 12 }, (_, month) => month);

/**
 * A bottom sheet to jump to any month with data: a year stepper over a grid
 * of the twelve months. Months without data are dimmed and cannot be picked,
 * so there is no error state. Mount it to open it: it opens on the selected
 * month's year; the caller returns focus to the control that opened it.
 */
const MonthPickerSheet = ({
  selectedDate,
  years,
  hasMonth,
  onSelect,
  onClose,
}: MonthPickerSheetProps) => {
  const { t, language } = useTranslation();
  const [year, setYear] = useState(selectedDate.year);
  const yearIndex = years.indexOf(year);

  return (
    <BottomSheet
      title={t("monthHeader.picker.title")}
      closeLabel={t("monthHeader.picker.close")}
      onClose={onClose}
      className="month-picker-sheet"
    >
      <div className="month-picker-sheet__years">
        <button
          type="button"
          className="month-picker-sheet__step"
          aria-label={t("monthHeader.picker.previousYear")}
          disabled={yearIndex <= 0}
          onClick={() => setYear(years[yearIndex - 1])}
        >
          <Icon icon={chevronLeft} aria-hidden="true" />
        </button>
        <span className="month-picker-sheet__year" aria-live="polite">
          {year}
        </span>
        <button
          type="button"
          className="month-picker-sheet__step"
          aria-label={t("monthHeader.picker.nextYear")}
          disabled={yearIndex >= years.length - 1}
          onClick={() => setYear(years[yearIndex + 1])}
        >
          <Icon icon={chevronRight} aria-hidden="true" />
        </button>
      </div>
      <div className="month-picker-sheet__grid">
        {MONTHS.map((month) => {
          const isSelected =
            year === selectedDate.year && month === selectedDate.month;
          return (
            <button
              key={month}
              type="button"
              className={`month-picker-sheet__month${
                isSelected ? " month-picker-sheet__month--selected" : ""
              }`}
              aria-label={`${getMonthLabel(month, language, "title")} ${year}`}
              aria-pressed={isSelected}
              disabled={!hasMonth(year, month)}
              onClick={() => onSelect({ year, month })}
            >
              {upperFirst(getMonthLabel(month, language, "short"))}
            </button>
          );
        })}
      </div>
      <p className="month-picker-sheet__legend">
        <span>
          <i className="month-picker-sheet__swatch" aria-hidden="true" />
          {t("monthHeader.picker.legendSelected")}
        </span>
        <span>{t("monthHeader.picker.legendDimmed")}</span>
      </p>
    </BottomSheet>
  );
};

export default MonthPickerSheet;
