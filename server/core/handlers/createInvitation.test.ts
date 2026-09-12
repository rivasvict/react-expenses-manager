// Unit tests for the invitation-generation handler (./createInvitation.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createCreateInvitationHandler } from "./createInvitation";
import { createMutateParty } from "./parties";
import { invitationPointerKey, partyKey } from "./partyKeys";
import {
  AppRequest,
  ErrorBody,
  Handler,
  InvitationBody,
  InvitationPointer,
  InvitationRecord,
  PartyRecord,
  UserRecord,
} from "../handlers.types";
import { ERROR_CODES, HTTP_STATUS } from "../httpConstants";
import {
  codeLookupHash,
  decryptRecord,
  deriveEncryptionKey,
} from "../invitations";
import { createMemoryStorage, StorageAdapter } from "../storage";
import { verifyPassword } from "../crypto";

const NOW = 1700000000000;
const encryptionKey = deriveEncryptionKey("test-encryption-secret");
const INVITE_PASSWORD = "invite-pass";

const jane: UserRecord = {
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
  createdAt: NOW,
};

const party: PartyRecord = {
  id: "party-1",
  name: "Jane's Party",
  organizerId: jane.id,
  members: [
    {
      id: jane.id,
      firstName: "Jane",
      lastName: "Doe",
      email: jane.email,
      blocked: false,
    },
  ],
  canceled: false,
  invitations: {},
  createdAt: NOW,
};

const request = (body: unknown = { password: INVITE_PASSWORD }): AppRequest => ({
  method: "POST",
  path: "/api/party/invitations",
  body,
});

const storageWith = async (record: PartyRecord): Promise<StorageAdapter> => {
  const storage = createMemoryStorage();
  await storage.writeJsonVersioned(partyKey(record.id), record, {
    expectedVersion: null,
  });
  return storage;
};

const handlerFor = (user: UserRecord | null, storage: StorageAdapter): Handler =>
  createCreateInvitationHandler({
    storage,
    authenticate: async () => user,
    mutateParty: createMutateParty({ storage }),
    encryptionKey,
    now: () => NOW,
  });

const readParty = (storage: StorageAdapter) =>
  storage.readJsonVersioned<PartyRecord>(partyKey(party.id));

test("the organizer gets a one-time code back", async () => {
  const storage = await storageWith(party);
  const response = await handlerFor(jane, storage)(request());

  assert.equal(response.status, HTTP_STATUS.CREATED);
  assert.match((response.body as InvitationBody).code, /^[A-Z2-7]{4}-[A-Z2-7]{4}$/);
});

test("the invitation is stored encrypted, under the code's keyed hash", async () => {
  const storage = await storageWith(party);
  const response = await handlerFor(jane, storage)(request());
  const { code } = response.body as InvitationBody;

  const stored = (await readParty(storage))?.value;
  const lookupHash = codeLookupHash(code, encryptionKey);
  assert.deepEqual(Object.keys(stored?.invitations ?? {}), [lookupHash]);

  // The blob decrypts to the expected record, and only under the right key.
  const record = decryptRecord<InvitationRecord>(
    stored?.invitations[lookupHash],
    encryptionKey
  );
  assert.equal(record?.used, false);
  assert.equal(record?.createdBy, jane.id);
  assert.equal(record?.createdAt, NOW);
  assert.equal(record?.password.algo, "scrypt");
  assert.ok(verifyPassword(INVITE_PASSWORD, record!.password));
});

test("neither the code nor the invitation password is stored in plaintext", async () => {
  const storage = await storageWith(party);
  const { code } = (await handlerFor(jane, storage)(request()))
    .body as InvitationBody;

  const serialized = JSON.stringify((await readParty(storage))?.value);
  assert.ok(!serialized.includes(code));
  assert.ok(!serialized.includes(code.replace("-", "")));
  assert.ok(!serialized.includes(INVITE_PASSWORD));
});

test("a pointer from the code's hash to the party is written", async () => {
  const storage = await storageWith(party);
  const { code } = (await handlerFor(jane, storage)(request()))
    .body as InvitationBody;

  const pointer = await storage.readJson<InvitationPointer>(
    invitationPointerKey(codeLookupHash(code, encryptionKey))
  );
  assert.deepEqual(pointer, { partyId: party.id });
});

test("a second invitation is added rather than replacing the first", async () => {
  const storage = await storageWith(party);
  const handler = handlerFor(jane, storage);
  await handler(request());
  await handler(request({ password: "another-pass" }));

  // The organizer may have several invitations outstanding at once; a CAS
  // write that replaced the map instead of extending it would drop one.
  assert.equal(Object.keys((await readParty(storage))!.value.invitations).length, 2);
});

test("a member who is not the organizer is refused", async () => {
  const storage = await storageWith(party);
  const tom: UserRecord = { ...jane, id: "user-2", email: "tom@example.com" };

  const response = await handlerFor(tom, storage)(request());

  assert.equal(response.status, HTTP_STATUS.FORBIDDEN);
  assert.equal(
    (response.body as ErrorBody).error.code,
    ERROR_CODES.NOT_ORGANIZER
  );
  assert.deepEqual((await readParty(storage))?.value.invitations, {});
});

test("a canceled party cannot issue invitations", async () => {
  const storage = await storageWith({ ...party, canceled: true });

  const response = await handlerFor(jane, storage)(request());

  assert.equal(response.status, HTTP_STATUS.GONE);
  assert.equal(
    (response.body as ErrorBody).error.code,
    ERROR_CODES.PARTY_CANCELED
  );
});

test("a user with no party is refused with NO_PARTY", async () => {
  const storage = await storageWith(party);

  const response = await handlerFor({ ...jane, partyId: null }, storage)(
    request()
  );

  assert.equal(response.status, HTTP_STATUS.NOT_FOUND);
  assert.equal((response.body as ErrorBody).error.code, ERROR_CODES.NO_PARTY);
});

test("a missing or blank password is a validation error", async () => {
  const storage = await storageWith(party);
  const handler = handlerFor(jane, storage);

  for (const body of [{}, { password: "" }, { password: "   " }, null]) {
    const response = await handler(request(body));
    assert.equal(response.status, HTTP_STATUS.BAD_REQUEST);
    assert.equal(
      (response.body as ErrorBody).error.code,
      ERROR_CODES.VALIDATION_ERROR
    );
  }
});

test("a refused invitation leaves no pointer behind", async () => {
  const storage = await storageWith({ ...party, canceled: true });
  await handlerFor(jane, storage)(request());

  // The pointer is written only after the party commit; a dangling one would
  // make an invitation that does not exist look real to join.
  const written: string[] = [];
  const original = storage.writeJson;
  storage.writeJson = async (key, value) => {
    written.push(key);
    return original.call(storage, key, value);
  };
  await handlerFor(jane, storage)(request());
  assert.deepEqual(written, []);
});

test("an unauthenticated request is refused with 401", async () => {
  const storage = await storageWith(party);
  const response = await handlerFor(null, storage)(request());

  assert.equal(response.status, HTTP_STATUS.UNAUTHORIZED);
  assert.equal(
    (response.body as ErrorBody).error.code,
    ERROR_CODES.UNAUTHORIZED
  );
});
