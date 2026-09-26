import { createSyncApiError } from "../services/syncApi/contract";
import { getSyncErrorMessage } from "./syncErrorMessage";
import { createTranslator } from "./translator";

const english = createTranslator("en");
const spanish = createTranslator("es");

describe("getSyncErrorMessage", () => {
  const blocked = createSyncApiError({
    code: "BLOCKED",
    message: "You've been removed from this party by its organizer.",
  });

  it("keeps the server's own wording in English", () => {
    expect(getSyncErrorMessage(blocked, english, "signIn.failed")).toBe(
      "You've been removed from this party by its organizer."
    );
  });

  it("translates by error code in Spanish", () => {
    expect(getSyncErrorMessage(blocked, spanish, "signIn.failed")).toBe(
      spanish.t("syncError.BLOCKED")
    );
  });

  it("falls back to the given key when there is no message", () => {
    expect(getSyncErrorMessage(null, english, "signIn.failed")).toBe(
      "Could not sign in. Please try again."
    );
    expect(getSyncErrorMessage(undefined, spanish, "signIn.failed")).toBe(
      spanish.t("signIn.failed")
    );
  });

  it("shows an unknown code's own message rather than a wrong translation", () => {
    const unknown = { code: "SOMETHING_NEW", message: "New failure." };
    expect(getSyncErrorMessage(unknown, spanish, "signIn.failed")).toBe(
      "New failure."
    );
  });
});
