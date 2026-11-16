import React from "react";
import { Icon } from "@iconify/react";
import checkIcon from "@iconify-icons/codicon/check";
import BottomSheet from "../../common/BottomSheet";
import { useTranslation } from "../../../i18n";
import { WEEKLY_VIEWS, WeeklyView } from "../../../helpers/weeklyView/weeklyView";
import "../LanguageSheet/styles.scss";

interface WeeklyViewSheetProps {
  current: WeeklyView;
  onPick: (view: WeeklyView) => void;
  onClose: () => void;
}

/**
 * How a bucket's week-by-week spending is drawn: each view by name with a
 * line saying what it looks like, the current one marked. Picking one applies
 * at once, then closes the sheet.
 */
const WeeklyViewSheet = ({ current, onPick, onClose }: WeeklyViewSheetProps) => {
  const { t } = useTranslation();

  return (
    <BottomSheet
      title={t("settings.weeklyView.title")}
      closeLabel={t("settings.sheet.close")}
      onClose={onClose}
    >
      <fieldset className="language-sheet">
        <legend className="field-hint">{t("settings.weeklyView.description")}</legend>
        {WEEKLY_VIEWS.map((view) => {
          const isSelected = view === current;
          return (
            <label
              key={view}
              className={`settings-option${isSelected ? " settings-option--selected" : ""}`}
            >
              <input
                type="radio"
                name="weeklyView"
                className="settings-option__input"
                value={view}
                checked={isSelected}
                onChange={() => {
                  onPick(view);
                  onClose();
                }}
              />
              <span className="settings-option__text">
                <span className="settings-option__name">
                  {t(`settings.weeklyView.${view}`)}
                </span>
                <span className="settings-option__hint">
                  {t(`settings.weeklyView.${view}Hint`)}
                </span>
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

export default WeeklyViewSheet;
