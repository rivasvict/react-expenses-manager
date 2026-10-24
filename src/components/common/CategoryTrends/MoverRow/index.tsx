import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "../../../../i18n";
import type { CategoryTrend } from "../../../../helpers/categoryTrends/categoryTrends.types";
import {
  categoryTrendPath,
  formatWholePercent,
} from "../../../../helpers/categoryTrends/categoryTrends";
import { formatSavings } from "../../../../helpers/savingsTrend/formatters";
import ChangePill, { ChangeKind } from "../../ChangePill";
import Sparkline from "../Sparkline";
import "./styles.scss";

interface MoverRowProps {
  trend: CategoryTrend;
  /** The reference month's name, for the spoken label ("April"). */
  reference: string;
}

/**
 * One category in the ranked list: its name over what it was in the reference
 * month, a sparkline, the end month's amount and a change pill (whole
 * percentages). The whole row is a link to the category's trend.
 */
const MoverRow = ({ trend, reference }: MoverRowProps) => {
  const { t } = useTranslation();
  const { type, name, change, tone } = trend;
  const amount = formatSavings(trend.end.amount);
  const was = formatSavings(trend.reference.amount);
  const hasPercent = change.kind === "up" || change.kind === "down" || change.kind === "flat";
  // The rows show whole percentages: under 0.5% reads as no change, in grey.
  const kind: ChangeKind | null = hasPercent
    ? Math.round(change.percent) === 0 ? "flat" : change.kind
    : null;
  const sign = kind === "up" ? "+" : kind === "down" ? "−" : "";
  const label = hasPercent
    ? t("categoryTrends.rowLabel", {
        name,
        amount,
        change: `${sign}${formatWholePercent(change.percent)}`,
        reference,
      })
    : t("categoryTrends.rowLabelNew", { name, amount, was });

  return (
    <Link to={categoryTrendPath(type, name)} className="mover-row" aria-label={label}>
      <span className="mover-row__main">
        <span className="mover-row__name">{name}</span>
        <span className="mover-row__meta">{t("categoryTrends.was", { amount: was })}</span>
      </span>
      <Sparkline values={trend.points.map((point) => point.amount)} tone={tone} />
      <span className="mover-row__figures">
        <span className="mover-row__amount">{amount}</span>
        {hasPercent && kind ? (
          <ChangePill
            kind={kind}
            tone={kind === "flat" ? "flat" : tone}
            percent={formatWholePercent(change.percent)}
          />
        ) : (
          <span className="change-pill change-pill--flat">{t("categoryTrends.new")}</span>
        )}
      </span>
    </Link>
  );
};

export default MoverRow;
