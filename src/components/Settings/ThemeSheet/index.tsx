import React from "react";
import BottomSheet from "../../common/BottomSheet";
import ThemeRadioGroup from "../../common/ThemeRadioGroup";
import { useTranslation } from "../../../i18n";
import { useTheme } from "../../../themes";
import "./styles.scss";

interface ThemeSheetProps {
  onClose: () => void;
}

/**
 * The theme picker: every theme as a live preview card in a two-column grid.
 * Unlike the Language and Currency sheets it stays open after a tap, because
 * the app behind it recolors at once and a person can try several themes.
 * Only the grid scrolls; the heading and the hint stay put.
 */
const ThemeSheet = ({ onClose }: ThemeSheetProps) => {
  const { t } = useTranslation();
  const { theme, themes, setTheme } = useTheme();

  return (
    <BottomSheet
      className="theme-sheet"
      title={t("settings.theme.title")}
      closeLabel={t("settings.sheet.close")}
      onClose={onClose}
    >
      <p className="field-hint">{t("settings.theme.description")}</p>
      <div className="theme-sheet__body">
        <ThemeRadioGroup
          className="theme-sheet__grid"
          themes={themes}
          currentId={theme.id}
          onPick={setTheme}
        />
      </div>
    </BottomSheet>
  );
};

export default ThemeSheet;
