// Unit tests for the PUT /api/party/backup placeholder (./putBackup.ts). As
// for its GET counterpart: the party-access gate answers first, and only an
// admitted caller reaches the endpoint's own (for now, 501) answer.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createPutBackupHandler } from "./putBackup";
import { error } from "./responses";
import {
  AppRequest,
  ErrorBody,
  PartyAccess,
  RequirePartyAccess,
} from "../handlers.types";
import { ERROR_CODES, HTTP_STATUS } from "../httpConstants";

const request: AppRequest = {
  method: "PUT",
  path: "/api/party/backup",
  body: { baseVersion: null, envelope: {} },
};

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

test("an admitted member gets 501 NOT_IMPLEMENTED until sync lands", async () => {
  const response = await createPutBackupHandler({
    requirePartyAccess: admitting,
  })(request);

  assert.equal(response.status, HTTP_STATUS.NOT_IMPLEMENTED);
  assert.equal(
    (response.body as ErrorBody).error.code,
    ERROR_CODES.NOT_IMPLEMENTED
  );
});

test("a refused caller gets the gate's answer, untouched", async () => {
  const response = await createPutBackupHandler({
    requirePartyAccess: refusing,
  })(request);

  assert.deepEqual(response, canceled);
});

test("the gate is consulted with the incoming request", async () => {
  const seen: AppRequest[] = [];
  const recording: RequirePartyAccess = async (incoming) => {
    seen.push(incoming);
    return { access: admitted };
  };

  await createPutBackupHandler({ requirePartyAccess: recording })(request);

  assert.deepEqual(seen, [request]);
});
