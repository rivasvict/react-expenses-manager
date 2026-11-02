import { createTranslator, defaultTranslator } from "./translator";

describe("createTranslator", () => {
  const english = createTranslator("en");
  const spanish = createTranslator("es");
  const french = createTranslator("fr");

  it("returns the text for the language", () => {
    expect(english.t("nav.home")).toBe("Home");
    expect(spanish.t("nav.home")).toBe("Inicio");
    expect(french.t("nav.home")).toBe("Accueil");
  });

  it("fills in {{placeholders}}", () => {
    expect(english.t("buckets.allocation", { month: "May", amount: "$5.00" })).toBe(
      "May allocation: $5.00"
    );
    expect(spanish.t("buckets.allocation", { month: "Mayo", amount: "$5.00" })).toBe(
      "Asignado en Mayo: $5.00"
    );
  });

  it("leaves a placeholder visible when its param is missing", () => {
    expect(english.t("bucket.edit")).toBe("Edit {{category}}");
  });

  it("picks the plural form by count", () => {
    expect(english.plural("entries.count", 1)).toBe("1 entry");
    expect(english.plural("entries.count", 0)).toBe("0 entries");
    expect(english.plural("entries.count", 3)).toBe("3 entries");
    expect(spanish.plural("entries.count", 1)).toBe("1 movimiento");
    expect(spanish.plural("entries.count", 3)).toBe("3 movimientos");
    // French treats 0 as singular.
    expect(french.plural("entries.count", 0)).toBe("0 opération");
    expect(french.plural("entries.count", 3)).toBe("3 opérations");
  });

  it("names the plural key it would pick, for Trans", () => {
    expect(english.pluralKey("entries.count", 1)).toBe("entries.count_one");
    expect(english.pluralKey("entries.count", 2)).toBe("entries.count_other");
    expect(french.pluralKey("entries.count", 0)).toBe("entries.count_one");
  });

  it("exposes its language", () => {
    expect(spanish.language).toBe("es");
  });

  it("defaults to English", () => {
    expect(defaultTranslator.language).toBe("en");
    expect(defaultTranslator.t("common.cancel")).toBe("Cancel");
  });
});
