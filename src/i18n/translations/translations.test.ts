import en from "./en";
import es from "./es";

const DICTIONARIES = { es };
const PLACEHOLDER = /\{\{\s*(\w+)\s*\}\}/g;
const TAG = /<\/?(\w+)>/g;

const matchesOf = (text: string, pattern: RegExp) =>
  Array.from(text.matchAll(pattern), (match) => match[1]).sort();

// These checks back up the `Translations` type: they also catch what a type
// cannot, such as a dropped placeholder or an empty string.
describe.each(Object.entries(DICTIONARIES))("%s translations", (name, dictionary) => {
  it("has exactly the English keys", () => {
    expect(Object.keys(dictionary).sort()).toEqual(Object.keys(en).sort());
  });

  it.each(Object.keys(en))("%s keeps the English placeholders and tags", (key) => {
    const text = dictionary[key as keyof typeof en];
    const source = en[key as keyof typeof en];
    expect(text.trim()).not.toBe("");
    expect(matchesOf(text, PLACEHOLDER)).toEqual(matchesOf(source, PLACEHOLDER));
    expect(matchesOf(text, TAG)).toEqual(matchesOf(source, TAG));
  });
});

describe("plural keys", () => {
  it("always come in _one / _other pairs", () => {
    const keys = Object.keys(en);
    keys
      .filter((key) => key.endsWith("_one"))
      .forEach((key) =>
        expect(keys).toContain(key.replace(/_one$/, "_other"))
      );
    keys
      .filter((key) => key.endsWith("_other"))
      .forEach((key) => expect(keys).toContain(key.replace(/_other$/, "_one")));
  });
});
