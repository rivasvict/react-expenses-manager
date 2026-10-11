import React from "react";
import { Icon } from "@iconify/react";
import checkIcon from "@iconify-icons/codicon/check";
import BottomSheet from "../../common/BottomSheet";
import { SUPPORTED_LANGUAGES, useTranslation } from "../../../i18n";
import { LANGUAGE_NATIVE_NAMES } from "../../../i18n/languages";
import "./styles.scss";

interface LanguageSheetProps {
  onClose: () => void;
}

/**
 * The language picker: every language by its own name, the current one marked.
 * Picking one switches the app at once, then closes the sheet.
 */
const LanguageSheet = ({ onClose }: LanguageSheetProps) => {
  const { t, language: currentLanguage, setLanguage } = useTranslation();

  return (
    <BottomSheet
      title={t("settings.language.title")}
      closeLabel={t("settings.sheet.close")}
      onClose={onClose}
    >
      <fieldset className="language-sheet">
        <legend className="field-hint">
          {t("settings.language.description")}
        </legend>
        {SUPPORTED_LANGUAGES.map((language) => {
          const isSelected = language === currentLanguage;
          const nativeName = LANGUAGE_NATIVE_NAMES[language];
          // "Español · Spanish" helps someone who can't read the other
          // language; the current one needs no gloss.
          const translatedName = t(`language.${language}`);
          return (
            <label
              key={language}
              lang={language}
              className={`settings-option${
                isSelected ? " settings-option--selected" : ""
              }`}
            >
              <input
                type="radio"
                name="language"
                className="settings-option__input"
                value={language}
                checked={isSelected}
                onChange={() => {
                  setLanguage(language);
                  onClose();
                }}
              />
              <span className="settings-option__text">
                <span className="settings-option__name">{nativeName}</span>
                {translatedName !== nativeName && (
                  <span
                    className="settings-option__hint"
                    lang={currentLanguage}
                  >
                    {translatedName}
                  </span>
                )}
              </span>
              {isSelected && (
                <span className="settings-option__check" aria-hidden="true">
                  <Icon icon={checkIcon} />
                </span>
              )}
            </label>
          );
        })}
      </fieldset>
    </BottomSheet>
  );
};

export default LanguageSheet;
