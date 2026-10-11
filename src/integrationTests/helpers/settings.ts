import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

/**
 * Opens a Settings sheet from its row, picks one option and lets the sheet
 * close. `rowName` is the row's label in the language currently shown
 * ("Language", "Idioma", …) and `optionName` the option's name.
 */
const pickFromSheet = async (
  user: UserEvent,
  rowName: RegExp,
  optionName: RegExp,
) => {
  await user.click(await screen.findByRole("button", { name: rowName }));
  await user.click(await screen.findByRole("radio", { name: optionName }));
};

/** Pick a language on /settings; `rowName` defaults to the English label. */
export const pickLanguage = (
  user: UserEvent,
  languageName: RegExp,
  rowName: RegExp = /^Language/,
) => pickFromSheet(user, rowName, languageName);

/** Pick a currency on /settings; `rowName` defaults to the English label. */
export const pickCurrency = (
  user: UserEvent,
  currencyName: RegExp,
  rowName: RegExp = /^Currency/,
) => pickFromSheet(user, rowName, currencyName);
