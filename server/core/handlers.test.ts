// Contract tests for RFC §3 endpoints 1–6 (docs/multi-user-sync/RFC.md), run
// with the Node built-in test runner (node >= 18): npm run test:server
//
// These drive the whole app through createApp, so they pin what a client
// actually receives. The pieces behind each endpoint have their own unit
// tests beside them under ./handlers/.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createApp, App, CreateAppOptions } from "./router";
import { createMemoryStorage, StorageAdapter } from "./storage";
import { signToken, sha256Hex } from "./crypto";
import { codeLookupHash, deriveEncryptionKey } from "./invitations";
import { createFsStorage } from "../storage-fs";
import {
  AppRequest,
  AppResponse,
  ErrorBody,
  InvitationBody,
  InvitationPointer,
  MeBody,
  PartyBody,
  PartyRecord,
  SessionBody,
  UserRecord,
} from "./handlers.types";
import { ERROR_CODES, HTTP_STATUS } from "./httpConstants";

// Handlers return a union of body shapes. These tests assert against
// whichever shape the endpoint under test produces, so widen once here
// instead of narrowing at every assertion.
type TestBody = SessionBody & MeBody & PartyBody & InvitationBody & ErrorBody;
type TestResponse = AppResponse<TestBody>;

const TOKEN_SECRET = "test-secret";
const ENCRYPTION_SECRET = "test-encryption-secret";

const makeApp = (options: Partial<CreateAppOptions> = {}): App =>
  createApp({
    storage: createMemoryStorage(),
    tokenSecret: TOKEN_SECRET,
    encryptionSecret: ENCRYPTION_SECRET,
    ...options,
  });

const call = (app: App, request: AppRequest): Promise<TestResponse> =>
  app.handle(request) as Promise<TestResponse>;

const jane = {
  email: "jane@example.com",
  password: "hunter22!",
  firstName: "Jane",
  lastName: "Doe",
};

const signup = (app: App, body: unknown = jane): Promise<TestResponse> =>
  call(app, { method: "POST", path: "/api/auth/signup", body });

const login = (app: App, body: unknown): Promise<TestResponse> =>
  call(app, { method: "POST", path: "/api/auth/login", body });

const asBearer = (token: string) => ({ authorization: `Bearer ${token}` });

const me = (app: App, token: string): Promise<TestResponse> =>
  call(app, { method: "GET", path: "/api/me", headers: asBearer(token) });

const createParty = (app: App, token: string): Promise<TestResponse> =>
  call(app, { method: "POST", path: "/api/party", headers: asBearer(token) });

const createInvitation = (
  app: App,
  token: string,
  password: string
): Promise<TestResponse> =>
  call(app, {
    method: "POST",
    path: "/api/party/invitations",
    headers: asBearer(token),
    body: { password },
  });

const joinParty = (
  app: App,
  token: string,
  body: { code: string; password: string }
): Promise<TestResponse> =>
  call(app, {
    method: "POST",
    path: "/api/party/join",
    headers: asBearer(token),
    body,
  });

// Signs up someone with Jane's password, returning their { token, user }.
const signUpAs = async (
  app: App,
  who: { email: string; firstName: string; lastName: string }
): Promise<SessionBody> => {
  const result = await signup(app, { ...who, password: jane.password });
  assert.equal(result.status, HTTP_STATUS.CREATED);
  return result.body;
};

const tomSeed = {
  email: "tom@example.com",
  firstName: "Tom",
  lastName: "Doe",
};
const samSeed = {
  email: "sam@example.com",
  firstName: "Sam",
  lastName: "Doe",
};

// Signs Jane up and gives her a party, the starting point for endpoints 5–6.
const setupOrganizer = async (app: App) => {
  const organizer = await signUpAs(app, jane);
  const created = await createParty(app, organizer.token);
  assert.equal(created.status, HTTP_STATUS.CREATED);
  return { organizer, party: created.body.party };
};

const INVITE_PASSWORD = "invite-pass";

// Runs `run` against an app backed by a real temp directory, removed
// afterwards even on failure.
const withFsApp = async (
  run: (app: App, storage: StorageAdapter) => Promise<void>
): Promise<void> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "xpns-sync-server-"));
  try {
    const storage = createFsStorage({ dir });
    await run(
      createApp({
        storage,
        tokenSecret: TOKEN_SECRET,
        encryptionSecret: ENCRYPTION_SECRET,
      }),
      storage
    );
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
};

