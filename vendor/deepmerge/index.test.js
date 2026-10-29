// Covers the one change made to the vendored deepmerge (see index.js) and
// that the behaviour its two consumers rely on is unchanged.
const deepmerge = require("./index");

const withOwnProto = () => JSON.parse('{"__proto__": {"polluted": "yes"}, "a": 1}');

describe("vendored deepmerge", () => {
  it("keeps Object.prototype when the target has an own __proto__ key", () => {
    const merged = deepmerge(withOwnProto(), { b: 2 });

    expect(Object.getPrototypeOf(merged)).toBe(Object.prototype);
    expect(merged.polluted).toBeUndefined();
    expect(merged).toEqual(expect.objectContaining({ a: 1, b: 2 }));
  });

  it("keeps Object.prototype for nested and deepmerge.all merges", () => {
    const nested = deepmerge({ inner: { a: 1 } }, { inner: withOwnProto() });
    const all = deepmerge.all([withOwnProto(), { b: 2 }]);

    expect(Object.getPrototypeOf(nested.inner)).toBe(Object.prototype);
    expect(nested.inner.polluted).toBeUndefined();
    expect(Object.getPrototypeOf(all)).toBe(Object.prototype);
    expect(all.polluted).toBeUndefined();
  });

  it("still deep-merges objects and concatenates arrays", () => {
    const merged = deepmerge(
      { a: { x: 1 }, list: [1], keep: true },
      { a: { y: 2 }, list: [2] },
    );

    expect(merged).toEqual({ a: { x: 1, y: 2 }, list: [1, 2], keep: true });
  });

  it("honours a custom arrayMerge, as jest-config uses", () => {
    const overwrite = (_target, source) => source;
    const merged = deepmerge({ list: [1, 2] }, { list: [3] }, { arrayMerge: overwrite });

    expect(merged).toEqual({ list: [3] });
  });
});
