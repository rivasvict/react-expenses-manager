// Unit tests for PUT /api/party/backup (./putBackup.ts): the party-access
// gate answers first; an admitted caller's upload is validated and then
// written under a compare-and-swap on the backup version — create-only for
// a null baseVersion (EC-1), VERSION_CONFLICT on a stale one (EC-2,
// docs/multi-user-sync/PRD.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import { BACKUP_APP_ID, createPutBackupHandler } from "./putBackup";
import { backupKey } from "./partyKeys";
import { error } from "./responses";
import {
  AppRequest,
  BackupRecord,
  BackupVersionBody,
  ErrorBody,
  PartyAccess,
  RequirePartyAccess,
} from "../handlers.types";
import { ERROR_CODES, HTTP_STATUS } from "../httpConstants";
import { createMemoryStorage, StorageAdapter } from "../storage";

const NOW = 1700000005000;

const envelope = {
  app: BACKUP_APP_ID,
  schemaVersion: 1,
  exportedAt: "2026-05-15T12:00:00.000Z",
  data: { balance: [{ id: "e1", amount: "75" }], buckets: {} },
};

const uploadRequest = (
  baseVersion: unknown,
  body: unknown = envelope
): AppRequest => ({
  method: "PUT",
  path: "/api/party/backup",
  body: { baseVersion, envelope: body },
});

const admitted: PartyAccess = {
  user: {
    id: "user-1",
    email: "jane@example.com",
    firstName: "Jane",
    lastName: "Doe",
    password: {
      algo: "scrypt",
      N: 16384,
      r: 8,
      p: 1,
      saltB64: "c2FsdA==",
      hashB64: "aGFzaA==",
    },
    partyId: "party-1",
    createdAt: 1700000000000,
  },
  party: {
    id: "party-1",
    name: "Jane's Party",
    organizerId: "user-1",
    members: [],
    canceled: false,
    invitations: {},
    createdAt: 1700000000000,
  },
  version: "1",
};

const admitting: RequirePartyAccess = async () => ({ access: admitted });

const canceled = error(
  HTTP_STATUS.GONE,
  ERROR_CODES.PARTY_CANCELED,
  "This party was canceled."
);
const refusing: RequirePartyAccess = async () => ({ response: canceled });

const makeHandler = (
  storage: StorageAdapter,
  requirePartyAccess: RequirePartyAccess = admitting
) => createPutBackupHandler({ storage, requirePartyAccess, now: () => NOW });

const errorCode = (response: { body: unknown }) =>
  (response.body as ErrorBody).error.code;

test("a create-only upload stores the envelope and answers with version 1 (EC-1)", async () => {
  const storage = createMemoryStorage();

  const response = await makeHandler(storage)(uploadRequest(null));

  assert.equal(response.status, HTTP_STATUS.OK);
  assert.deepEqual(response.body as BackupVersionBody, { version: "1" });
  const stored = await storage.readJsonVersioned<BackupRecord>(
    backupKey("party-1")
  );
  // The record carries who uploaded it and when (from the injected clock)
  // around the envelope, stored verbatim.
  assert.deepEqual(stored, {
    version: "1",
    value: { uploadedBy: "user-1", uploadedAt: NOW, envelope },
  });
});

test("an upload on the current version replaces the backup and bumps the version", async () => {
  const storage = createMemoryStorage();
  const handler = makeHandler(storage);
  await handler(uploadRequest(null));

  const updated = { ...envelope, data: { balance: [], buckets: {} } };
  const response = await handler(uploadRequest("1", updated));

  assert.equal(response.status, HTTP_STATUS.OK);
  assert.deepEqual(response.body as BackupVersionBody, { version: "2" });
  const stored = await storage.readJsonVersioned<BackupRecord>(
    backupKey("party-1")
  );
  assert.deepEqual(stored?.value.envelope, updated);
});

test("a stale baseVersion is refused with 409 VERSION_CONFLICT and writes nothing (EC-2)", async () => {
  const storage = createMemoryStorage();
  const handler = makeHandler(storage);
  await handler(uploadRequest(null));
  await handler(uploadRequest("1"));
  const before = await storage.readJsonVersioned(backupKey("party-1"));

  // Built on version 1, but the backup is already at 2.
  const response = await handler(
    uploadRequest("1", { ...envelope, data: { balance: ["stale"] } })
  );

  assert.equal(response.status, HTTP_STATUS.CONFLICT);
  assert.equal(errorCode(response), ERROR_CODES.VERSION_CONFLICT);
  assert.deepEqual(
    await storage.readJsonVersioned(backupKey("party-1")),
    before
  );
});

