import React from "react";
import { Icon } from "@iconify/react";
import arrowDownIcon from "@iconify-icons/codicon/arrow-down";
import arrowUpIcon from "@iconify-icons/codicon/arrow-up";
import { CategoryType } from "../../../../../helpers/categoryLists/categoryLists";
import "./styles.scss";

/**
 * The money-row icon chip for a category type: a green down ("in") arrow for
 * incomes, a rose up ("out") arrow for expenses. Decorative.
 */
const TypeChip = ({ type }: { type: CategoryType }) => (
  <span className={`type-chip type-chip--${type}`} aria-hidden="true">
    <Icon icon={type === "income" ? arrowDownIcon : arrowUpIcon} />
  </span>
);

export default TypeChip;
