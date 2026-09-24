// TODO: This file has no colocated unit test; it was edited, not created,
// by the EN/ES translations change. Tracked in:
// https://github.com/rivasvict/react-expenses-manager/issues/187
import React from "react";
import { Icon } from "@iconify/react";
import searchIcon from "@iconify-icons/codicon/search";
import { useTranslation } from "../../../../i18n";
import "./styles.scss";

type FilterEmptyStateProps = {
  onClearAll: () => void;
};

/** Dashed-border card shown when the active filters match zero entries. */
const FilterEmptyState = ({ onClearAll }: FilterEmptyStateProps) => {
  const { t } = useTranslation();
  return (
    <div className="filter-empty-state">
      <span className="filter-empty-state__icon" aria-hidden="true">
        <Icon icon={searchIcon} />
      </span>
      <p className="filter-empty-state__title">{t("filterEmpty.title")}</p>
      <p className="filter-empty-state__hint">{t("filterEmpty.hint")}</p>
      <button
        type="button"
        className="btn btn-secondary filter-empty-state__clear"
        onClick={onClearAll}
      >
        {t("filterEmpty.clearAll")}
      </button>
    </div>
  );
};

export default FilterEmptyState;
