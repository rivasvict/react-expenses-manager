import dayjs from "dayjs";
import "dayjs/locale/es";
import { defaultTranslator, Translator } from "../../i18n";

/**
 * The day an entry was added, formatted for the entry list, or `null` when
 * the entry has no usable `addedAt` stamp (Unix ms, set when the entry is
 * created). Entries saved before the stamp existed, recurring entries and
 * restored or synced entries from older versions carry none, so callers show
 * nothing for them rather than a made-up date.
 */
export const getEntryAddedDate = (
  addedAt: unknown,
  { t, language }: Pick<Translator, "t" | "language"> = defaultTranslator
): string | null => {
  if (typeof addedAt !== "number" || !Number.isFinite(addedAt)) return null;
  return dayjs(addedAt).locale(language).format(t("time.dateFormat"));
};
