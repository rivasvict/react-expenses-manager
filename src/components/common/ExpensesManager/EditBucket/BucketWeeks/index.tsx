import React, { useState } from "react";
import { BucketExpense, BucketWeek } from "../../../../../helpers/bucketPace/bucketPace";
import { formatDayMonth } from "../../../../../helpers/shortDate/shortDate";
import { useTranslation } from "../../../../../i18n";
import WeekRow from "../WeekRow";
import "./styles.scss";

const VISIBLE_WEEKS = 2;

interface BucketWeeksProps {
  weeks: BucketWeek<BucketExpense>[];
  year: number;
  /** 0-indexed month, as in `selectedDate`. */
  month: number;
  bucketName: string;
}

/**
 * The expenses of the month grouped by week, newest first: the first two weeks
 * show, "Show earlier weeks" reveals the rest. Every bar uses one scale (the
 * largest spent or pace of any week) so weeks compare with each other.
 */
const BucketWeeks = ({ weeks, year, month, bucketName }: BucketWeeksProps) => {
  const { t, language } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  // A little headroom, so a tick at the largest value is not on the bar's end.
  const scale =
    Math.max(...weeks.map(({ spent, pace }) => Math.max(spent, pace ?? 0))) * 1.08 || 1;
  const monthName = new Intl.DateTimeFormat(language, { month: "short" }).format(
    new Date(year, month, 1)
  );
  const labelOf = ({ startDay, endDay }: BucketWeek<BucketExpense>) =>
    startDay === endDay
      ? formatDayMonth(new Date(year, month, startDay, 12).getTime(), language)
      : t("editBucket.weekRange", {
          month: monthName,
          start: startDay,
          end: endDay,
        });
  const shownWeeks = showAll ? weeks : weeks.slice(0, VISIBLE_WEEKS);

  return (
    <section className="bucket-weeks">
      <div className="bucket-weeks__head">
        <h2 className="bucket-weeks__title">{t("editBucket.expensesByWeek")}</h2>
        <span className="bucket-weeks__legend">
          <i aria-hidden="true" />
          {t("editBucket.weeklyPace")}
        </span>
      </div>
      <ul className="bucket-weeks__weeks">
        {shownWeeks.map((week) => (
          <WeekRow
            key={week.startDay}
            label={labelOf(week)}
            spent={week.spent}
            pace={week.pace}
            scale={scale}
            expenses={week.expenses}
            fallbackTitle={bucketName}
          />
        ))}
      </ul>
      {weeks.length > VISIBLE_WEEKS && !showAll && (
        <button
          type="button"
          className="bucket-weeks__more"
          onClick={() => setShowAll(true)}
        >
          {t("editBucket.showEarlier")}
        </button>
      )}
    </section>
  );
};

export default BucketWeeks;
