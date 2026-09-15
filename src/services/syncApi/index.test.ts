import { config } from "../../config";
import {
  blockMember,
  cancelParty,
  getBackup,
  getMe,
  login,
  putBackup,
  signup,
} from "./index";
import { SYNC_ERROR_CODES, SyncApiError, isSyncApiError } from "./contract";

/**
 * Unit tests for the sync HTTP client (docs/multi-user-sync/RFC.md §3).
 * `fetch` is stubbed so nothing here touches the network; the point is to pin
 * the request shape each endpoint sends and how failures become SyncApiError.
 */

const HOST = config.REACT_APP_SYNC_API_HOST;

const jane = {
  id: "u1",
  email: "jane@example.com",
  firstName: "Jane",
  lastName: "Doe",
};

// Minimal stand-in for the parts of Response this client actually reads.
const jsonResponse = (body: unknown, { ok = true, status = 200 } = {}) =>
  ({
    ok,
    status,
    json: async () => body,
  }) as Response;

// A response whose body is not JSON — `response.json()` rejects.
const unparseableResponse = ({ ok = false, status = 500 } = {}) =>
  ({
    ok,
    status,
    json: async () => {
      throw new SyntaxError("Unexpected token < in JSON");
    },
  }) as unknown as Response;

let fetchMock: jest.Mock;

beforeEach(() => {
  fetchMock = jest.fn();
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  jest.restoreAllMocks();
});

// The error is thrown asynchronously, so assert on the caught value.
const catchError = async (run: () => Promise<unknown>): Promise<SyncApiError> => {
  try {
    await run();
  } catch (error) {
    return error as SyncApiError;
  }
  throw new Error("Expected the request to reject, but it resolved");
};

