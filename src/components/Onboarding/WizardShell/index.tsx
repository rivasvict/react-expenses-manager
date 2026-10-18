import React, { useEffect, useRef, useState } from "react";
import { Button } from "react-bootstrap";
import { useTranslation } from "../../../i18n";
import BrandMark from "../../common/BrandMark";
import StepBar from "../StepBar";
import "./styles.scss";

interface WizardShellProps {
  step: number;
  total: number;
  title: React.ReactNode;
  children: React.ReactNode;
  /** The line above the buttons ("8 selected"); nothing when absent. */
  summary?: React.ReactNode;
  nextLabel: string;
  onNext: () => void;
  /** Absent on the first step. */
  onBack?: () => void;
  onSkip: () => void;
}

/**
 * The full-screen frame of every wizard step: the brand, a card whose step bar
 * stays pinned at the top while the content scrolls, and a footer pinned to the
 * bottom (summary, Back, and the one gold primary action) so the way forward is
 * always in view on a long list. The heading takes focus when the step changes,
 * and the footer steps aside while a text field has the keyboard open.
 */
const WizardShell = ({
  step,
  total,
  title,
  children,
  summary,
  nextLabel,
  onNext,
  onBack,
  onSkip,
}: WizardShellProps) => {
  const { t } = useTranslation();
  const heading = useRef<HTMLHeadingElement>(null);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    heading.current?.focus();
  }, [step]);

  return (
    <main
      className={`wizard-shell${typing ? " wizard-shell--typing" : ""}`}
      aria-label={t("onboarding.ariaLabel")}
    >
      <header className="wizard-shell__brand">
        <BrandMark size={40} title={t("header.logoTitle")} />
        <span className="wizard-shell__name">{t("header.appName")}</span>
      </header>
      <div
        className="wizard-shell__card"
        onFocus={(event) =>
          setTyping(
            event.target instanceof HTMLInputElement &&
              event.target.type === "text"
          )
        }
        onBlur={() => setTyping(false)}
      >
        <div className="wizard-shell__top">
          <StepBar step={step} total={total} onSkip={onSkip} />
        </div>
        <h1 className="wizard-shell__title" tabIndex={-1} ref={heading}>
          {title}
        </h1>
        {children}
        <div className="wizard-shell__spacer" aria-hidden="true" />
      </div>
      <footer className="wizard-shell__footer">
        {summary && <p className="wizard-shell__summary">{summary}</p>}
        <div className="wizard-shell__actions">
          {onBack && (
            <Button variant="secondary" onClick={onBack}>
              {t("onboarding.back")}
            </Button>
          )}
          <Button variant="primary" onClick={onNext}>
            {nextLabel}
          </Button>
        </div>
      </footer>
    </main>
  );
};

export default WizardShell;
