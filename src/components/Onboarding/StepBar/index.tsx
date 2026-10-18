import React from "react";
import { useTranslation } from "../../../i18n";
import "./styles.scss";

interface StepBarProps {
  step: number;
  total: number;
  onSkip: () => void;
}

/**
 * The top of every wizard step: "Step N of M", the Skip setup link and one
 * segment per step, filled gold up to the current one.
 */
const StepBar = ({ step, total, onSkip }: StepBarProps) => {
  const { t } = useTranslation();
  const label = t("onboarding.step", { n: step, total });

  return (
    <div className="step-bar">
      <div className="step-bar__top">
        <span className="step-bar__label">{label}</span>
        <button type="button" className="step-bar__skip" onClick={onSkip}>
          {t("onboarding.skip")}
        </button>
      </div>
      <div
        className="step-bar__track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={step}
      >
        {Array.from({ length: total }, (_, index) => (
          <i
            key={index}
            className={`step-bar__segment${
              index < step ? " step-bar__segment--done" : ""
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default StepBar;
