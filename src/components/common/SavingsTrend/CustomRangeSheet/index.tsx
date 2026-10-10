import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import closeIcon from "@iconify-icons/codicon/close";
import { useTranslation } from "../../../../i18n";
import type { MonthDate } from "../../../../helpers/savingsChange/savingsChange";
import { toMonthIndex } from "../../../../helpers/savingsTrend/savingsTrend";
import { getMonthLabel } from "../../../../helpers/savingsTrend/monthLabels";
import "./styles.scss";

interface CustomRangeSheetProps {
  /** Every recorded month, oldest first. */
  months: MonthDate[];
  initialFrom: MonthDate;
  initialTo: MonthDate;
  onApply: (range: { from: MonthDate; to: MonthDate }) => void;
  onClose: () => void;
}

/**
 * A bottom sheet over a scrim to pick the first and the last month of a
 * custom range. Each list only offers months that keep the pair valid (From
 * before To), so there is no error state. Mount it to open it: it starts from
 * the range being shown and focuses its heading; the caller returns focus to
 * the button that opened it.
 */
const CustomRangeSheet = ({
  months,
  initialFrom,
  initialTo,
  onApply,
  onClose,
}: CustomRangeSheetProps) => {
  const { t, language } = useTranslation();
  const [from, setFrom] = useState(toMonthIndex(initialFrom));
  const [to, setTo] = useState(toMonthIndex(initialTo));
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => headingRef.current?.focus(), []);

  const newestFirst = [...months].reverse();
  const option = (month: MonthDate) => (
    <option key={toMonthIndex(month)} value={toMonthIndex(month)}>
      {getMonthLabel(month.month, language, "title")} {month.year}
    </option>
  );
  const apply = () => {
    const pick = (index: number) => months.find((m) => toMonthIndex(m) === index);
    const [fromMonth, toMonth] = [pick(from), pick(to)];
    if (fromMonth && toMonth) onApply({ from: fromMonth, to: toMonth });
  };

  return (
    <div
      className="custom-range-sheet"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
      }}
    >
      <div className="custom-range-sheet__scrim" aria-hidden="true" onClick={onClose} />
      <div
        className="custom-range-sheet__panel"
        role="dialog"
        aria-labelledby="custom-range-heading"
      >
        <div className="custom-range-sheet__grabber" aria-hidden="true" />
        <div className="custom-range-sheet__header">
          <h2
            id="custom-range-heading"
            className="custom-range-sheet__heading"
            tabIndex={-1}
            ref={headingRef}
          >
            {t("savingsTrend.sheet.title")}
          </h2>
          <button
            type="button"
            className="custom-range-sheet__close"
            aria-label={t("savingsTrend.sheet.close")}
            onClick={onClose}
          >
            <Icon icon={closeIcon} aria-hidden="true" />
          </button>
        </div>
        <p className="field-hint">{t("savingsTrend.sheet.hint")}</p>
        <div className="custom-range-sheet__field">
          <label className="form-label" htmlFor="custom-range-from">
            {t("savingsTrend.sheet.from")}
          </label>
          <select
            id="custom-range-from"
            className="form-control"
            value={from}
            onChange={(event) => setFrom(Number(event.currentTarget.value))}
          >
            {newestFirst.filter((m) => toMonthIndex(m) < to).map(option)}
          </select>
        </div>
        <div className="custom-range-sheet__field">
          <label className="form-label" htmlFor="custom-range-to">
            {t("savingsTrend.sheet.to")}
          </label>
          <select
            id="custom-range-to"
            className="form-control"
            value={to}
            onChange={(event) => setTo(Number(event.currentTarget.value))}
          >
            {newestFirst.filter((m) => toMonthIndex(m) > from).map(option)}
          </select>
        </div>
        <div className="custom-range-sheet__actions">
          <button type="button" className="btn btn-primary" onClick={apply}>
            {t("savingsTrend.sheet.show")}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomRangeSheet;
