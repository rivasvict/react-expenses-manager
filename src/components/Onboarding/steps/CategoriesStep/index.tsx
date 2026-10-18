import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { useTranslation } from "../../../../i18n";
import { CategoryType } from "../../../../helpers/categoryLists/categoryLists";
import {
  addOwnCategory,
  chipNamesOf,
  chosenNamesOf,
  clearCategories,
  isSelected,
  selectAllCategories,
  toggleCategory,
  WizardDraft,
} from "../../../../onboarding/wizardDraft";
import SelectableChip from "../../../common/SelectableChip";
import InfoNote from "../../InfoNote";
import "./styles.scss";

interface CategoriesStepProps {
  type: CategoryType;
  draft: WizardDraft;
  onDraftChange: (draft: WizardDraft) => void;
}

/**
 * Steps 2 and 3, one per type: the seed list as toggle chips (nothing chosen
 * until the user chooses), Select all and Clear, and a field to add a name of
 * their own. A duplicate name is explained under the field. Choosing none is
 * a valid answer and says so.
 */
const CategoriesStep = ({ type, draft, onDraftChange }: CategoriesStepProps) => {
  const translator = useTranslation();
  const { t } = translator;
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const chips = chipNamesOf(draft, type);
  const chosen = chosenNamesOf(draft, type);

  const handleAdd = (event: React.FormEvent) => {
    event.preventDefault();
    const result = addOwnCategory(draft, type, name, translator);
    setError(result.error);
    if (result.error) return;
    onDraftChange(result.draft);
    setName("");
  };

  return (
    <>
      <p className="categories-step__lead">{t(`onboarding.${type}sLead`)}</p>
      <form className="categories-step__add" onSubmit={handleAdd}>
        <input
          type="text"
          name="customCategory"
          className={`form-control text${error ? " categories-step__input--invalid" : ""}`}
          value={name}
          placeholder={t("onboarding.ownLabel")}
          aria-label={t("onboarding.ownLabel")}
          aria-invalid={Boolean(error)}
          autoComplete="off"
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
        />
        <Button type="submit" variant="secondary">
          {t("onboarding.add")}
        </Button>
      </form>
      {error && (
        <p className="validation-message categories-step__error" role="alert">
          {error}
        </p>
      )}
      <div className="categories-step__tools">
        <span>
          {t("onboarding.selectedOf", {
            selected: chosen.length,
            total: chips.length,
          })}
        </span>
        <span>
          <button
            type="button"
            className="categories-step__link"
            onClick={() => onDraftChange(selectAllCategories(draft, type))}
          >
            {t("onboarding.selectAll")}
          </button>
          <button
            type="button"
            className="categories-step__link"
            onClick={() => onDraftChange(clearCategories(draft, type))}
          >
            {t("onboarding.clear")}
          </button>
        </span>
      </div>
      <div className="categories-step__chips">
        {chips.map((chip) => (
          <SelectableChip
            key={chip}
            label={chip}
            selected={isSelected(draft, type, chip)}
            onToggle={() => onDraftChange(toggleCategory(draft, type, chip))}
          />
        ))}
      </div>
      {chosen.length === 0 && <InfoNote>{t(`onboarding.${type}sNone`)}</InfoNote>}
    </>
  );
};

export default CategoriesStep;
