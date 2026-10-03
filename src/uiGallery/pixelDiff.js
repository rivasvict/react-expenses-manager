// Compares two same-sized RGBA images pixel by pixel. Pure and fully
// self-contained (no closures, no imports) on purpose: scripts/designReview.js
// injects this function's source into a browser page, where it runs on canvas
// pixel data, so no image library is needed (design/README.md).
// CommonJS for the same reason as scanFeatures.js.

// `a` and `b` are RGBA arrays of `width * height * 4` bytes. A pixel counts as
// different when any color channel differs by more than `tolerance` (0–255),
// which absorbs sub-pixel anti-aliasing noise. Returns the number and ratio of
// differing pixels and an RGBA image of the diff: differing pixels in
// magenta over a faded copy of `a`.
const diffPixels = (a, b, width, height, tolerance) => {
  const total = width * height;
  const diff = new Uint8ClampedArray(total * 4);
  let differing = 0;
  for (let pixel = 0; pixel < total; pixel += 1) {
    const offset = pixel * 4;
    const delta = Math.max(
      Math.abs(a[offset] - b[offset]),
      Math.abs(a[offset + 1] - b[offset + 1]),
      Math.abs(a[offset + 2] - b[offset + 2]),
      Math.abs(a[offset + 3] - b[offset + 3])
    );
    if (delta > tolerance) {
      differing += 1;
      diff[offset] = 255;
      diff[offset + 1] = 0;
      diff[offset + 2] = 255;
      diff[offset + 3] = 255;
    } else {
      diff[offset] = 128 + a[offset] / 2;
      diff[offset + 1] = 128 + a[offset + 1] / 2;
      diff[offset + 2] = 128 + a[offset + 2] / 2;
      diff[offset + 3] = 255;
    }
  }
  return {
    differing,
    ratio: total === 0 ? 0 : differing / total,
    diff,
  };
};

module.exports = { diffPixels };
