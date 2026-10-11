import React, { useRef, useState } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import { MainContentContainer } from "../common/MainContentContainer";
import { useTranslation } from "../../i18n";
import { LANGUAGE_NATIVE_NAMES } from "../../i18n/languages";
import {
  Currency,
  CURRENCY_SYMBOLS,
  getStoredCurrency,
  storeCurrency,
} from "../../helpers/currency/currency";
import VersionLabel from "../common/VersionLabel";
import CurrencySheet from "./CurrencySheet";
import LanguageSheet from "./LanguageSheet";
import SettingRow from "./SettingRow";
import "./styles.scss";

type OpenSheet = "language" | "currency" | null;

/**
 * Device-level preferences: the UI language and the display currency. Each is
 * a row showing its current value; tapping it opens a sheet to pick another.
 * Picking one applies immediately and is remembered in this browser only, so
 * it works the same with or without a sync server and never touches the
 * entries model.
 */
const Settings = () => {
  const { t, language } = useTranslation();
  const history = useHistory();
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);
  const [currency, setCurrency] = useState<Currency>(getStoredCurrency);
  const languageRow = useRef<HTMLButtonElement>(null);
  const currencyRow = useRef<HTMLButtonElement>(null);

  const closeSheet = () => {
    (openSheet === "language" ? languageRow : currencyRow).current?.focus();
    setOpenSheet(null);
  };
  const pickCurrency = (picked: Currency) => {
    storeCurrency(picked);
    setCurrency(picked);
  };

  return (
    <MainContentContainer className="settings" pageTitle={t("settings.title")}>
      <Container className="settings__content" fluid>
        <Row>
          <Col className="settings-section">
            <SettingRow
              ref={languageRow}
              label={t("settings.language.title")}
              hint={t("settings.language.hint")}
              value={LANGUAGE_NATIVE_NAMES[language]}
              onOpen={() => setOpenSheet("language")}
            />
            <SettingRow
              ref={currencyRow}
              label={t("settings.currency.title")}
              hint={t("settings.currency.hint")}
              value={`${CURRENCY_SYMBOLS[currency]} · ${currency}`}
              onOpen={() => setOpenSheet("currency")}
            />
          </Col>
        </Row>
        <VersionLabel />
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
      {openSheet === "language" && <LanguageSheet onClose={closeSheet} />}
      {openSheet === "currency" && (
        <CurrencySheet
          current={currency}
          onPick={pickCurrency}
          onClose={closeSheet}
        />
      )}
    </MainContentContainer>
  );
};

export default Settings;
