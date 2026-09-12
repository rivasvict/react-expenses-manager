// Unit tests for the GET /api/party/backup placeholder (./getBackup.ts).
// What it pins is the shape that must survive the real implementation: the
// party-access gate answers first, and only an admitted caller reaches the
// endpoint's own answer.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createGetBackupHandler } from "./getBackup";
import { error } from "./responses";
import {
  AppRequest,
  ErrorBody,
  PartyAccess,
  RequirePartyAccess,
} from "../handlers.types";
import { ERROR_CODES, HTTP_STATUS } from "../httpConstants";

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

test("an admitted member gets 404 NO_BACKUP while no backup exists (EC-1)", async () => {
  const response = await createGetBackupHandler({
    requirePartyAccess: admitting,
  })(request);

  assert.equal(response.status, HTTP_STATUS.NOT_FOUND);
  assert.equal((response.body as ErrorBody).error.code, ERROR_CODES.NO_BACKUP);
});

test("a refused caller gets the gate's answer, untouched", async () => {
  const response = await createGetBackupHandler({
    requirePartyAccess: refusing,
  })(request);

  // Passed through verbatim rather than re-shaped: the gate owns the
  // wording of BLOCKED / PARTY_CANCELED / NO_PARTY for every endpoint.
  assert.deepEqual(response, blocked);
});

test("the gate is consulted with the incoming request", async () => {
  const seen: AppRequest[] = [];
  const recording: RequirePartyAccess = async (incoming) => {
    seen.push(incoming);
    return { access: admitted };
  };

  await createGetBackupHandler({ requirePartyAccess: recording })(request);

  assert.deepEqual(seen, [request]);
});
