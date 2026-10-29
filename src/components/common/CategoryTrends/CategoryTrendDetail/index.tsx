import React, { useRef, useState } from "react";
import { connect } from "react-redux";
import { Redirect, useHistory, useParams } from "react-router-dom";
import { useTranslation } from "../../../../i18n";
import { MainContentContainer } from "../../MainContentContainer";
import { NavigableMonthHeader } from "../../NavigableMonthHeader";
import type { MonthDate } from "../../../../helpers/savingsChange/savingsChange";
import {
  CategoryType,
  isCategoryType,
} from "../../../../helpers/categoryLists/categoryLists";
import {
  categoryTrendPath,
  findCategoryInPath,
  getCategoryTrend,
  hasEntriesInRange,
} from "../../../../helpers/categoryTrends/categoryTrends";
import { getMonthLabel } from "../../../../helpers/savingsTrend/monthLabels";
import ScopeSwitch, { SCOPE_ROUTES } from "../../SavingsTrend/ScopeSwitch";
import RangeControls from "../../SavingsTrend/RangeControls";
import RangeNotice from "../../SavingsTrend/RangeNotice";
import HistoryNotice from "../../SavingsTrend/HistoryNotice";
import { useTrendRange } from "../../SavingsTrend/TrendRangeContext";
import TypeChip from "../../ExpensesManager/Categories/TypeChip";
import { mapActionsToProps, mapStateToProps } from "..";
import BackLink from "../BackLink";
import CategoryLocation from "../CategoryLocation";
import CategoryPicker from "../CategoryPicker";
import CategoryPickerSheet, { PickedCategory } from "../CategoryPickerSheet";
import CategoryTrendSummary from "../CategoryTrendSummary";
import CategoryTrendChart, { CategoryTrendView } from "../CategoryTrendChart";

type CategoryTrendDetailProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapActionsToProps>;

/**
 * One category's trend (design/features/category-trends/ui/approved/ and
 * category-trends-polish/): the back link over the category picker, the month and range shared with the other trend views, and
 * a headline card with Per month (the default) and Change tabs over the line
 * chart. A category that no longer exists sends the user back to the list.
 */
const CategoryTrendDetail = ({
  entries,
  selectedDate,
  categoryLists,
  categoryListsLoaded,
  onSelectedDateChange,
}: CategoryTrendDetailProps) => {
  const { t, language } = useTranslation();
  const history = useHistory();
  const params = useParams<{ type: string; name: string }>();
  // The tab survives moving the month or range, and picking another category.
  const [view, setView] = useState<CategoryTrendView>("perMonth");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLButtonElement>(null);
  const range = useTrendRange(entries, selectedDate);
  const type: CategoryType | null = isCategoryType(params.type) ? params.type : null;
  const name = type && findCategoryInPath(categoryLists[type], params.name);

  // The lists load from storage after the first render: until then there is
  // nothing to look the category up in yet.
  if (type && !name && !categoryListsLoaded) return null;
  if (!type || !name) return <Redirect to={SCOPE_ROUTES.categories} />;

  const { resolved } = range;
  const trend =
    resolved.status === "ready"
      ? getCategoryTrend(entries, type, name, selectedDate, resolved.monthsBack)
      : null;
  // With the year when the range crosses one ("November 2025"), as elsewhere.
  const monthName = (date: MonthDate) =>
    `${getMonthLabel(date.month, language, "sentence")}${
      trend && trend.reference.year !== trend.end.year ? ` ${date.year}` : ""
    }`;
  const closePicker = () => {
    setIsPickerOpen(false);
    pickerRef.current?.focus();
  };
  const pick = (category: PickedCategory) =>
    history.replace(categoryTrendPath(category.type, category.name));

  return (
    <MainContentContainer className="category-trend-detail">
      <h3 className="visually-hidden">{t("categoryTrends.pageTitle")}</h3>
      <ScopeSwitch active="categories" />
      <NavigableMonthHeader />
      <CategoryLocation>
        <BackLink
          to={{ pathname: SCOPE_ROUTES.categories, state: { type } }}
          label={t("categoryTrends.back")}
        />
        <CategoryPicker ref={pickerRef} type={type} name={name} onOpen={() => setIsPickerOpen(true)} />
      </CategoryLocation>
      <RangeControls
        entries={entries}
        selectedDate={selectedDate}
        onSelectedDateChange={onSelectedDateChange}
        range={range}
      />
      <RangeNotice range={range} />
      {trend && hasEntriesInRange(trend) && (
        <>
          <CategoryTrendSummary trend={trend} view={view} onViewChange={setView} />
          <CategoryTrendChart
            key={`${view}-${type}-${name}-${trend.reference.year}-${trend.reference.month}`}
            trend={trend}
            view={view}
          />
        </>
      )}
      {trend && !hasEntriesInRange(trend) && (
        <HistoryNotice
          icon={<TypeChip type={type} />}
          title={t(`categoryTrends.none.${type}.title`, { category: name })}
          body={t(`categoryTrends.none.${type}.body`, {
            from: monthName(trend.reference),
            to: monthName(trend.end),
          })}
          action={{
            label: t("categoryTrends.none.action"),
            onClick: () => setIsPickerOpen(true),
            variant: "secondary",
          }}
        />
      )}
      {isPickerOpen && (
        <CategoryPickerSheet
          categoryLists={categoryLists}
          current={{ type, name }}
          amountOf={(category) =>
            getCategoryTrend(entries, category.type, category.name, selectedDate, 0).end.amount
          }
          onPick={pick}
          onClose={closePicker}
        />
      )}
    </MainContentContainer>
  );
};

export default connect(mapStateToProps, mapActionsToProps)(CategoryTrendDetail);
