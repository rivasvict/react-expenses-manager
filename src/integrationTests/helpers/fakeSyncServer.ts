// In-memory fetch stub implementing the sync API contract (RFC §3,
// endpoints 1–10: auth, party, invitations, backup) so integration tests
// never touch the network (NFR-5).
import { config } from "../../config";
import { setSession, SyncSession } from "../../services/session";
import {
  BackupEnvelope,
  Party,
  SyncUser,
} from "../../services/syncApi/contract";

interface FakeUserSeed {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface FakeUserRecord extends FakeUserSeed {
  id: string;
  partyId: string | null;
}

interface FakeInvitation {
  password: string;
  used: boolean;
}

interface FakePartyRecord {
  id: string;
  name: string;
  organizerId: string;
  canceled: boolean;
  memberIds: { id: string; blocked: boolean }[];
  // Keyed by normalized code. Plaintext is fine here — this is an
  // in-memory test double, not at-rest storage.
  invitations: { [code: string]: FakeInvitation };
  backup: { version: string; envelope: BackupEnvelope } | null;
}

export interface FakeSyncServer {
  /** Creates an account directly on the fake server (no UI involved). */
  seedUser: (seed: FakeUserSeed) => SyncUser;
  /** Pre-writes sync.session for a seeded user — a logged-in app start. */
  loginAs: (email: string) => SyncSession;
  /**
   * Creates a party with already-seeded users: the first email becomes the
   * organizer, the rest join as members. Options seed pre-blocked members
   * (by email) or a canceled party. Returns the party id.
   */
  seedPartyWithMembers: (
    emails: string[],
    options?: { blocked?: string[]; canceled?: boolean }
  ) => string;
  /** Adds a redeemable invitation to the seeded party; returns the code. */
  seedInvitation: (options: { password: string; used?: boolean }) => string;
  /** Flags an already-seeded member as blocked (state transition). */
  seedBlockMember: (email: string) => void;
  /** Cancels the seeded party (state transition). */
  seedCancelParty: () => void;
  /** Stores a remote backup for the seeded party ("uploaded by Tom"). */
  seedRemoteBackup: (envelope: BackupEnvelope) => void;
  /** Everything PUT to /api/party/backup, in order. */
  getUploadedBackups: () => { baseVersion: string | null; envelope: BackupEnvelope }[];
  /** Every request the app made, as "METHOD /path" strings (AC-3.1). */
  getRequests: () => string[];
  /**
   * Makes the next request matching "METHOD /path" fail once: with the
   * given contract error (e.g. 409 VERSION_CONFLICT), or with a network
   * failure when no error is given. Repeated calls queue up.
   */
  failNext: (
    request: string,
    error?: { status: number; code: string; message: string }
  ) => void;
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

// Inverse of makeToken's payload encoding; null on any malformed input.
const decodeTokenPayload = (
  token: string
): { sub: string; iat: number; exp: number } | null => {
  try {
    const base64 = token.split(".")[0].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(base64));
  } catch (error) {
    return null;
  }
};

// Same normalization as the real server: "K7X9-QP2M" ≡ "k7x9qp2m".
const normalizeCode = (code: string): string =>
  String(code || "").replace(/-/g, "").trim().toUpperCase();

const CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export const installFakeSyncServer = (): FakeSyncServer => {
  const users: FakeUserRecord[] = [];
  const parties: FakePartyRecord[] = [];
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

  const mustFindByEmail = (email: string): FakeUserRecord => {
    const user = findByEmail(email);
    if (!user) throw new Error(`fakeSyncServer: no seeded user for ${email}`);
    return user;
  };

  // Party as the requester sees it (RFC §3 /api/me shape).
  const publicParty = (party: FakePartyRecord, requesterId: string): Party => ({
    id: party.id,
    name: party.name,
    organizerId: party.organizerId,
    canceled: party.canceled,
    youAreBlocked: party.memberIds.some(
      (member) => member.id === requesterId && member.blocked
    ),
    members: party.memberIds.map(({ id, blocked }) => {
      const user = users.find((candidate) => candidate.id === id)!;
      return {
        id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        blocked,
      };
    }),
  });

  const jsonResponse = (status: number, body: unknown): Response =>
    ({
      ok: status < 400,
      status,
      json: async () => body,
    } as Response);

  const errorResponse = (status: number, code: string, message: string) =>
    jsonResponse(status, { error: { code, message } });

  const createUser = (seed: FakeUserSeed): FakeUserRecord => {
    const user: FakeUserRecord = { ...seed, id: `user-${nextId++}`, partyId: null };
    users.push(user);
    return user;
  };

  const createPartyRecord = (organizer: FakeUserRecord): FakePartyRecord => {
    const party: FakePartyRecord = {
      id: `party-${nextId++}`,
      name: `${organizer.firstName}'s Party`,
      organizerId: organizer.id,
      canceled: false,
      memberIds: [{ id: organizer.id, blocked: false }],
      invitations: {},
      backup: null,
    };
    parties.push(party);
    organizer.partyId = party.id;
    return party;
  };

  const generateCode = (): string => {
    const chars = Array.from(
      { length: 8 },
      () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
    ).join("");
    return `${chars.slice(0, 4)}-${chars.slice(4)}`;
  };

  // Resolves the Authorization header to the stored user, mirroring the
  // real server: case-insensitive header lookup and exp enforcement.
  const authenticate = (
    headers: Record<string, string>
  ): FakeUserRecord | null => {
    const authorizationKey = Object.keys(headers).find(
      (key) => key.toLowerCase() === "authorization"
    );
    const match = /^Bearer (.+)$/.exec(
      (authorizationKey && headers[authorizationKey]) || ""
    );
    const payload = match ? decodeTokenPayload(match[1]) : null;
    if (
      !payload ||
      typeof payload.exp !== "number" ||
      payload.exp * 1000 <= Date.now()
    )
      return null;
    return users.find((candidate) => candidate.id === payload.sub) || null;
  };

  const unauthorized = () =>
    errorResponse(401, "UNAUTHORIZED", "You need to sign in again.");

  // Like the real server (DESIGN §3.6): blocked members and members of
  // canceled parties are free to create/join elsewhere; only an active
  // membership blocks it.
  const hasActiveMembership = (user: FakeUserRecord): boolean => {
    const party = parties.find((candidate) => candidate.id === user.partyId);
    if (!party || party.canceled) return false;
    const member = party.memberIds.find(
      (candidate) => candidate.id === user.id
    );
    return !(member && member.blocked);
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
      const user = authenticate(headers);
      if (!user) return unauthorized();
      const party = parties.find((candidate) => candidate.id === user.partyId);
      return jsonResponse(200, {
        user: publicUser(user),
        party: party ? publicParty(party, user.id) : null,
      });
    }

    if (method === "POST" && path === "/api/party") {
      const user = authenticate(headers);
      if (!user) return unauthorized();
      if (hasActiveMembership(user))
        return errorResponse(
          409,
          "ALREADY_IN_PARTY",
          "You already belong to a party."
        );
      const party = createPartyRecord(user);
      return jsonResponse(201, { party: publicParty(party, user.id) });
    }

    if (method === "POST" && path === "/api/party/invitations") {
      const user = authenticate(headers);
      if (!user) return unauthorized();
      if (!user.partyId)
        return errorResponse(404, "NO_PARTY", "You don't belong to a party.");
      const party = parties.find((candidate) => candidate.id === user.partyId)!;
      if (party.organizerId !== user.id)
        return errorResponse(
          403,
          "NOT_ORGANIZER",
          "Only the organizer can invite members."
        );
      if (party.canceled)
        return errorResponse(410, "PARTY_CANCELED", "This party was canceled.");
      const { password } = body || {};
      if (!password)
        return errorResponse(
          400,
          "VALIDATION_ERROR",
          "An invitation password is required."
        );
      const code = generateCode();
      party.invitations[normalizeCode(code)] = { password, used: false };
      return jsonResponse(201, { code });
    }

    if (method === "POST" && path === "/api/party/join") {
      const user = authenticate(headers);
      if (!user) return unauthorized();
      const { code, password } = body || {};
      if (!code || !password)
        return errorResponse(
          400,
          "VALIDATION_ERROR",
          "An invitation code and password are required."
        );
      // EC-6 first: an existing (active) membership never consumes the
      // invitation; blocked/canceled users may join elsewhere.
      if (hasActiveMembership(user))
        return errorResponse(
          409,
          "ALREADY_IN_PARTY",
          "You already belong to a party."
        );
      const normalized = normalizeCode(code);
      const party = parties.find(
        (candidate) => candidate.invitations[normalized] !== undefined
      );
      if (!party)
        return errorResponse(
          404,
          "INVITATION_NOT_FOUND",
          "That invitation code doesn't exist."
        );
      if (party.canceled)
        return errorResponse(410, "PARTY_CANCELED", "This party was canceled.");
      const invitation = party.invitations[normalized];
      // AC-2.6: once used, permanently rejected — right or wrong password.
      if (invitation.used)
        return errorResponse(
          410,
          "INVITATION_USED",
          "This invitation has already been used."
        );
      // EC-7: wrong password rejected, invitation NOT consumed.
      if (invitation.password !== password)
        return errorResponse(
          401,
          "INVITATION_WRONG_PASSWORD",
          "That password doesn't match this invitation."
        );
      invitation.used = true;
      // Re-invited past member: refresh the existing record, no duplicate.
      const existing = party.memberIds.find(
        (candidate) => candidate.id === user.id
      );
      if (existing) existing.blocked = false;
      else party.memberIds.push({ id: user.id, blocked: false });
      user.partyId = party.id;
      return jsonResponse(200, { party: publicParty(party, user.id) });
    }

    // RFC §3.9–3.10 — backup download/upload. Mirrors the real server's
    // requirePartyAccess precedence exactly: NO_PARTY, then BLOCKED (403),
    // then PARTY_CANCELED (410).
    if (path === "/api/party/backup" && (method === "GET" || method === "PUT")) {
      const user = authenticate(headers);
      if (!user) return unauthorized();
      const party = parties.find((candidate) => candidate.id === user.partyId);
      if (!party)
        return errorResponse(404, "NO_PARTY", "You don't belong to a party.");
      const member = party.memberIds.find(
        (candidate) => candidate.id === user.id
      );
      if (member && member.blocked)
        return errorResponse(
          403,
          "BLOCKED",
          "You've been removed from this party by its organizer."
        );
      if (party.canceled)
        return errorResponse(410, "PARTY_CANCELED", "This party was canceled.");

      if (method === "GET") {
        if (!party.backup)
          return errorResponse(404, "NO_BACKUP", "No backup has been uploaded yet.");
        return jsonResponse(200, party.backup);
      }

      // PUT — baseVersion CAS, like the real server (RFC §3.10).
      const { baseVersion, envelope } = body || {};
      if (!envelope || envelope.app !== "react-expenses-manager")
        return errorResponse(
          400,
          "VALIDATION_ERROR",
          "A valid backup envelope is required."
        );
      const currentVersion = party.backup ? party.backup.version : null;
      if ((baseVersion ?? null) !== currentVersion)
        return errorResponse(
          409,
          "VERSION_CONFLICT",
          "The party backup changed since your download."
        );
      const version = String(Number(currentVersion || "0") + 1);
      party.backup = { version, envelope };
      uploadedBackups.push({ baseVersion: baseVersion ?? null, envelope });
      return jsonResponse(200, { version });
    }

    // RFC §3.7 — organizer blocks a member (AC-2.9).
    const blockMatch = /^\/api\/party\/members\/([^/]+)\/block$/.exec(path);
    if (method === "POST" && blockMatch) {
      const user = authenticate(headers);
      if (!user) return unauthorized();
      const party = parties.find((candidate) => candidate.id === user.partyId);
      if (!party)
        return errorResponse(404, "NO_PARTY", "You don't belong to a party.");
      if (party.organizerId !== user.id)
        return errorResponse(
          403,
          "NOT_ORGANIZER",
          "Only the organizer can block members."
        );
      const targetId = decodeURIComponent(blockMatch[1]);
      if (targetId === party.organizerId)
        return errorResponse(
          400,
          "VALIDATION_ERROR",
          "The organizer cannot be blocked."
        );
      const target = party.memberIds.find(
        (candidate) => candidate.id === targetId
      );
      if (!target)
        return errorResponse(404, "NOT_FOUND", "That member isn't in your party.");
      target.blocked = true;
      return jsonResponse(200, { party: publicParty(party, user.id) });
    }

    // RFC §3.8 — organizer cancels the party (AC-2.10).
    if (method === "POST" && path === "/api/party/cancel") {
      const user = authenticate(headers);
      if (!user) return unauthorized();
      const party = parties.find((candidate) => candidate.id === user.partyId);
      if (!party)
        return errorResponse(404, "NO_PARTY", "You don't belong to a party.");
      if (party.organizerId !== user.id)
        return errorResponse(
          403,
          "NOT_ORGANIZER",
          "Only the organizer can cancel the party."
        );
      party.canceled = true;
      return jsonResponse(200, { party: publicParty(party, user.id) });
    }

    return errorResponse(404, "NOT_FOUND", "Not found.");
  };

