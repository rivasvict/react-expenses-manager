// Contract tests for RFC §3 endpoints 4–6 (party create, invitations,
// join) plus the invitation-at-rest security guarantees (AC-2.4).
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { createApp } = require("../core/router");
const { createMemoryStorage } = require("../core/storage");
const { createFsStorage } = require("../storage-fs");
const {
  codeLookupHash,
  deriveEncryptionKey,
} = require("../core/invitations");

const TOKEN_SECRET = "test-secret";

// Wraps the app with a storage handle so tests can inspect what is at rest.
const makeApp = () => {
  const storage = createMemoryStorage();
  const app = createApp({
    storage,
    tokenSecret: TOKEN_SECRET,
    encryptionSecret: "test-encryption-secret",
  });
  return { app, storage };
};

const signup = async (app, { email, firstName, lastName }) => {
  const result = await app.handle({
    method: "POST",
    path: "/api/auth/signup",
    body: { email, password: "pw-123456", firstName, lastName },
  });
  assert.equal(result.status, 201);
  return result.body; // { token, user }
};

const asBearer = (token) => ({ authorization: `Bearer ${token}` });

const createParty = (app, token) =>
  app.handle({ method: "POST", path: "/api/party", headers: asBearer(token) });

const createInvitation = (app, token, password) =>
  app.handle({
    method: "POST",
    path: "/api/party/invitations",
    headers: asBearer(token),
    body: { password },
  });

const joinParty = (app, token, body) =>
  app.handle({
    method: "POST",
    path: "/api/party/join",
    headers: asBearer(token),
    body,
  });

const me = (app, token) =>
  app.handle({ method: "GET", path: "/api/me", headers: asBearer(token) });

// Signs up Jane, creates her party, and returns her session.
const setupOrganizer = async (app) => {
  const jane = await signup(app, {
    email: "jane@example.com",
    firstName: "Jane",
    lastName: "Doe",
  });
  const created = await createParty(app, jane.token);
  assert.equal(created.status, 201);
  return { jane, party: created.body.party };
};

test("create party: organizer, auto-name, and 409 on a second party", async () => {
  const { app } = makeApp();
  const { jane, party } = await setupOrganizer(app);

  assert.equal(party.name, "Jane's Party");
  assert.equal(party.organizerId, jane.user.id);
  assert.equal(party.canceled, false);
  assert.equal(party.youAreBlocked, false);
  assert.deepEqual(
    party.members.map((member) => member.id),
    [jane.user.id]
  );

  // AC-2.1/2.2: at most one party.
  const second = await createParty(app, jane.token);
  assert.equal(second.status, 409);
  assert.equal(second.body.error.code, "ALREADY_IN_PARTY");

  // /api/me now returns the party.
  const meResult = await me(app, jane.token);
  assert.equal(meResult.body.party.id, party.id);
});

test("invitation lifecycle: wrong password not consumed, redeem once, then INVITATION_USED", async () => {
  const { app } = makeApp();
  const { jane, party } = await setupOrganizer(app);
  const tom = await signup(app, {
    email: "tom@example.com",
    firstName: "Tom",
    lastName: "Doe",
  });

  const invited = await createInvitation(app, jane.token, "invite-pass");
  assert.equal(invited.status, 201);
  const { code } = invited.body;
  assert.match(code, /^[A-Z2-7]{4}-[A-Z2-7]{4}$/);

  // EC-7: wrong password rejected, invitation NOT consumed.
  const wrongPassword = await joinParty(app, tom.token, {
    code,
    password: "not-it",
  });
  assert.equal(wrongPassword.status, 401);
  assert.equal(wrongPassword.body.error.code, "INVITATION_WRONG_PASSWORD");

  // Retry with the right password on the same code succeeds (AC-2.5),
  // case/dash differences in hand-typed codes included.
  const joined = await joinParty(app, tom.token, {
    code: code.toLowerCase().replace("-", ""),
    password: "invite-pass",
  });
  assert.equal(joined.status, 200);
  assert.deepEqual(
    joined.body.party.members.map((member) => member.id).sort(),
    [jane.user.id, tom.user.id].sort()
  );
  assert.equal(joined.body.party.id, party.id);

  // EC-8/AC-2.6: permanently invalid afterward — right or wrong password.
  const sam = await signup(app, {
    email: "sam@example.com",
    firstName: "Sam",
    lastName: "Doe",
  });
  const reused = await joinParty(app, sam.token, {
    code,
    password: "invite-pass",
  });
  assert.equal(reused.status, 410);
  assert.equal(reused.body.error.code, "INVITATION_USED");
});