test("signup → login → /api/me lifecycle", async () => {
  const app = makeApp();

  const signupResult = await signup(app);
  assert.equal(signupResult.status, HTTP_STATUS.CREATED);
  assert.ok(signupResult.body.token);
  assert.deepEqual(signupResult.body.user, {
    id: signupResult.body.user.id,
    email: "jane@example.com",
    firstName: "Jane",
    lastName: "Doe",
  });
  // AC-1.2: the plaintext password never appears in any response.
  assert.ok(!JSON.stringify(signupResult.body).includes(jane.password));

  const loginResult = await login(app, {
    email: "jane@example.com",
    password: jane.password,
  });
  assert.equal(loginResult.status, HTTP_STATUS.OK);
  assert.equal(loginResult.body.user.id, signupResult.body.user.id);

  const meResult = await me(app, loginResult.body.token);
  assert.equal(meResult.status, HTTP_STATUS.OK);
  assert.equal(meResult.body.user.email, "jane@example.com");
  // A fresh account belongs to no party until it creates or joins one.
  assert.equal(meResult.body.party, null);
});

test("signup stores no plaintext password (scrypt record only)", async () => {
  const storage = createMemoryStorage();
  const app = makeApp({ storage });
  await signup(app);

  // Read the stored user record back through the storage interface: what
  // signup persisted must be an scrypt record (algo/salt/hash) and nothing
  // else derived from the password (AC-1.2).
  const stored = (await storage.readJson<UserRecord>(
    `users/${sha256Hex("jane@example.com")}`
  )) as UserRecord;
  assert.equal(stored.password.algo, "scrypt");
  assert.ok(stored.password.saltB64);
  assert.ok(stored.password.hashB64);

  // Then: the plaintext password appears *nowhere* in the stored document.
  //
  // Checking `stored.password` alone would only prove the field we expect
  // to be hashed is hashed. Serializing the whole record and searching it
  // also catches the plaintext being copied somewhere unexpected — a stray
  // field, a debug echo, a future addition to UserRecord.
  const serialized = JSON.stringify(stored);
  assert.equal(
    serialized.includes(jane.password),
    false,
    "the plaintext password must not appear anywhere in the stored user record"
  );
});

test("duplicate email (case-insensitive) is rejected with EMAIL_TAKEN", async () => {
  const app = makeApp();
  await signup(app);

  const duplicate = await signup(app, { ...jane, email: "JANE@example.com" });
  assert.equal(duplicate.status, HTTP_STATUS.CONFLICT);
  assert.equal(duplicate.body.error.code, ERROR_CODES.EMAIL_TAKEN);
});

test("signup validates required fields", async () => {
  const app = makeApp();
  const missingEmail = await signup(app, { ...jane, email: "not-an-email" });
  assert.equal(missingEmail.status, HTTP_STATUS.BAD_REQUEST);
  assert.equal(missingEmail.body.error.code, ERROR_CODES.VALIDATION_ERROR);

  const missingPassword = await signup(app, { ...jane, password: "" });
  assert.equal(missingPassword.status, HTTP_STATUS.BAD_REQUEST);
  assert.equal(missingPassword.body.error.code, ERROR_CODES.VALIDATION_ERROR);
});

test("wrong password and unknown email return the identical generic 401 body (AC-1.5)", async () => {
  const app = makeApp();
  await signup(app);

  const wrongPassword = await login(app, {
    email: "jane@example.com",
    password: "wrong-password",
  });
  const unknownEmail = await login(app, {
    email: "nobody@example.com",
    password: "whatever",
  });

  assert.equal(wrongPassword.status, HTTP_STATUS.UNAUTHORIZED);
  assert.equal(unknownEmail.status, HTTP_STATUS.UNAUTHORIZED);
  assert.deepEqual(wrongPassword.body, unknownEmail.body);
  // Both branches must report INVALID_CREDENTIALS. Asserting each one
  // explicitly (rather than only the wrong-password branch) means the pair
  // cannot drift together into some other shared code and still pass.
  assert.equal(wrongPassword.body.error.code, ERROR_CODES.INVALID_CREDENTIALS);
  assert.equal(unknownEmail.body.error.code, ERROR_CODES.INVALID_CREDENTIALS);
});

