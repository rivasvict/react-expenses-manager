import React, { forwardRef } from "react";
import TypeChip from "../TypeChip";
import { CategoryType } from "../../../../../helpers/categoryLists/categoryLists";
import "./styles.scss";

interface CategoryRowProps {
  type: CategoryType;
  name: string;
  /** "5 expenses · Bucket $400.00/mo" or "Not used yet". */
  meta: string;
  onOpen: () => void;
}

/**
 * One category on the Categories screen: its type chip, name and usage, and
 * a chevron. The whole row is a button whose name starts with the category
 * name; it opens the category sheet.
 */
const CategoryRow = forwardRef<HTMLButtonElement, CategoryRowProps>(
  ({ type, name, meta, onOpen }, ref) => (
    <button
      type="button"
      className="category-row"
      aria-haspopup="dialog"
      ref={ref}
      onClick={onOpen}
    >
      <TypeChip type={type} />
      <span className="category-row__main">
        <span className="category-row__name">{name}</span>
        <span className="category-row__meta">{meta}</span>
      </span>
      <span className="category-row__chevron" aria-hidden="true">
        ›
      </span>
    </button>
  )
);

export default CategoryRow;
