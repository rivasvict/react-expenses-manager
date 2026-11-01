import { act, renderHook } from "@testing-library/react";
import useIsSheetLayout from "./useIsSheetLayout";

type Listener = () => void;

const mockMatchMedia = (initialMatches: boolean) => {
  let matches = initialMatches;
  const listeners = new Set<Listener>();
  window.matchMedia = jest.fn().mockImplementation(() => ({
    get matches() {
      return matches;
    },
    addEventListener: (_event: string, listener: Listener) =>
      listeners.add(listener),
    removeEventListener: (_event: string, listener: Listener) =>
      listeners.delete(listener),
  })) as unknown as typeof window.matchMedia;
  return (next: boolean) => {
    matches = next;
    listeners.forEach((listener) => listener());
  };
};

describe("useIsSheetLayout", () => {
  const original = window.matchMedia;
  afterEach(() => {
    window.matchMedia = original;
  });

  it("is false when matchMedia is not available", () => {
    window.matchMedia = undefined as unknown as typeof window.matchMedia;
    expect(renderHook(() => useIsSheetLayout()).result.current).toBe(false);
  });

  it("starts from the current match and follows later changes", () => {
    const setMatches = mockMatchMedia(true);
    const { result } = renderHook(() => useIsSheetLayout());
    expect(result.current).toBe(true);

    act(() => setMatches(false));
    expect(result.current).toBe(false);
  });
});
