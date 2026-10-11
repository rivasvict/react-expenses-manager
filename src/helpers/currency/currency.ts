/**
 * The currency amounts are displayed in. Like the UI language, it is a
 * per-device preference: it lives in localStorage on its own key and never
 * touches the entries model, the backup format or the sync server, so two
 * people sharing data can each see it in their own currency symbol.
 */
export const CURRENCY_STORAGE_KEY = "settings.currency";

export const SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "MXN",
  "BRL",
  "COP",
  "ARS",
  "CLP",
  "JPY",
  "INR",
] as const;

export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: Currency = "USD";

/**
 * Each currency's own symbol. Spelled out rather than taken from `Intl`,
 * which shows the bare ISO code for some (COP, ARS, CLP) and the same "$"
 * for every dollar under `narrowSymbol`.
 */
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "CA$",
  AUD: "A$",
  MXN: "MX$",
  BRL: "R$",
  COP: "COL$",
  ARS: "AR$",
  CLP: "CLP$",
  JPY: "¥",
  INR: "₹",
};

export const isSupportedCurrency = (value: unknown): value is Currency =>
  typeof value === "string" &&
  (SUPPORTED_CURRENCIES as readonly string[]).includes(value);

/**
 * The stored currency, or US Dollar when nothing (or something unknown) is
 * stored or storage cannot be read (private mode, blocked site data).
 */
export const getStoredCurrency = (): Currency => {
  try {
    const storedCurrency = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    return isSupportedCurrency(storedCurrency)
      ? storedCurrency
      : DEFAULT_CURRENCY;
  } catch (error) {
    return DEFAULT_CURRENCY;
  }
};

export const storeCurrency = (currency: Currency): void => {
  try {
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  } catch (error) {
    // Nothing to fall back to: amounts keep the previous currency.
  }
};

export const getCurrencySymbol = (currency: Currency = getStoredCurrency()) =>
  CURRENCY_SYMBOLS[currency];

const formatters = new Map<Currency, Intl.NumberFormat>();

const getFormatter = (currency: Currency) => {
  if (!formatters.has(currency)) {
    formatters.set(
      currency,
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        currencyDisplay: "narrowSymbol",
      })
    );
  }
  return formatters.get(currency) as Intl.NumberFormat;
};

/**
 * "$1,620.00" in the stored currency: digit grouping and the number of
 * decimals follow the currency (none for JPY or CLP), and the symbol is the
 * one in `CURRENCY_SYMBOLS`. A non-numeric amount reads as zero.
 */
export const formatCurrency = (
  amount: number | string,
  currency: Currency = getStoredCurrency()
): string => {
  const numericAmount = Number(amount);
  return getFormatter(currency)
    .formatToParts(isNaN(numericAmount) ? 0 : numericAmount)
    .map((part) =>
      part.type === "currency" ? CURRENCY_SYMBOLS[currency] : part.value
    )
    .join("");
};