test("already-in-party join is rejected without consuming the invitation (EC-6)", async () => {
  const { app } = makeApp();
  const { jane } = await setupOrganizer(app);
  const invited = await createInvitation(app, jane.token, "invite-pass");
  const { code } = invited.body;

  // Tom organizes his own party, then tries to redeem Jane's invitation.
  const tom = await signup(app, {
    email: "tom@example.com",
    firstName: "Tom",
    lastName: "Doe",
  });
  await createParty(app, tom.token);
  const rejected = await joinParty(app, tom.token, {
    code,
    password: "invite-pass",
  });
  assert.equal(rejected.status, 409);
  assert.equal(rejected.body.error.code, "ALREADY_IN_PARTY");

  // The invitation is still redeemable by someone else (not consumed).
  const sam = await signup(app, {
    email: "sam@example.com",
    firstName: "Sam",
    lastName: "Doe",
  });
  const joined = await joinParty(app, sam.token, {
    code,
    password: "invite-pass",
  });
  assert.equal(joined.status, 200);
});

test("only the organizer can generate invitations (403 NOT_ORGANIZER)", async () => {
  const { app } = makeApp();
  const { jane } = await setupOrganizer(app);
  const invited = await createInvitation(app, jane.token, "invite-pass");
  const tom = await signup(app, {
    email: "tom@example.com",
    firstName: "Tom",
    lastName: "Doe",
  });
  await joinParty(app, tom.token, {
    code: invited.body.code,
    password: "invite-pass",
  });

  const denied = await createInvitation(app, tom.token, "another-pass");
  assert.equal(denied.status, 403);
  assert.equal(denied.body.error.code, "NOT_ORGANIZER");

  // And a party-less user gets 404 NO_PARTY.
  const sam = await signup(app, {
    email: "sam@example.com",
    firstName: "Sam",
    lastName: "Doe",
  });
  const noParty = await createInvitation(app, sam.token, "pass");
  assert.equal(noParty.status, 404);
  assert.equal(noParty.body.error.code, "NO_PARTY");
});

test("unknown invitation code returns 404 INVITATION_NOT_FOUND", async () => {
  const { app } = makeApp();
  const tom = await signup(app, {
    email: "tom@example.com",
    firstName: "Tom",
    lastName: "Doe",
  });
  const result = await joinParty(app, tom.token, {
    code: "AAAA-AAAA",
    password: "whatever",
  });
  assert.equal(result.status, 404);
  assert.equal(result.body.error.code, "INVITATION_NOT_FOUND");
});

test("two concurrent redeems of one code: exactly one succeeds (EC-8 under race)", async () => {
  // Runs against the fs adapter deliberately — its CAS write awaits between
  // the version check and the file write, which is exactly where a lost
  // update would let the same invitation be redeemed twice.
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "sync-server-test-"));
  try {
    const app = createApp({
      storage: createFsStorage({ dir: dataDir }),
      tokenSecret: TOKEN_SECRET,
      encryptionSecret: "test-encryption-secret",
    });
    const { jane } = await setupOrganizer(app);
    const invited = await createInvitation(app, jane.token, "invite-pass");
    const { code } = invited.body;
    const tom = await signup(app, {
      email: "tom@example.com",
      firstName: "Tom",
      lastName: "Doe",
    });
    const sam = await signup(app, {
      email: "sam@example.com",
      firstName: "Sam",
      lastName: "Doe",
    });

    const [first, second] = await Promise.all([
      joinParty(app, tom.token, { code, password: "invite-pass" }),
      joinParty(app, sam.token, { code, password: "invite-pass" }),
    ]);

    const statuses = [first.status, second.status].sort();
    assert.deepEqual(statuses, [200, 410]);
    const loser = first.status === 410 ? first : second;
    assert.equal(loser.body.error.code, "INVITATION_USED");
  } finally {
    await fs.rm(dataDir, { recursive: true, force: true });
  }
});

test("no plaintext invitation code or password at rest (AC-2.4/NFR-2)", async () => {
  const { app, storage } = makeApp();
  const { jane } = await setupOrganizer(app);
  const invitePassword = "super-secret-invite-pass";
  const invited = await createInvitation(app, jane.token, invitePassword);
  const { code } = invited.body;
  const bareCode = code.replace("-", "");

  // Read the stored party record back and assert neither the code (in any
  // form) nor the invite password appears anywhere in the serialized
  // document — only the keyed lookup hash and the AES-256-GCM blob.
  const partyId = (await me(app, jane.token)).body.party.id;
  const partyRecord = await storage.readJsonVersioned(`parties/${partyId}`);
  const serializedParty = JSON.stringify(partyRecord.value);
  assert.ok(!serializedParty.includes(code));
  assert.ok(!serializedParty.includes(bareCode));
  assert.ok(!serializedParty.includes(invitePassword));

  // The lookup pointer holds only a hash-keyed party id; the hash is
  // keyed (HMAC) with the same secret the app was configured with.
  const pointer = await storage.readJson(
    `invitations/${codeLookupHash(code, deriveEncryptionKey("test-encryption-secret"))}`
  );
  assert.deepEqual(pointer, { partyId });
});