test("a create-only upload when a backup already exists is a VERSION_CONFLICT too", async () => {
  const storage = createMemoryStorage();
  const handler = makeHandler(storage);
  await handler(uploadRequest(null));

  // Two members doing their first sync at once: the second must download
  // the first's backup rather than overwrite it.
  const response = await handler(uploadRequest(null));

  assert.equal(response.status, HTTP_STATUS.CONFLICT);
  assert.equal(errorCode(response), ERROR_CODES.VERSION_CONFLICT);
  const stored = await storage.readJsonVersioned(backupKey("party-1"));
  assert.equal(stored?.version, "1");
});

test("a baseVersion that is neither null nor a string is a VALIDATION_ERROR", async () => {
  // A missing field must not be read as "create only": that would turn a
  // malformed request into a silent overwrite race.
  for (const baseVersion of [undefined, 1, true, {}]) {
    const storage = createMemoryStorage();
    const response = await makeHandler(storage)(uploadRequest(baseVersion));

    assert.equal(
      response.status,
      HTTP_STATUS.BAD_REQUEST,
      `expected 400 for baseVersion ${JSON.stringify(baseVersion)}`
    );
    assert.equal(errorCode(response), ERROR_CODES.VALIDATION_ERROR);
    assert.equal(
      await storage.readJsonVersioned(backupKey("party-1")),
      null
    );
  }
});

test("a malformed envelope is a VALIDATION_ERROR and writes nothing", async () => {
  const malformed: unknown[] = [
    undefined,
    null,
    "not an object",
    {},
    { app: "some-other-app", data: {} },
    { app: BACKUP_APP_ID },
    { app: BACKUP_APP_ID, data: null },
    { app: BACKUP_APP_ID, data: "balance" },
  ];
  for (const body of malformed) {
    const storage = createMemoryStorage();
    // Built by hand rather than through uploadRequest, whose default
    // envelope would replace an `undefined` body.
    const response = await makeHandler(storage)({
      method: "PUT",
      path: "/api/party/backup",
      body: { baseVersion: null, envelope: body },
    });

    assert.equal(
      response.status,
      HTTP_STATUS.BAD_REQUEST,
      `expected 400 for envelope ${JSON.stringify(body)}`
    );
    assert.equal(errorCode(response), ERROR_CODES.VALIDATION_ERROR);
    assert.equal(
      await storage.readJsonVersioned(backupKey("party-1")),
      null
    );
  }
});

test("a body that is not an object at all is a VALIDATION_ERROR", async () => {
  const storage = createMemoryStorage();
  const response = await makeHandler(storage)({
    method: "PUT",
    path: "/api/party/backup",
    body: "just a string",
  });

  assert.equal(response.status, HTTP_STATUS.BAD_REQUEST);
  assert.equal(errorCode(response), ERROR_CODES.VALIDATION_ERROR);
});

test("the write is keyed by the party the gate admitted, not the user record", async () => {
  const storage = createMemoryStorage();
  const staleUser: PartyAccess = {
    ...admitted,
    user: { ...admitted.user, partyId: "party-stale" },
  };

  await makeHandler(storage, async () => ({ access: staleUser }))(
    uploadRequest(null)
  );

  assert.equal(await storage.readJsonVersioned(backupKey("party-stale")), null);
  assert.notEqual(await storage.readJsonVersioned(backupKey("party-1")), null);
});

test("a refused caller gets the gate's answer, untouched, and nothing is written", async () => {
  const storage = createMemoryStorage();

  const response = await makeHandler(storage, refusing)(uploadRequest(null));

  assert.deepEqual(response, canceled);
  assert.equal(await storage.readJsonVersioned(backupKey("party-1")), null);
});

test("the gate is consulted with the incoming request", async () => {
  const seen: AppRequest[] = [];
  const recording: RequirePartyAccess = async (incoming) => {
    seen.push(incoming);
    return { access: admitted };
  };
  const request = uploadRequest(null);

  await makeHandler(createMemoryStorage(), recording)(request);

  assert.deepEqual(seen, [request]);
});
