// Contract tests for RFC §3.7–3.8 (block member, cancel party) and the
// blocked/canceled enforcement layer the backup endpoints inherit
// (EC-9, AC-2.9–2.12).
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../core/router");
const { createMemoryStorage } = require("../core/storage");

const TOKEN_SECRET = "test-secret";

const makeApp = () => {
  const storage = createMemoryStorage();
  const app = createApp({
    storage,
    tokenSecret: TOKEN_SECRET,
    encryptionSecret: "test-encryption-secret",
  });
  return { app, storage };
};

const asBearer = (token) => ({ authorization: `Bearer ${token}` });

const signup = async (app, { email, firstName, lastName }) => {
  const result = await app.handle({
    method: "POST",
    path: "/api/auth/signup",
    body: { email, password: "pw-123456", firstName, lastName },
  });
  assert.equal(result.status, 201);
  return result.body;
};

const me = (app, token) =>
  app.handle({ method: "GET", path: "/api/me", headers: asBearer(token) });

const blockMember = (app, token, userId) =>
  app.handle({
    method: "POST",
    path: `/api/party/members/${userId}/block`,
    headers: asBearer(token),
    body: {},
  });

const cancelParty = (app, token) =>
  app.handle({
    method: "POST",
    path: "/api/party/cancel",
    headers: asBearer(token),
    body: {},
  });

const getBackup = (app, token) =>
  app.handle({
    method: "GET",
    path: "/api/party/backup",
    headers: asBearer(token),
  });

const putBackup = (app, token) =>
  app.handle({
    method: "PUT",
    path: "/api/party/backup",
    headers: asBearer(token),
    body: { baseVersion: null, envelope: {} },
  });

// Jane organizes a party and Tom joins it via a real invitation.
const setupParty = async (app) => {
  const jane = await signup(app, {
    email: "jane@example.com",
    firstName: "Jane",
    lastName: "Doe",
  });
  const created = await app.handle({
    method: "POST",
    path: "/api/party",
    headers: asBearer(jane.token),
  });
  assert.equal(created.status, 201);
  const invited = await app.handle({
    method: "POST",
    path: "/api/party/invitations",
    headers: asBearer(jane.token),
    body: { password: "invite-pass" },
  });
  const tom = await signup(app, {
    email: "tom@example.com",
    firstName: "Tom",
    lastName: "Doe",
  });
  const joined = await app.handle({
    method: "POST",
    path: "/api/party/join",
    headers: asBearer(tom.token),
    body: { code: invited.body.code, password: "invite-pass" },
  });
  assert.equal(joined.status, 200);
  return { jane, tom, partyId: created.body.party.id };
};

test("organizer blocks a member: flagged, kept in the list, youAreBlocked on /me", async () => {
  const { app } = makeApp();
  const { jane, tom, partyId } = await setupParty(app);

  const blocked = await blockMember(app, jane.token, tom.user.id);
  assert.equal(blocked.status, 200);
  const tomRow = blocked.body.party.members.find(
    (member) => member.id === tom.user.id
  );
  assert.equal(tomRow.blocked, true);

  // The blocked member still sees the party on /me, flagged (AC-2.9).
  const tomMe = await me(app, tom.token);
  assert.equal(tomMe.body.party.id, partyId);
  assert.equal(tomMe.body.party.youAreBlocked, true);

  // Unknown target → 404; the organizer can't block themself → 400.
  assert.equal((await blockMember(app, jane.token, "nobody")).status, 404);
  const selfBlock = await blockMember(app, jane.token, jane.user.id);
  assert.equal(selfBlock.status, 400);
});

test("non-organizer block/cancel → 403 NOT_ORGANIZER (AC-2.12)", async () => {
  const { app } = makeApp();
  const { jane, tom } = await setupParty(app);

  const blockAttempt = await blockMember(app, tom.token, jane.user.id);
  assert.equal(blockAttempt.status, 403);
  assert.equal(blockAttempt.body.error.code, "NOT_ORGANIZER");

  const cancelAttempt = await cancelParty(app, tom.token);
  assert.equal(cancelAttempt.status, 403);
  assert.equal(cancelAttempt.body.error.code, "NOT_ORGANIZER");
});

