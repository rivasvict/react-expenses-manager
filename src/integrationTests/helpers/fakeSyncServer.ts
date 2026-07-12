// In-memory fetch stub implementing the auth portion of the sync API
// contract (RFC §3, endpoints 1–3) so integration tests never touch the
// network (NFR-5). Party/backup endpoints join in later PRs.
import { config } from "../../config";
import { setSession, SyncSession } from "../../services/session";
import { SyncUser } from "../../services/syncApi/contract";

interface FakeUserSeed {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface FakeUserRecord extends FakeUserSeed {
  id: string;
}

export interface FakeSyncServer {
  /** Creates an account directly on the fake server (no UI involved). */
  seedUser: (seed: FakeUserSeed) => SyncUser;
  /** Pre-writes sync.session for a seeded user — a logged-in app start. */
  loginAs: (email: string) => SyncSession;
  /** Restores whatever window.fetch was before install. */
  restore: () => void;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const base64url = (text: string): string =>
  window.btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

// Same compact shape as real tokens (base64url(payload).sig) so the client's
// local expiry check reads it identically; the signature is not verified
// client-side.
const makeToken = (userId: string): string => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    iat: nowSeconds,
    exp: nowSeconds + THIRTY_DAYS_MS / 1000,
  };
  return `${base64url(JSON.stringify(payload))}.fake-signature`;
};

export const installFakeSyncServer = (): FakeSyncServer => {
  const users: FakeUserRecord[] = [];
  let nextId = 1;
  const baseUrl = config.REACT_APP_SYNC_API_HOST;

  const publicUser = ({ id, email, firstName, lastName }: FakeUserRecord): SyncUser => ({
    id,
    email,
    firstName,
    lastName,
  });

  const findByEmail = (email: string) =>
    users.find(
      (user) => user.email.toLowerCase() === (email || "").toLowerCase()
    );

  const jsonResponse = (status: number, body: unknown): Response =>
    ({
      ok: status < 400,
      status,
      json: async () => body,
    } as Response);

  const errorResponse = (status: number, code: string, message: string) =>
    jsonResponse(status, { error: { code, message } });

  const createUser = (seed: FakeUserSeed): FakeUserRecord => {
    const user: FakeUserRecord = { ...seed, id: `user-${nextId++}` };
    users.push(user);
    return user;
  };

  const handle = (
    method: string,
    path: string,
    body: any,
    headers: Record<string, string>
  ): Response => {
    if (method === "POST" && path === "/api/auth/signup") {
      const { email, password, firstName, lastName } = body || {};
      if (!email || !password || !firstName || !lastName)
        return errorResponse(400, "VALIDATION_ERROR", "All fields are required.");
      if (findByEmail(email))
        return errorResponse(
          409,
          "EMAIL_TAKEN",
          "An account with this email already exists."
        );
      const user = createUser({ email, password, firstName, lastName });
      return jsonResponse(201, {
        token: makeToken(user.id),
        user: publicUser(user),
      });
    }

    if (method === "POST" && path === "/api/auth/login") {
      const { email, password } = body || {};
      const user = findByEmail(email);
      // AC-1.5: identical body whether the email exists or not.
      if (!user || user.password !== password)
        return errorResponse(
          401,
          "INVALID_CREDENTIALS",
          "Email or password is incorrect."
        );
      return jsonResponse(200, {
        token: makeToken(user.id),
        user: publicUser(user),
      });
    }

    if (method === "GET" && path === "/api/me") {
      const match = /^Bearer (.+)$/.exec(headers.Authorization || "");
      const userId = match
        ? (() => {
            try {
              return JSON.parse(window.atob(match[1].split(".")[0])).sub;
            } catch (error) {
              return null;
            }
          })()
        : null;
      const user = users.find((candidate) => candidate.id === userId);
      if (!user)
        return errorResponse(401, "UNAUTHORIZED", "You need to sign in again.");
      return jsonResponse(200, { user: publicUser(user), party: null });
    }

    return errorResponse(404, "NOT_FOUND", "Not found.");
  };

  const previousFetch = window.fetch;
  window.fetch = (async (input: any, init: any = {}) => {
    const url = typeof input === "string" ? input : input?.url;
    if (typeof url !== "string" || !url.startsWith(baseUrl)) {
      throw new Error(
        `fakeSyncServer: unexpected fetch to ${url} — tests must not touch the network`
      );
    }
    const path = url.slice(baseUrl.length);
    const body = init.body ? JSON.parse(init.body) : null;
    return handle(init.method || "GET", path, body, init.headers || {});
  }) as typeof fetch;

  return {
    seedUser: (seed) => publicUser(createUser(seed)),
    loginAs: (email) => {
      const user = findByEmail(email);
      if (!user)
        throw new Error(`fakeSyncServer.loginAs: no seeded user for ${email}`);
      const session: SyncSession = {
        token: makeToken(user.id),
        user: publicUser(user),
      };
      setSession(session);
      return session;
    },
    restore: () => {
      window.fetch = previousFetch;
    },
  };
};