test("expired token is rejected with 401 UNAUTHORIZED", async () => {
  const app = makeApp();
  const { body } = await signup(app);

  const expiredToken = signToken({
    sub: body.user.id,
    secret: TOKEN_SECRET,
    now: Date.now() - 31 * 24 * 60 * 60 * 1000, // issued 31 days ago
  });
  const result = await me(app, expiredToken);
  assert.equal(result.status, HTTP_STATUS.UNAUTHORIZED);
  assert.equal(result.body.error.code, ERROR_CODES.UNAUTHORIZED);
});

test("tampered or malformed tokens are rejected", async () => {
  const app = makeApp();
  const { body } = await signup(app);

  // Three different ways of not presenting a valid token. All three must
  // reach the same 401, because /api/me may only ever answer to a token this
  // server signed and has not expired.

  // 1. Correctly formed and structurally valid — right user id, right
  //    payload shape, unexpired — but signed with a different secret. This
  //    is the one that matters: it fails only because the HMAC does not
  //    verify, which is what proves the signature is actually being checked
  //    rather than the payload merely being decoded and trusted.
  const forged = signToken({ sub: body.user.id, secret: "other-secret" });
  assert.equal((await me(app, forged)).status, HTTP_STATUS.UNAUTHORIZED);

  // 2. Not a token at all. verifyToken must reject junk by returning null
  //    rather than throwing on the split/base64/JSON.parse it performs — an
  //    exception here would surface as a 500 and hand an unauthenticated
  //    caller a way to trip the error path.
  assert.equal((await me(app, "garbage")).status, HTTP_STATUS.UNAUTHORIZED);

  // 3. No Authorization header at all — the unauthenticated default. Pinned
  //    alongside the others so "missing" can never be treated more leniently
  //    than "invalid".
  assert.equal(
    (await call(app, { method: "GET", path: "/api/me", headers: {} })).status,
    HTTP_STATUS.UNAUTHORIZED
  );
});

test("unknown routes return 404", async () => {
  const app = makeApp();
  const result = await call(app, { method: "GET", path: "/api/nope" });
  assert.equal(result.status, HTTP_STATUS.NOT_FOUND);
  assert.equal(result.body.error.code, ERROR_CODES.NOT_FOUND);
});

// --- Endpoint 4: POST /api/party -----------------------------------------

test("create party: organizer, auto-name, and 409 on a second party", async () => {
  const app = makeApp();
  const { organizer, party } = await setupOrganizer(app);

  assert.equal(party.name, "Jane's Party");
  assert.equal(party.organizerId, organizer.user.id);
  assert.equal(party.canceled, false);
  assert.equal(party.youAreBlocked, false);
  assert.deepEqual(
    party.members.map((member) => member.id),
    [organizer.user.id]
  );

  // AC-2.1/2.2 (docs/multi-user-sync/PRD.md): at most one party per user.
  const second = await createParty(app, organizer.token);
  assert.equal(second.status, HTTP_STATUS.CONFLICT);
  assert.equal(second.body.error.code, ERROR_CODES.ALREADY_IN_PARTY);

  // And /api/me now reports the membership, which is how a reloading client
  // rediscovers it.
  const meResult = await me(app, organizer.token);
  assert.equal(meResult.body.party?.id, party.id);
});

test("creating a party requires a session", async () => {
  const app = makeApp();
  const result = await call(app, { method: "POST", path: "/api/party" });

  assert.equal(result.status, HTTP_STATUS.UNAUTHORIZED);
  assert.equal(result.body.error.code, ERROR_CODES.UNAUTHORIZED);
});

// --- Endpoint 5: POST /api/party/invitations ------------------------------

test("only the organizer can generate invitations (403 NOT_ORGANIZER)", async () => {
  const app = makeApp();
  const { organizer } = await setupOrganizer(app);
  const invited = await createInvitation(app, organizer.token, INVITE_PASSWORD);

  // Tom joins as a plain member, so he is in the party but does not run it.
  const tom = await signUpAs(app, tomSeed);
  await joinParty(app, tom.token, {
    code: invited.body.code,
    password: INVITE_PASSWORD,
  });

  const denied = await createInvitation(app, tom.token, "another-pass");
  assert.equal(denied.status, HTTP_STATUS.FORBIDDEN);
  assert.equal(denied.body.error.code, ERROR_CODES.NOT_ORGANIZER);
});

