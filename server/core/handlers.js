// Endpoint handlers (RFC §3, endpoints 1–6). Framework-free: each handler
// takes a plain request description and returns { status, body }.
const {
  sha256Hex,
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  randomId,
} = require("./crypto");
const {
  codeLookupHash,
  generateCode,
  encryptRecord,
  decryptRecord,
} = require("./invitations");

// Error codes duplicated from src/services/syncApi/contract.ts deliberately —
// the server stays dependency-free; RFC §3 is the source of truth.
const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  EMAIL_TAKEN: "EMAIL_TAKEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
  ALREADY_IN_PARTY: "ALREADY_IN_PARTY",
  NOT_ORGANIZER: "NOT_ORGANIZER",
  NO_PARTY: "NO_PARTY",
  PARTY_CANCELED: "PARTY_CANCELED",
  INVITATION_NOT_FOUND: "INVITATION_NOT_FOUND",
  INVITATION_WRONG_PASSWORD: "INVITATION_WRONG_PASSWORD",
  INVITATION_USED: "INVITATION_USED",
  BLOCKED: "BLOCKED",
  NO_BACKUP: "NO_BACKUP",
  CONFLICT: "CONFLICT",
  // Temporary scaffolding only (PUT backup body arrives with the sync PR).
  NOT_IMPLEMENTED: "NOT_IMPLEMENTED",
};

const error = (status, code, message) => ({
  status,
  body: { error: { code, message } },
});

// AC-1.5: identical body whether the email exists or not.
const invalidCredentials = () =>
  error(401, ERROR_CODES.INVALID_CREDENTIALS, "Email or password is incorrect.");

const unauthorized = () =>
  error(401, ERROR_CODES.UNAUTHORIZED, "You need to sign in again.");

const publicUser = ({ id, email, firstName, lastName }) => ({
  id,
  email,
  firstName,
  lastName,
});

// Party as seen by `requesterId` (RFC §3 /api/me): invitations stay
// server-side, youAreBlocked is computed per requester.
const publicParty = (party, requesterId) => ({
  id: party.id,
  name: party.name,
  organizerId: party.organizerId,
  canceled: party.canceled,
  youAreBlocked: party.members.some(
    (member) => member.id === requesterId && member.blocked
  ),
  members: party.members.map(({ id, firstName, lastName, email, blocked }) => ({
    id,
    firstName,
    lastName,
    email,
    blocked,
  })),
});

const userKey = (email) => `users/${sha256Hex(email.trim().toLowerCase())}`;
// Secondary pointer so /api/me can resolve the token's `sub` (user id) back
// to the email-keyed user record without scanning.
const userIdKey = (id) => `user-ids/${id}`;
const partyKey = (partyId) => `parties/${partyId}`;
// Pointer from sha256(code) to the owning party, so join can find the party
// from the code alone. Holds no secret — just a hash and a party id.
const invitationPointerKey = (lookupHash) => `invitations/${lookupHash}`;

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim() !== "";

const isEmail = (value) => isNonEmptyString(value) && /^\S+@\S+\.\S+$/.test(value);

