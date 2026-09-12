// Unit tests for GET /api/party/backup (./getBackup.ts): the party-access
// gate answers first, an admitted caller gets NO_BACKUP or the stored
// envelope with its version, and the read is keyed by the party the gate
// admitted them to.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createGetBackupHandler } from "./getBackup";
import { backupKey } from "./partyKeys";
import { error } from "./responses";
import {
  AppRequest,
  BackupBody,
  BackupRecord,
  ErrorBody,
  PartyAccess,
  RequirePartyAccess,
} from "../handlers.types";
import { ERROR_CODES, HTTP_STATUS } from "../httpConstants";
import { createMemoryStorage } from "../storage";

const request: AppRequest = { method: "GET", path: "/api/party/backup" };

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

const blocked = error(
  HTTP_STATUS.FORBIDDEN,
  ERROR_CODES.BLOCKED,
  "You've been removed from this party by its organizer."
);
const refusing: RequirePartyAccess = async () => ({ response: blocked });

const stored: BackupRecord = {
  uploadedBy: "user-2",
  uploadedAt: 1700000001000,
  envelope: {
    app: "react-expenses-manager",
    schemaVersion: 1,
    data: { balance: [{ id: "e1", amount: "75" }] },
  },
};

test("an admitted member gets 404 NO_BACKUP while no backup exists (EC-1)", async () => {
  const response = await createGetBackupHandler({
    storage: createMemoryStorage(),
    requirePartyAccess: admitting,
  })(request);

  assert.equal(response.status, HTTP_STATUS.NOT_FOUND);
  assert.equal((response.body as ErrorBody).error.code, ERROR_CODES.NO_BACKUP);
});

test("an admitted member gets the stored envelope and its version", async () => {
  const storage = createMemoryStorage();
  await storage.writeJsonVersioned(backupKey("party-1"), stored, {
    expectedVersion: null,
  });

  const response = await createGetBackupHandler({
    storage,
    requirePartyAccess: admitting,
  })(request);

  assert.equal(response.status, HTTP_STATUS.OK);
  // Exactly the two wire fields: the server-side bookkeeping
  // (uploadedBy/uploadedAt) never crosses the wire.
  assert.deepEqual(response.body as BackupBody, {
    version: "1",
    envelope: stored.envelope,
  });
});

test("the version returned is the one a later upload must present", async () => {
  const storage = createMemoryStorage();
  const key = backupKey("party-1");
  await storage.writeJsonVersioned(key, stored, { expectedVersion: null });
  await storage.writeJsonVersioned(key, stored, { expectedVersion: "1" });

  const response = await createGetBackupHandler({
    storage,
    requirePartyAccess: admitting,
  })(request);

  assert.equal((response.body as BackupBody).version, "2");
});

test("the read is keyed by the party the gate admitted, not the user record", async () => {
  const storage = createMemoryStorage();
  // A stale partyId on the user record must not redirect the read.
  await storage.writeJsonVersioned(backupKey("party-stale"), stored, {
    expectedVersion: null,
  });
  const staleUser: PartyAccess = {
    ...admitted,
    user: { ...admitted.user, partyId: "party-stale" },
  };

  const response = await createGetBackupHandler({
    storage,
    requirePartyAccess: async () => ({ access: staleUser }),
  })(request);

  assert.equal(response.status, HTTP_STATUS.NOT_FOUND);
  assert.equal((response.body as ErrorBody).error.code, ERROR_CODES.NO_BACKUP);
});

test("a refused caller gets the gate's answer, untouched", async () => {
  const storage = createMemoryStorage();
  await storage.writeJsonVersioned(backupKey("party-1"), stored, {
    expectedVersion: null,
  });

  const response = await createGetBackupHandler({
    storage,
    requirePartyAccess: refusing,
  })(request);

  // Passed through verbatim rather than re-shaped: the gate owns the
  // wording of BLOCKED / PARTY_CANCELED / NO_PARTY for every endpoint — and
  // a refused caller never sees the backup, even though one exists.
  assert.deepEqual(response, blocked);
});

test("the gate is consulted with the incoming request", async () => {
  const seen: AppRequest[] = [];
  const recording: RequirePartyAccess = async (incoming) => {
    seen.push(incoming);
    return { access: admitted };
  };

  await createGetBackupHandler({
    storage: createMemoryStorage(),
    requirePartyAccess: recording,
  })(request);

  assert.deepEqual(seen, [request]);
});
