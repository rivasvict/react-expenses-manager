import React from "react";
import { useTranslation } from "../../../../i18n";
import {
  Language,
  LANGUAGE_NATIVE_NAMES,
  SUPPORTED_LANGUAGES,
} from "../../../../i18n/languages";
import { Currency } from "../../../../helpers/currency/currency";
import SegmentedControl from "../../../common/SegmentedControl";
import CurrencyTileGrid from "../../../Settings/CurrencyTileGrid";
import SwitchRow from "../../../Settings/SwitchRow";
import "./styles.scss";

interface PreferencesStepProps {
  currency: Currency;
  privacyMode: boolean;
  onCurrencyChange: (currency: Currency) => void;
  onPrivacyModeChange: (privacyMode: boolean) => void;
}

const LANGUAGE_OPTIONS = SUPPORTED_LANGUAGES.map((language) => ({
  value: language,
  label: LANGUAGE_NATIVE_NAMES[language],
}));

/**
 * Step 1: the language (applied at once, so the wizard itself switches), the
 * display currency and Privacy mode, preselected from what this device stores.
 */
const PreferencesStep = ({
  currency,
  privacyMode,
  onCurrencyChange,
  onPrivacyModeChange,
}: PreferencesStepProps) => {
  const { t, language, setLanguage } = useTranslation();

  return (
    <div className="preferences-step">
      <p className="preferences-step__lead">{t("onboarding.prefsLead")}</p>
      <p className="preferences-step__label">{t("settings.language.title")}</p>
      <SegmentedControl<Language>
        label={t("settings.language.title")}
        name="language"
        options={LANGUAGE_OPTIONS}
        value={language}
        onChange={setLanguage}
      />
      <p className="preferences-step__label">
        {t("settings.currency.title")}{" "}
        <span className="preferences-step__hint">
          · {t("onboarding.currencyHint")}
        </span>
      </p>
      <CurrencyTileGrid current={currency} onPick={onCurrencyChange} columns={4} />
      <p className="preferences-step__label">{t("onboarding.privacy")}</p>
      <SwitchRow
        label={t("settings.privacy.title")}
        hint={t("onboarding.privacyHint")}
        checked={privacyMode}
        onChange={onPrivacyModeChange}
      />
    </div>
  );
};

export default PreferencesStep;