  // One-shot failure injections, keyed by "METHOD /path" (failNext seam);
  // repeated failNext calls for the same key queue up.
  const pendingFailures = new Map<
    string,
    ({ status: number; code: string; message: string } | null)[]
  >();
  const uploadedBackups: {
    baseVersion: string | null;
    envelope: BackupEnvelope;
  }[] = [];
  const requestLog: string[] = [];

  const previousFetch = window.fetch;
  window.fetch = (async (input: any, init: any = {}) => {
    const url = typeof input === "string" ? input : input?.url;
    if (typeof url !== "string" || !url.startsWith(baseUrl)) {
      throw new Error(
        `fakeSyncServer: unexpected fetch to ${url} — tests must not touch the network`
      );
    }
    const path = url.slice(baseUrl.length);
    const method = init.method || "GET";

    const failureKey = `${method} ${path}`;
    requestLog.push(failureKey);
    const queued = pendingFailures.get(failureKey);
    if (queued && queued.length > 0) {
      const failure = queued.shift()!;
      // No error given → transport failure, like an unreachable server.
      if (!failure) throw new TypeError("Failed to fetch");
      return errorResponse(failure.status, failure.code, failure.message);
    }

    const body = init.body ? JSON.parse(init.body) : null;
    return handle(method, path, body, init.headers || {});
  }) as typeof fetch;

