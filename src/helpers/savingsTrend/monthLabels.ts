import dayjs from "dayjs";
import "dayjs/locale/es";
import { upperFirst } from "lodash";

export type MonthLabelStyle = "title" | "sentence" | "short";

const FORMATS = { title: "MMMM", sentence: "MMMM", short: "MMM" };

/**
 * A month's name in the UI language, as dayjs's own locale data spells it:
 * `title` is "September" / "Septiembre" (starts a line, or a header),
 * `sentence` reads mid-sentence ("septiembre"), `short` is "Sep" / "sep". Built
 * from a fixed day so a long current month never rolls over (Jan 31 → March).
 */
export const getMonthLabel = (
  month: number,
  language: string,
  style: MonthLabelStyle = "title"
) => {
  const name = dayjs(new Date(2000, month, 1))
    .locale(language)
    .format(FORMATS[style]);
  return style === "title" ? upperFirst(name) : name;
};
