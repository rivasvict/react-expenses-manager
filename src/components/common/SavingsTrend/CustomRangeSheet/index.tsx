import React, { useState } from "react";
import { useTranslation } from "../../../../i18n";
import type { MonthDate } from "../../../../helpers/savingsChange/savingsChange";
import { toMonthIndex } from "../../../../helpers/savingsTrend/savingsTrend";
import { getMonthLabel } from "../../../../helpers/savingsTrend/monthLabels";
import BottomSheet from "../../BottomSheet";
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
 * A bottom sheet to pick the first and the last month of a
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

  const newestFirst = [...months].reverse();
  const option = (month: MonthDate) => (
    <option key={toMonthIndex(month)} value={toMonthIndex(month)}>
      {getMonthLabel(month.month, language, "title")} {month.year}
    </option>
  );
  const apply = () => {
    const pick = (index: number) =>
      months.find((m) => toMonthIndex(m) === index);
    const [fromMonth, toMonth] = [pick(from), pick(to)];
    if (fromMonth && toMonth) onApply({ from: fromMonth, to: toMonth });
  };

  return (
    <BottomSheet
      title={t("savingsTrend.sheet.title")}
      closeLabel={t("savingsTrend.sheet.close")}
      onClose={onClose}
    >
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
    </BottomSheet>
  );
};

export default CustomRangeSheet;