test("organizer cancels the party: canceled on both members' /me (AC-2.10)", async () => {
  const { app } = makeApp();
  const { jane, tom } = await setupParty(app);

  const canceled = await cancelParty(app, jane.token);
  assert.equal(canceled.status, 200);
  assert.equal(canceled.body.party.canceled, true);

  assert.equal((await me(app, jane.token)).body.party.canceled, true);
  assert.equal((await me(app, tom.token)).body.party.canceled, true);
});

test("blocked member gets 403 BLOCKED on backup GET and PUT (EC-9)", async () => {
  const { app } = makeApp();
  const { jane, tom } = await setupParty(app);
  await blockMember(app, jane.token, tom.user.id);

  const download = await getBackup(app, tom.token);
  assert.equal(download.status, 403);
  assert.equal(download.body.error.code, "BLOCKED");

  const upload = await putBackup(app, tom.token);
  assert.equal(upload.status, 403);
  assert.equal(upload.body.error.code, "BLOCKED");

  // The organizer still passes the enforcement layer (404 NO_BACKUP is
  // the correct contract answer while no backup exists).
  const organizerDownload = await getBackup(app, jane.token);
  assert.equal(organizerDownload.status, 404);
  assert.equal(organizerDownload.body.error.code, "NO_BACKUP");
});

test("canceled party gets 410 PARTY_CANCELED on backup GET and PUT", async () => {
  const { app } = makeApp();
  const { jane, tom } = await setupParty(app);
  await cancelParty(app, jane.token);

  for (const token of [jane.token, tom.token]) {
    const download = await getBackup(app, token);
    assert.equal(download.status, 410);
    assert.equal(download.body.error.code, "PARTY_CANCELED");
    const upload = await putBackup(app, token);
    assert.equal(upload.status, 410);
    assert.equal(upload.body.error.code, "PARTY_CANCELED");
  }
});

test("blocked or canceled users are free to create/join a new party (DESIGN 3.6)", async () => {
  const { app } = makeApp();
  const { jane, tom } = await setupParty(app);
  await blockMember(app, jane.token, tom.user.id);

  // Blocked Tom can start his own party; his member record stays behind.
  const tomParty = await app.handle({
    method: "POST",
    path: "/api/party",
    headers: asBearer(tom.token),
  });
  assert.equal(tomParty.status, 201);
  assert.equal(tomParty.body.party.name, "Tom's Party");
  const janeParty = (await me(app, jane.token)).body.party;
  assert.ok(
    janeParty.members.some(
      (member) => member.id === tom.user.id && member.blocked
    )
  );

  // Jane cancels hers, then can join Tom's via a fresh invitation.
  await cancelParty(app, jane.token);
  const invited = await app.handle({
    method: "POST",
    path: "/api/party/invitations",
    headers: asBearer(tom.token),
    body: { password: "new-pass" },
  });
  const joined = await app.handle({
    method: "POST",
    path: "/api/party/join",
    headers: asBearer(jane.token),
    body: { code: invited.body.code, password: "new-pass" },
  });
  assert.equal(joined.status, 200);
  assert.equal(joined.body.party.id, tomParty.body.party.id);
});

test("block and cancel mutate only the party record — never user or backup data (AC-2.9)", async () => {
  const { app, storage } = makeApp();
  const { jane, tom, partyId } = await setupParty(app);

  // Simulate PR 4's future backup object plus the current user records.
  await storage.writeJsonVersioned(
    `parties/${partyId}.backup`,
    { uploadedBy: tom.user.id, envelope: { data: "tom's entries" } },
    { expectedVersion: null }
  );
  const backupBefore = await storage.readJsonVersioned(
    `parties/${partyId}.backup`
  );
  const tomUserBefore = await storage.readJson(`user-ids/${tom.user.id}`);

  await blockMember(app, jane.token, tom.user.id);
  await cancelParty(app, jane.token);

  // The backup (the blocked member's already-synced entries) and the user
  // pointer records are byte-identical; only the party record changed.
  assert.deepEqual(
    await storage.readJsonVersioned(`parties/${partyId}.backup`),
    backupBefore
  );
  assert.deepEqual(
    await storage.readJson(`user-ids/${tom.user.id}`),
    tomUserBefore
  );
  const party = (await storage.readJsonVersioned(`parties/${partyId}`)).value;
  assert.equal(party.canceled, true);
  assert.ok(
    party.members.some((member) => member.id === tom.user.id && member.blocked)
  );
});
