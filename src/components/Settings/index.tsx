import React from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import { Icon } from "@iconify/react";
import checkIcon from "@iconify-icons/codicon/check";
import { MainContentContainer } from "../common/MainContentContainer";
import { SUPPORTED_LANGUAGES, useTranslation } from "../../i18n";
import { LANGUAGE_NATIVE_NAMES } from "../../i18n/languages";
import "./styles.scss";

/**
 * Device-level preferences. Today that is the UI language: picking one applies
 * immediately and is remembered in this browser only, so it works the same
 * with or without a sync server and never touches the entries model.
 */
const Settings = () => {
  const { t, language: currentLanguage, setLanguage } = useTranslation();
  const history = useHistory();

  return (
    <MainContentContainer className="settings" pageTitle={t("settings.title")}>
      <Container className="settings__content" fluid>
        <Row>
          <Col className="settings-section">
            <fieldset>
              <legend className="settings-section__title">
                {t("settings.language.title")}
              </legend>
              <p className="settings-section__description">
                {t("settings.language.description")}
              </p>
              <div className="settings-options">
                {SUPPORTED_LANGUAGES.map((language) => {
                  const isSelected = language === currentLanguage;
                  const nativeName = LANGUAGE_NATIVE_NAMES[language];
                  // "Español · Spanish" helps someone who can't read the
                  // other language; the current one needs no gloss.
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
                        onChange={() => setLanguage(language)}
                      />
                      <span className="settings-option__text">
                        <span className="settings-option__name">
                          {nativeName}
                        </span>
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
                        <span
                          className="settings-option__check"
                          aria-hidden="true"
                        >
                          <Icon icon={checkIcon} />
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </Col>
        </Row>
      </Container>
      <Container className="bottom-content" fluid>
        <Row>
          <Col>
            <Button variant="secondary" onClick={() => history.goBack()}>
              {t("common.goBack")}
            </Button>
          </Col>
        </Row>
      </Container>
    </MainContentContainer>
  );
};

export default Settings;