const createHandlers = ({ storage, tokenSecret, encryptionKey, now = Date.now }) => {
  const issueSession = (user) => ({
    token: signToken({ sub: user.id, secret: tokenSecret, now: now() }),
    user: publicUser(user),
  });

  const signup = async ({ body }) => {
    const { email, password, firstName, lastName } = body || {};
    if (!isEmail(email))
      return error(400, ERROR_CODES.VALIDATION_ERROR, "A valid email is required.");
    if (!isNonEmptyString(password))
      return error(400, ERROR_CODES.VALIDATION_ERROR, "A password is required.");
    if (!isNonEmptyString(firstName) || !isNonEmptyString(lastName))
      return error(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        "First and last name are required."
      );

    const key = userKey(email);
    if (await storage.readJson(key))
      return error(
        409,
        ERROR_CODES.EMAIL_TAKEN,
        "An account with this email already exists."
      );

    const user = {
      id: randomId(),
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      password: hashPassword(password),
      partyId: null,
      createdAt: now(),
    };
    await storage.writeJson(key, user);
    await storage.writeJson(userIdKey(user.id), { userKey: key });
    return { status: 201, body: issueSession(user) };
  };

  // Hashed once per handler set; only used to equalize login timing below.
  const dummyPasswordRecord = hashPassword("dummy-timing-equalizer");

  const login = async ({ body }) => {
    const { email, password } = body || {};
    if (!isNonEmptyString(email) || !isNonEmptyString(password))
      return invalidCredentials();
    const user = await storage.readJson(userKey(email));
    if (!user) {
      // AC-1.5 also covers timing: without this, an unknown email would
      // return before any scrypt work and reveal account existence. Burn
      // the same hashing cost against a dummy record, then fail generically.
      verifyPassword(password, dummyPasswordRecord);
      return invalidCredentials();
    }
    if (!verifyPassword(password, user.password)) return invalidCredentials();
    return { status: 200, body: issueSession(user) };
  };

  // Resolves the bearer token to the stored user, or null.
  const authenticate = async ({ headers }) => {
    const header = (headers && headers.authorization) || "";
    const match = /^Bearer (.+)$/.exec(header);
    if (!match) return null;
    const payload = verifyToken({
      token: match[1],
      secret: tokenSecret,
      now: now(),
    });
    if (!payload) return null;
    const pointer = await storage.readJson(userIdKey(payload.sub));
    if (!pointer) return null;
    return storage.readJson(pointer.userKey);
  };

  // Honest scope note on race safety: the CAS machinery below guarantees
  // single-use invitation consumption (two concurrent redeems of one code
  // → exactly one success). The user.partyId check-then-write in
  // createParty/joinParty is NOT under the same guard, so one user racing
  // their own requests from two tabs could theoretically end up referenced
  // by two parties. Accepted at family scale (RFC §2.1) — deliberately not
  // fixed.
  const setUserPartyId = async (user, partyId) => {
    await storage.writeJson(userKey(user.email), { ...user, partyId });
  };

  // Compare-and-swap read-modify-write on a party (RFC §2.1) with one
  // retry. `mutate(party)` returns either { party } to commit or an error
  // result ({ status, body }) to abort without writing.
  const mutateParty = async (partyId, mutate) => {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const record = await storage.readJsonVersioned(partyKey(partyId));
      if (!record) return error(404, ERROR_CODES.NO_PARTY, "No party found.");
      const outcome = mutate(record.value);
      if (!outcome.party) return outcome;
      const newVersion = await storage.writeJsonVersioned(
        partyKey(partyId),
        outcome.party,
        { expectedVersion: record.version }
      );
      if (newVersion !== null) return { party: outcome.party };
    }
    return error(
      409,
      ERROR_CODES.CONFLICT,
      "The party changed concurrently. Please try again."
    );
  };

  const me = async (request) => {
    const user = await authenticate(request);
    if (!user) return unauthorized();
    let party = null;
    if (user.partyId) {
      const record = await storage.readJsonVersioned(partyKey(user.partyId));
      if (record) party = publicParty(record.value, user.id);
    }
    return { status: 200, body: { user: publicUser(user), party } };
  };

  // DESIGN §3.6: being blocked, or belonging to a canceled party, leaves
  // the user free to create/join elsewhere. Their member record stays
  // behind in the old party (AC-2.9 — attribution history is never
  // retroactively removed); only user.partyId moves on.
  const hasActivePartyMembership = async (user) => {
    if (!user.partyId) return false;
    const record = await storage.readJsonVersioned(partyKey(user.partyId));
    if (!record) return false;
    const party = record.value;
    if (party.canceled) return false;
    const member = party.members.find((candidate) => candidate.id === user.id);
    return !(member && member.blocked);
  };

  // Shared enforcement layer for everything that touches the party's data
  // (EC-9, AC-2.10/2.11): resolves the caller's party access or fails with
  // UNAUTHORIZED / NO_PARTY / BLOCKED / PARTY_CANCELED. The backup
  // endpoints below run through it, so PR 4's real implementations inherit
  // the enforcement unchanged — a stale client can never download or
  // upload.
  const requirePartyAccess = async (request) => {
    const user = await authenticate(request);
    if (!user) return unauthorized();
    if (!user.partyId)
      return error(404, ERROR_CODES.NO_PARTY, "You don't belong to a party.");
    const record = await storage.readJsonVersioned(partyKey(user.partyId));
    if (!record)
      return error(404, ERROR_CODES.NO_PARTY, "You don't belong to a party.");
    const party = record.value;
    const member = party.members.find((candidate) => candidate.id === user.id);
    if (member && member.blocked)
      return error(
        403,
        ERROR_CODES.BLOCKED,
        "You've been removed from this party by its organizer."
      );
    if (party.canceled)
      return error(410, ERROR_CODES.PARTY_CANCELED, "This party was canceled.");
    return { user, party, version: record.version };
  };

  // RFC §3.4 — create a party; the creator becomes its organizer (AC-2.1).
  const createParty = async (request) => {
    const user = await authenticate(request);
    if (!user) return unauthorized();
    if (await hasActivePartyMembership(user))
      return error(
        409,
        ERROR_CODES.ALREADY_IN_PARTY,
        "You already belong to a party."
      );

    const party = {
      id: randomId(),
      name: `${user.firstName}'s Party`,
      organizerId: user.id,
      members: [{ ...publicUser(user), blocked: false }],
      canceled: false,
      invitations: {},
      createdAt: now(),
    };
    const version = await storage.writeJsonVersioned(partyKey(party.id), party, {
      expectedVersion: null,
    });
    if (version === null)
      return error(409, ERROR_CODES.CONFLICT, "Please try again.");
    await setUserPartyId(user, party.id);
    return { status: 201, body: { party: publicParty(party, user.id) } };
  };

  // RFC §3.5 — organizer generates an invitation: a one-time code plus an
  // organizer-chosen password (AC-2.3). The code is returned exactly once;
  // at rest it exists only as a sha256 lookup key and an AES-256-GCM
  // encrypted record (AC-2.4).
  const createInvitation = async (request) => {
    const user = await authenticate(request);
    if (!user) return unauthorized();
    if (!user.partyId)
      return error(404, ERROR_CODES.NO_PARTY, "You don't belong to a party.");
    const { password } = (request && request.body) || {};
    if (!isNonEmptyString(password))
      return error(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        "An invitation password is required."
      );

    const code = generateCode();
    const lookupHash = codeLookupHash(code, encryptionKey);
    const encryptedRecord = encryptRecord(
      {
        password: hashPassword(password),
        used: false,
        createdBy: user.id,
        createdAt: now(),
      },
      encryptionKey
    );

    const outcome = await mutateParty(user.partyId, (party) => {
      if (party.organizerId !== user.id)
        return error(
          403,
          ERROR_CODES.NOT_ORGANIZER,
          "Only the organizer can invite members."
        );
      if (party.canceled)
        return error(410, ERROR_CODES.PARTY_CANCELED, "This party was canceled.");
      return {
        party: {
          ...party,
          invitations: { ...party.invitations, [lookupHash]: encryptedRecord },
        },
      };
    });
    if (!outcome.party) return outcome;
    await storage.writeJson(invitationPointerKey(lookupHash), {
      partyId: user.partyId,
    });
    return { status: 201, body: { code } };
  };

  // RFC §3.6 — invitee redeems code + password (AC-2.5–2.7, EC-6/7/8).
  const joinParty = async (request) => {
    const user = await authenticate(request);
    if (!user) return unauthorized();
    const { code, password } = (request && request.body) || {};
    if (!isNonEmptyString(code) || !isNonEmptyString(password))
      return error(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        "An invitation code and password are required."
      );
    // EC-6 first: an existing (active) membership never consumes the
    // invitation. Blocked members and members of canceled parties are
    // free to join elsewhere (DESIGN §3.6).
    if (await hasActivePartyMembership(user))
      return error(
        409,
        ERROR_CODES.ALREADY_IN_PARTY,
        "You already belong to a party."
      );

    const lookupHash = codeLookupHash(code, encryptionKey);
    const pointer = await storage.readJson(invitationPointerKey(lookupHash));
    if (!pointer)
      return error(
        404,
        ERROR_CODES.INVITATION_NOT_FOUND,
        "That invitation code doesn't exist."
      );

    // Validation pass (no writes yet): wrong password must not consume the
    // invitation (EC-7), so the used flag is only flipped inside the CAS
    // mutation below once the password has checked out.
    const record = await storage.readJsonVersioned(partyKey(pointer.partyId));
    if (!record)
      return error(
        404,
        ERROR_CODES.INVITATION_NOT_FOUND,
        "That invitation code doesn't exist."
      );
    const validate = (party) => {
      if (party.canceled)
        return error(410, ERROR_CODES.PARTY_CANCELED, "This party was canceled.");
      const invitation = decryptRecord(party.invitations[lookupHash], encryptionKey);
      if (!invitation)
        return error(
          404,
          ERROR_CODES.INVITATION_NOT_FOUND,
          "That invitation code doesn't exist."
        );
      // AC-2.6: once used, permanently rejected — right or wrong password.
      if (invitation.used)
        return error(
          410,
          ERROR_CODES.INVITATION_USED,
          "This invitation has already been used."
        );
      if (!verifyPassword(password, invitation.password))
        return error(
          401,
          ERROR_CODES.INVITATION_WRONG_PASSWORD,
          "That password doesn't match this invitation."
        );
      return { invitation };
    };
    const validated = validate(record.value);
    if (!validated.invitation) return validated;

    // Commit under CAS: re-validate against the freshly read party so a
    // concurrent redeem of the same code loses exactly one of the races
    // (single-use even under a race, EC-8).
    const outcome = await mutateParty(pointer.partyId, (party) => {
      const revalidated = validate(party);
      if (!revalidated.invitation) return revalidated;
      // Re-invited past member (e.g. previously blocked): refresh the
      // existing record instead of appending a duplicate row.
      const isReturning = party.members.some(
        (member) => member.id === user.id
      );
      const members = isReturning
        ? party.members.map((member) =>
            member.id === user.id
              ? { ...publicUser(user), blocked: false }
              : member
          )
        : [...party.members, { ...publicUser(user), blocked: false }];
      return {
        party: {
          ...party,
          members,
          invitations: {
            ...party.invitations,
            [lookupHash]: encryptRecord(
              { ...revalidated.invitation, used: true },
              encryptionKey
            ),
          },
        },
      };
    });
    if (!outcome.party) return outcome;
    await setUserPartyId(user, pointer.partyId);
    return { status: 200, body: { party: publicParty(outcome.party, user.id) } };
  };

  // RFC §3.7 — organizer blocks a member (AC-2.9). The member keeps their
  // membership record — already-contributed entries are never
  // retroactively removed — but the flag immediately revokes party-data
  // access (EC-9) via requirePartyAccess. Nothing outside the party
  // record is touched.
  const blockMember = async (request) => {
    const user = await authenticate(request);
    if (!user) return unauthorized();
    if (!user.partyId)
      return error(404, ERROR_CODES.NO_PARTY, "You don't belong to a party.");
    const targetId = (request.params || {}).userId;
    const outcome = await mutateParty(user.partyId, (party) => {
      if (party.organizerId !== user.id)
        return error(
          403,
          ERROR_CODES.NOT_ORGANIZER,
          "Only the organizer can block members."
        );
      if (targetId === party.organizerId)
        return error(
          400,
          ERROR_CODES.VALIDATION_ERROR,
          "The organizer cannot be blocked."
        );
      if (!party.members.some((member) => member.id === targetId))
        return error(
          404,
          ERROR_CODES.NOT_FOUND,
          "That member isn't in your party."
        );
      return {
        party: {
          ...party,
          members: party.members.map((member) =>
            member.id === targetId ? { ...member, blocked: true } : member
          ),
        },
      };
    });
    if (!outcome.party) return outcome;
    return { status: 200, body: { party: publicParty(outcome.party, user.id) } };
  };

  // RFC §3.8 — organizer cancels the party (AC-2.10). Members keep their
  // records and their local data; the flag makes every future party-data
  // call fail with PARTY_CANCELED via requirePartyAccess.
  const cancelParty = async (request) => {
    const user = await authenticate(request);
    if (!user) return unauthorized();
    if (!user.partyId)
      return error(404, ERROR_CODES.NO_PARTY, "You don't belong to a party.");
    const outcome = await mutateParty(user.partyId, (party) => {
      if (party.organizerId !== user.id)
        return error(
          403,
          ERROR_CODES.NOT_ORGANIZER,
          "Only the organizer can cancel the party."
        );
      return { party: { ...party, canceled: true } };
    });
    if (!outcome.party) return outcome;
    return { status: 200, body: { party: publicParty(outcome.party, user.id) } };
  };

  // RFC §3.9–3.10 land with the sync PR; the routes exist now so the
  // blocked/canceled enforcement (requirePartyAccess) is already in force
  // for them and PR 4 inherits it unchanged.
  const getBackup = async (request) => {
    const access = await requirePartyAccess(request);
    if (!access.user) return access;
    // No backups can exist yet — EC-1's contract answer is the truth.
    return error(
      404,
      ERROR_CODES.NO_BACKUP,
      "No backup has been uploaded yet."
    );
  };

  const putBackup = async (request) => {
    const access = await requirePartyAccess(request);
    if (!access.user) return access;
    return error(
      501,
      ERROR_CODES.NOT_IMPLEMENTED,
      "Backup upload arrives with sync."
    );
  };

  return {
    signup,
    login,
    me,
    createParty,
    createInvitation,
    joinParty,
    blockMember,
    cancelParty,
    getBackup,
    putBackup,
  };
};

module.exports = { createHandlers, ERROR_CODES };