test("generating an invitation requires belonging to a party (404 NO_PARTY)", async () => {
  const app = makeApp();

  // Being in someone else's party but not running it is FORBIDDEN (above);
  // having no party at all is a different failure and must not be reported
  // as the same one.
  const sam = await signUpAs(app, samSeed);
  const noParty = await createInvitation(app, sam.token, "pass");

  assert.equal(noParty.status, HTTP_STATUS.NOT_FOUND);
  assert.equal(noParty.body.error.code, ERROR_CODES.NO_PARTY);
});

test("an invitation needs a password", async () => {
  const app = makeApp();
  const { organizer } = await setupOrganizer(app);

  const result = await call(app, {
    method: "POST",
    path: "/api/party/invitations",
    headers: asBearer(organizer.token),
    body: {},
  });
  assert.equal(result.status, HTTP_STATUS.BAD_REQUEST);
  assert.equal(result.body.error.code, ERROR_CODES.VALIDATION_ERROR);
});

// --- Endpoint 6: POST /api/party/join -------------------------------------

test("invitation lifecycle: wrong password not consumed, redeem once, then INVITATION_USED", async () => {
  const app = makeApp();
  const { organizer, party } = await setupOrganizer(app);
  const tom = await signUpAs(app, tomSeed);

  const invited = await createInvitation(app, organizer.token, INVITE_PASSWORD);
  assert.equal(invited.status, HTTP_STATUS.CREATED);
  const { code } = invited.body;
  assert.match(code, /^[A-Z2-7]{4}-[A-Z2-7]{4}$/);

  // EC-7: a wrong password is rejected and the invitation is NOT consumed,
  // so a typo does not cost the invitee their invite.
  const wrongPassword = await joinParty(app, tom.token, {
    code,
    password: "not-it",
  });
  assert.equal(wrongPassword.status, HTTP_STATUS.UNAUTHORIZED);
  assert.equal(
    wrongPassword.body.error.code,
    ERROR_CODES.INVITATION_WRONG_PASSWORD
  );

  // Retrying with the right password on the same code succeeds (AC-2.5) —
  // and hand-typed case and dash differences still resolve to it.
  const joined = await joinParty(app, tom.token, {
    code: code.toLowerCase().replace("-", ""),
    password: INVITE_PASSWORD,
  });
  assert.equal(joined.status, HTTP_STATUS.OK);
  assert.equal(joined.body.party.id, party.id);
  assert.deepEqual(
    joined.body.party.members.map((member) => member.id).sort(),
    [organizer.user.id, tom.user.id].sort()
  );

  // EC-8/AC-2.6: permanently invalid afterwards, even with the right
  // password and a different account.
  const sam = await signUpAs(app, samSeed);
  const reused = await joinParty(app, sam.token, {
    code,
    password: INVITE_PASSWORD,
  });
  assert.equal(reused.status, HTTP_STATUS.GONE);
  assert.equal(reused.body.error.code, ERROR_CODES.INVITATION_USED);
});

test("already-in-party join is rejected without consuming the invitation (EC-6)", async () => {
  const app = makeApp();
  const { organizer } = await setupOrganizer(app);
  const { code } = (
    await createInvitation(app, organizer.token, INVITE_PASSWORD)
  ).body;

  // Tom organizes his own party, then tries to redeem Jane's invitation.
  const tom = await signUpAs(app, tomSeed);
  await createParty(app, tom.token);
  const rejected = await joinParty(app, tom.token, {
    code,
    password: INVITE_PASSWORD,
  });
  assert.equal(rejected.status, HTTP_STATUS.CONFLICT);
  assert.equal(rejected.body.error.code, ERROR_CODES.ALREADY_IN_PARTY);

  // The invitation survives that rejection and is still redeemable by the
  // person it was actually meant for.
  const sam = await signUpAs(app, samSeed);
  const joined = await joinParty(app, sam.token, {
    code,
    password: INVITE_PASSWORD,
  });
  assert.equal(joined.status, HTTP_STATUS.OK);
});

test("unknown invitation code returns 404 INVITATION_NOT_FOUND", async () => {
  const app = makeApp();
  const tom = await signUpAs(app, tomSeed);

  const result = await joinParty(app, tom.token, {
    code: "AAAA-AAAA",
    password: "whatever",
  });
  assert.equal(result.status, HTTP_STATUS.NOT_FOUND);
  assert.equal(result.body.error.code, ERROR_CODES.INVITATION_NOT_FOUND);
});

