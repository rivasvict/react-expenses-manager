import { diffPixels } from "./pixelDiff";

// A 2x2 image from four [r, g, b, a] pixels.
const image = (...pixels) => Uint8ClampedArray.from(pixels.flat());

const WHITE = [255, 255, 255, 255];
const BLACK = [0, 0, 0, 255];

describe("diffPixels", () => {
  it("reports no difference for identical images", () => {
    const a = image(WHITE, BLACK, WHITE, BLACK);
    expect(diffPixels(a, a, 2, 2, 0)).toMatchObject({ differing: 0, ratio: 0 });
  });

  it("counts and ratios the pixels that differ", () => {
    const a = image(WHITE, WHITE, WHITE, WHITE);
    const b = image(WHITE, BLACK, WHITE, BLACK);
    expect(diffPixels(a, b, 2, 2, 0)).toMatchObject({
      differing: 2,
      ratio: 0.5,
    });
  });

  it("ignores channel differences within the tolerance", () => {
    const a = image([100, 100, 100, 255], WHITE, WHITE, WHITE);
    const b = image([110, 95, 100, 255], WHITE, WHITE, WHITE);
    expect(diffPixels(a, b, 2, 2, 10).differing).toBe(0);
    expect(diffPixels(a, b, 2, 2, 9).differing).toBe(1);
  });

  it("treats an alpha difference as a difference", () => {
    const a = image([0, 0, 0, 255], WHITE, WHITE, WHITE);
    const b = image([0, 0, 0, 0], WHITE, WHITE, WHITE);
    expect(diffPixels(a, b, 2, 2, 5).differing).toBe(1);
  });

  it("paints differing pixels magenta and fades the rest", () => {
    const a = image(BLACK, WHITE, WHITE, WHITE);
    const b = image(WHITE, WHITE, WHITE, WHITE);
    const { diff } = diffPixels(a, b, 2, 2, 0);
    expect([...diff.slice(0, 4)]).toEqual([255, 0, 255, 255]);
    expect([...diff.slice(4, 8)]).toEqual([255, 255, 255, 255]);
  });

  it("handles an empty image", () => {
    expect(
      diffPixels(new Uint8ClampedArray(0), new Uint8ClampedArray(0), 0, 0, 0)
    ).toMatchObject({ differing: 0, ratio: 0 });
  });

  it("survives being injected as source (no closures), as the review script does", () => {
    // eslint-disable-next-line no-new-func
    const injected = new Function(`return (${diffPixels.toString()})`)();
    const a = image(WHITE, WHITE, WHITE, WHITE);
    const b = image(WHITE, BLACK, WHITE, WHITE);
    expect(injected(a, b, 2, 2, 0).differing).toBe(1);
  });
});
