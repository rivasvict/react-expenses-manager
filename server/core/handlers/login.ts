// POST /api/auth/login (RFC §3, endpoint 2). Every failure returns the same
// generic 401 body, and takes the same scrypt work, so neither the response
// nor its timing reveals whether an account exists (AC-1.5).
import { hashPassword, verifyPassword } from "../crypto";
import {
  Handler,
  IssueSession,
  LoginRequestBody,
  UserRecord,
} from "../handlers.types";
import { HTTP_STATUS } from "../httpConstants";
import { StorageAdapter } from "../storage";
import { invalidCredentials } from "./responses";
import { userKey } from "./userKeys";
import { isNonEmptyString } from "./validation";

interface CreateLoginHandlerOptions {
  storage: StorageAdapter;
  issueSession: IssueSession;
}

// Input for the throwaway hash that equalizes login timing (see below). Not a
// secret and deliberately not configurable: it is never compared against a
// real credential, its hash never leaves the process, and `hashPassword` salts
// it randomly on every handler set, so its value carries no security weight.
// Sourcing it from the environment would only add a variable that must never
// be misconfigured — and one that could be set to some real user's password.
const DUMMY_TIMING_EQUALIZER_PASSWORD = "dummy-timing-equalizer";

export const createLoginHandler = ({
  storage,
  issueSession,
}: CreateLoginHandlerOptions): Handler => {
  // Hashed once per handler set; only used to equalize login timing below.
  const dummyPasswordRecord = hashPassword(DUMMY_TIMING_EQUALIZER_PASSWORD);

  return async ({ body }) => {
    const { email, password } = (body || {}) as LoginRequestBody;
    if (!isNonEmptyString(email) || !isNonEmptyString(password))
      return invalidCredentials();
    const user = await storage.readJson<UserRecord>(userKey(email));
    if (!user) {
      // AC-1.5 also covers timing: without this, an unknown email would
      // return before any scrypt work and reveal account existence. Burn
      // the same hashing cost against a dummy record, then fail generically.
      verifyPassword(password, dummyPasswordRecord);
      return invalidCredentials();
    }
    if (!verifyPassword(password, user.password)) return invalidCredentials();
    return { status: HTTP_STATUS.OK, body: issueSession(user) };
  };
};