test("joining requires both a code and a password", async () => {
  const app = makeApp();
  const tom = await signUpAs(app, tomSeed);

  for (const body of [{}, { code: "AAAA-AAAA" }, { password: "pw" }]) {
    const result = await call(app, {
      method: "POST",
      path: "/api/party/join",
      headers: asBearer(tom.token),
      body,
    });
    assert.equal(result.status, HTTP_STATUS.BAD_REQUEST);
    assert.equal(result.body.error.code, ERROR_CODES.VALIDATION_ERROR);
  }
});

test("two concurrent redeems of one code: exactly one succeeds (EC-8 under race)", async () =>
  withFsApp(async (app) => {
    // Deliberately against the fs adapter: its compare-and-swap write awaits
    // between reading the version and writing the file, which is exactly
    // where a lost update would let one invitation be redeemed twice. The
    // in-memory adapter has no such window and so cannot prove this.
    const { organizer } = await setupOrganizer(app);
    const { code } = (
      await createInvitation(app, organizer.token, INVITE_PASSWORD)
    ).body;
    const tom = await signUpAs(app, tomSeed);
    const sam = await signUpAs(app, samSeed);

    const [first, second] = await Promise.all([
      joinParty(app, tom.token, { code, password: INVITE_PASSWORD }),
      joinParty(app, sam.token, { code, password: INVITE_PASSWORD }),
    ]);

    assert.deepEqual(
      [first.status, second.status].sort(),
      [HTTP_STATUS.OK, HTTP_STATUS.GONE].sort()
    );
    const loser = first.status === HTTP_STATUS.GONE ? first : second;
    assert.equal(loser.body.error.code, ERROR_CODES.INVITATION_USED);

    // And the winner is the only new member: the loser was never added.
    const winner = first.status === HTTP_STATUS.OK ? first : second;
    assert.equal(winner.body.party.members.length, 2);
  }));

test("no plaintext invitation code or password at rest (AC-2.4/NFR-2)", async () => {
  const storage = createMemoryStorage();
  const app = makeApp({ storage });
  const { organizer, party } = await setupOrganizer(app);
  const invitePassword = "super-secret-invite-pass";

  const { code } = (await createInvitation(app, organizer.token, invitePassword))
    .body;

  // The stored party must contain neither the code (in either the dashed or
  // the bare form a user might type) nor the invitation password — only the
  // keyed lookup hash and the AES-256-GCM blob.
  const record = await storage.readJsonVersioned<PartyRecord>(
    `parties/${party.id}`
  );
  const serialized = JSON.stringify(record?.value);
  assert.ok(!serialized.includes(code));
  assert.ok(!serialized.includes(code.replace("-", "")));
  assert.ok(!serialized.includes(invitePassword));

  // The lookup pointer holds only a party id, under a key that is an HMAC of
  // the code — reproducible here only because this test knows the server's
  // encryption secret, which is the point of keying it.
  const pointer = await storage.readJson<InvitationPointer>(
    `invitations/${codeLookupHash(code, deriveEncryptionKey(ENCRYPTION_SECRET))}`
  );
  assert.deepEqual(pointer, { partyId: party.id });
});

test("an invitation minted under one encryption secret is unreadable under another", async () =>
  withFsApp(async (app, storage) => {
    // The at-rest protection is only worth anything if the key is what makes
    // the record readable. Same storage, different secret: the record must
    // not decrypt, so the code resolves to nothing.
    const { organizer } = await setupOrganizer(app);
    const { code } = (
      await createInvitation(app, organizer.token, INVITE_PASSWORD)
    ).body;

    const otherApp = createApp({
      storage,
      tokenSecret: TOKEN_SECRET,
      encryptionSecret: "a-different-encryption-secret",
    });
    const tom = await signUpAs(otherApp, tomSeed);
    const result = await joinParty(otherApp, tom.token, {
      code,
      password: INVITE_PASSWORD,
    });

    assert.equal(result.status, HTTP_STATUS.NOT_FOUND);
    assert.equal(result.body.error.code, ERROR_CODES.INVITATION_NOT_FOUND);
  }));
