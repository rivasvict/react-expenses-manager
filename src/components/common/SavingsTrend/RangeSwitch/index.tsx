import React from "react";
import { useTranslation } from "../../../../i18n";
import { getPresetMonthsBack, PRESET_IDS } from "../../../../helpers/savingsTrend/savingsTrend";
import type { PresetId, TrendRange } from "../../../../helpers/savingsTrend/savingsTrend.types";
import type { MonthDate } from "../../../../helpers/savingsChange/savingsChange";
import "./styles.scss";

interface RangeSwitchProps {
  end: MonthDate;
  /** The range being drawn; null when there is nothing to compare with. */
  active: TrendRange | null;
  available: Record<PresetId, boolean>;
  onSelectPreset: (id: PresetId) => void;
  onOpenCustom: () => void;
  customButtonRef: React.Ref<HTMLButtonElement>;
}

/**
 * The segmented control that picks the range: the presets (1M … YTD) and a
 * calendar button that opens the custom range sheet. Presets whose reference
 * month was never recorded are dimmed and disabled.
 */
const RangeSwitch = ({
  end,
  active,
  available,
  onSelectPreset,
  onOpenCustom,
  customButtonRef,
}: RangeSwitchProps) => {
  const { t, plural } = useTranslation();
  const label = (id: PresetId) =>
    id === "YTD"
      ? t("savingsTrend.rangeLabel.ytd")
      : plural("savingsTrend.rangeLabel.months", getPresetMonthsBack(id, end));
  const isOff = !active;
  return (
    <div
      className="range-switch"
      role="group"
      aria-label={t("savingsTrend.rangeGroup")}
    >
      {PRESET_IDS.map((id) => {
        const isOn = active?.kind === "preset" && active.id === id;
        return (
          <button
            key={id}
            type="button"
            className={`range-switch__item${isOn ? " range-switch__item--on" : ""}`}
            aria-label={label(id)}
            aria-pressed={isOn}
            disabled={!available[id]}
            onClick={() => onSelectPreset(id)}
          >
            {t(`savingsTrend.range.${id}`)}
          </button>
        );
      })}
      <button
        ref={customButtonRef}
        type="button"
        className={`range-switch__item${active?.kind === "custom" ? " range-switch__item--on" : ""}`}
        aria-label={t("savingsTrend.customRange")}
        aria-haspopup="dialog"
        aria-pressed={active?.kind === "custom"}
        disabled={isOff}
        onClick={onOpenCustom}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <rect x="2" y="3" width="12" height="11" rx="2" />
          <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
        </svg>
      </button>
    </div>
  );
};

export default RangeSwitch;