  return {
    seedUser: (seed) => publicUser(createUser(seed)),
    loginAs: (email) => {
      const user = mustFindByEmail(email);
      const session: SyncSession = {
        token: makeToken(user.id),
        user: publicUser(user),
      };
      setSession(session);
      return session;
    },
    seedPartyWithMembers: (emails, { blocked = [], canceled = false } = {}) => {
      const [organizerEmail, ...memberEmails] = emails;
      const party = createPartyRecord(mustFindByEmail(organizerEmail));
      memberEmails.forEach((email) => {
        const member = mustFindByEmail(email);
        party.memberIds.push({
          id: member.id,
          blocked: blocked.includes(email),
        });
        member.partyId = party.id;
      });
      party.canceled = canceled;
      return party.id;
    },
    seedInvitation: ({ password, used = false }) => {
      const party = parties[parties.length - 1];
      if (!party)
        throw new Error(
          "fakeSyncServer.seedInvitation: seed a party first (seedPartyWithMembers)"
        );
      const code = generateCode();
      party.invitations[normalizeCode(code)] = { password, used };
      return code;
    },
    seedBlockMember: (email) => {
      const user = mustFindByEmail(email);
      const party = parties.find((candidate) => candidate.id === user.partyId);
      if (!party)
        throw new Error("fakeSyncServer.seedBlockMember: user has no party");
      const member = party.memberIds.find(
        (candidate) => candidate.id === user.id
      )!;
      member.blocked = true;
    },
    seedCancelParty: () => {
      const party = parties[parties.length - 1];
      if (!party)
        throw new Error("fakeSyncServer.seedCancelParty: seed a party first");
      party.canceled = true;
    },
    seedRemoteBackup: (envelope) => {
      const party = parties[parties.length - 1];
      if (!party)
        throw new Error("fakeSyncServer.seedRemoteBackup: seed a party first");
      // Re-seeding bumps the version, like another member's upload would —
      // lets tests trigger EC-2 conflicts mid-review.
      const version = party.backup
        ? String(Number(party.backup.version) + 1)
        : "1";
      party.backup = { version, envelope };
    },
    getUploadedBackups: () => [...uploadedBackups],
    getRequests: () => [...requestLog],
    failNext: (request, error) => {
      const queued = pendingFailures.get(request) || [];
      queued.push(error || null);
      pendingFailures.set(request, queued);
    },
    restore: () => {
      window.fetch = previousFetch;
    },
  };
};
