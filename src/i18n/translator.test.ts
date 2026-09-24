import { createTranslator, defaultTranslator } from "./translator";

describe("createTranslator", () => {
  const english = createTranslator("en");
  const spanish = createTranslator("es");

  it("returns the text for the language", () => {
    expect(english.t("nav.home")).toBe("Home");
    expect(spanish.t("nav.home")).toBe("Inicio");
  });

  it("fills in {{placeholders}}", () => {
    expect(english.t("bucket.spent", { amount: "$5.00" })).toBe(
      "Spent: $5.00"
    );
    expect(spanish.t("bucket.spent", { amount: "$5.00" })).toBe(
      "Gastado: $5.00"
    );
  });

  it("leaves a placeholder visible when its param is missing", () => {
    expect(english.t("bucket.spent")).toBe("Spent: {{amount}}");
  });

  it("picks the plural form by count", () => {
    expect(english.plural("entries.count", 1)).toBe("1 entry");
    expect(english.plural("entries.count", 0)).toBe("0 entries");
    expect(english.plural("entries.count", 3)).toBe("3 entries");
    expect(spanish.plural("entries.count", 1)).toBe("1 movimiento");
    expect(spanish.plural("entries.count", 3)).toBe("3 movimientos");
  });

  it("exposes its language", () => {
    expect(spanish.language).toBe("es");
  });

  it("defaults to English", () => {
    expect(defaultTranslator.language).toBe("en");
    expect(defaultTranslator.t("common.cancel")).toBe("Cancel");
  });
});