describe("syncApi", () => {
  describe("signup", () => {
    it("POSTs the credentials as JSON and returns the auth payload", async () => {
      const payload = { token: "tok", user: jane };
      fetchMock.mockResolvedValue(jsonResponse(payload));

      const credentials = {
        email: jane.email,
        password: "hunter22!",
        firstName: jane.firstName,
        lastName: jane.lastName,
      };
      await expect(signup(credentials)).resolves.toEqual(payload);

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(`${HOST}/api/auth/signup`);
      expect(options.method).toBe("POST");
      expect(options.headers["Content-Type"]).toBe("application/json");
      expect(JSON.parse(options.body)).toEqual(credentials);
    });

    it("sends no Authorization header when no token is involved", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ token: "t", user: jane }));

      await signup({
        email: jane.email,
        password: "pw",
        firstName: "Jane",
        lastName: "Doe",
      });

      expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
    });
  });

  describe("login", () => {
    it("POSTs to the login endpoint and returns the auth payload", async () => {
      const payload = { token: "tok", user: jane };
      fetchMock.mockResolvedValue(jsonResponse(payload));

      await expect(
        login({ email: jane.email, password: "hunter22!" })
      ).resolves.toEqual(payload);

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(`${HOST}/api/auth/login`);
      expect(options.method).toBe("POST");
    });
  });

  describe("getMe", () => {
    it("GETs /api/me with a bearer token and no body", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ user: jane, party: null }));

      await expect(getMe({ token: "tok" })).resolves.toEqual({
        user: jane,
        party: null,
      });

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(`${HOST}/api/me`);
      expect(options.method).toBe("GET");
      expect(options.headers.Authorization).toBe("Bearer tok");
      expect(options.body).toBeUndefined();
    });
  });

  describe("blockMember", () => {
    const party = {
      id: "party-1",
      name: "Jane's Party",
      organizerId: jane.id,
      canceled: false,
      youAreBlocked: false,
      members: [],
    };

    it("POSTs to the member's block path with a bearer token and an empty body", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ party }));

      await expect(
        blockMember({ token: "tok", userId: "u2" })
      ).resolves.toEqual({ party });

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(`${HOST}/api/party/members/u2/block`);
      expect(options.method).toBe("POST");
      expect(options.headers.Authorization).toBe("Bearer tok");
      expect(JSON.parse(options.body)).toEqual({});
    });

    it("percent-encodes the member id so it cannot alter the path", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ party }));

      await blockMember({ token: "tok", userId: "u2/../cancel?x=1" });

      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(
        `${HOST}/api/party/members/${encodeURIComponent("u2/../cancel?x=1")}/block`
      );
    });
  });

  describe("cancelParty", () => {
    it("POSTs to the cancel path with a bearer token and an empty body", async () => {
      const party = {
        id: "party-1",
        name: "Jane's Party",
        organizerId: jane.id,
        canceled: true,
        youAreBlocked: false,
        members: [],
      };
      fetchMock.mockResolvedValue(jsonResponse({ party }));

      await expect(cancelParty({ token: "tok" })).resolves.toEqual({ party });

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(`${HOST}/api/party/cancel`);
      expect(options.method).toBe("POST");
      expect(options.headers.Authorization).toBe("Bearer tok");
      expect(JSON.parse(options.body)).toEqual({});
    });
  });

  describe("backup", () => {
    const envelope = {
      app: "react-expenses-manager",
      schemaVersion: 1,
      exportedAt: "2026-05-15T12:00:00.000Z",
      data: { balance: [], buckets: {}, categories: [], fixedEntries: [] },
    };

    it("getBackup GETs the backup path with a bearer token and no body", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ version: "3", envelope }));

      await expect(getBackup({ token: "tok" })).resolves.toEqual({
        version: "3",
        envelope,
      });

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(`${HOST}/api/party/backup`);
      expect(options.method).toBe("GET");
      expect(options.headers.Authorization).toBe("Bearer tok");
      expect(options.body).toBeUndefined();
    });

    it("getBackup surfaces NO_BACKUP as a SyncApiError for the caller to interpret (EC-1)", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: SYNC_ERROR_CODES.NO_BACKUP,
              message: "No backup has been uploaded yet.",
            },
          },
          { ok: false, status: 404 }
        )
      );

      const error = await catchError(() => getBackup({ token: "tok" }));

      expect(error.code).toBe(SYNC_ERROR_CODES.NO_BACKUP);
      expect(error.status).toBe(404);
    });

    it("putBackup PUTs baseVersion and envelope as JSON with a bearer token", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ version: "4" }));

      await expect(
        putBackup({ token: "tok", baseVersion: "3", envelope })
      ).resolves.toEqual({ version: "4" });

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(`${HOST}/api/party/backup`);
      expect(options.method).toBe("PUT");
      expect(options.headers.Authorization).toBe("Bearer tok");
      expect(JSON.parse(options.body)).toEqual({ baseVersion: "3", envelope });
    });

    it("putBackup sends a literal null baseVersion for the create-only first sync", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ version: "1" }));

      await putBackup({ token: "tok", baseVersion: null, envelope });

      // `null` must survive serialization — an omitted field would be
      // rejected by the server rather than read as "create only".
      expect(JSON.parse(fetchMock.mock.calls[0][1].body).baseVersion).toBeNull();
    });

    it("putBackup surfaces VERSION_CONFLICT with its 409 status (EC-2)", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: SYNC_ERROR_CODES.VERSION_CONFLICT,
              message: "The party backup changed since your download.",
            },
          },
          { ok: false, status: 409 }
        )
      );

      const error = await catchError(() =>
        putBackup({ token: "tok", baseVersion: "1", envelope })
      );

      expect(error.code).toBe(SYNC_ERROR_CODES.VERSION_CONFLICT);
      expect(error.status).toBe(409);
    });
  });

  describe("failures", () => {
    it("surfaces the server's error code and status on a non-ok response", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: SYNC_ERROR_CODES.INVALID_CREDENTIALS,
              message: "Email or password is incorrect.",
            },
          },
          { ok: false, status: 401 }
        )
      );

      const error = await catchError(() =>
        login({ email: jane.email, password: "wrong" })
      );

      expect(isSyncApiError(error)).toBe(true);
      expect(error.code).toBe(SYNC_ERROR_CODES.INVALID_CREDENTIALS);
      expect(error.status).toBe(401);
      expect(error.message).toBe("Email or password is incorrect.");
    });

    it("falls back to a generic error when the failure body is not JSON", async () => {
      fetchMock.mockResolvedValue(unparseableResponse({ status: 500 }));

      const error = await catchError(() => getMe({ token: "tok" }));

      expect(error.code).toBe(SYNC_ERROR_CODES.NETWORK_ERROR);
      expect(error.status).toBe(500);
      expect(error.message).toBe("Something went wrong.");
    });

    it("reports NETWORK_ERROR with a null status when the server is unreachable", async () => {
      fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

      const error = await catchError(() =>
        login({ email: jane.email, password: "pw" })
      );

      expect(error.code).toBe(SYNC_ERROR_CODES.NETWORK_ERROR);
      // Transport failure never reached the server, so there is no status.
      expect(error.status).toBeNull();
      expect(error.message).toBe(
        "Couldn't reach the sync server. Please try again."
      );
    });
  });
});
