import React, { useRef, useState } from "react";
import type { MonthDate, EntriesTree } from "../../../../helpers/savingsChange/savingsChange";
import {
  getRecordedMonths,
  getReferenceMonth,
  toMonthIndex,
} from "../../../../helpers/savingsTrend/savingsTrend";
import RangeSwitch from "../RangeSwitch";
import CustomRangeSheet from "../CustomRangeSheet";
import type { TrendRangeState } from "../TrendRangeContext";

interface RangeControlsProps {
  entries: EntriesTree;
  selectedDate: MonthDate;
  onSelectedDateChange: (date: MonthDate) => void;
  range: TrendRangeState;
}

/**
 * The range switch (1M … YTD and the calendar button) and the custom range
 * sheet it opens, shared by the Savings and the Categories trend views.
 */
const RangeControls = ({
  entries,
  selectedDate,
  onSelectedDateChange,
  range: { requested, resolved, setPicked },
}: RangeControlsProps) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const customButtonRef = useRef<HTMLButtonElement>(null);

  const closeSheet = () => {
    setIsSheetOpen(false);
    customButtonRef.current?.focus();
  };
  const applyCustomRange = ({ from, to }: { from: MonthDate; to: MonthDate }) => {
    setPicked({ kind: "custom", monthsBack: toMonthIndex(to) - toMonthIndex(from) });
    if (toMonthIndex(to) !== toMonthIndex(selectedDate)) {
      onSelectedDateChange({ year: to.year, month: to.month });
    }
    closeSheet();
  };

  return (
    <>
      <RangeSwitch
        end={selectedDate}
        active={requested}
        isCustomDisabled={resolved.status === "empty"}
        onSelectPreset={(id) => setPicked({ kind: "preset", id })}
        onOpenCustom={() => setIsSheetOpen(true)}
        customButtonRef={customButtonRef}
      />
      {resolved.status === "ready" && isSheetOpen && (
        <CustomRangeSheet
          months={getRecordedMonths(entries)}
          initialFrom={getReferenceMonth(selectedDate, resolved.monthsBack)}
          initialTo={selectedDate}
          onApply={applyCustomRange}
          onClose={closeSheet}
        />
      )}
    </>
  );
};

export default RangeControls;
