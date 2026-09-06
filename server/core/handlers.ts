// Endpoint handlers (docs/multi-user-sync/RFC.md §3, endpoints 1–6).
// Framework-free: each handler takes a plain request description and returns
// { status, body }.
//
// This file is only the wiring. Each endpoint lives in its own module under
// ./handlers/, alongside the collaborators they share (response shaping,
// storage keys, field guards, session minting, party writes). The shapes they
// all speak live in ./handlers.types.
import { CreateHandlersOptions, Handlers } from "./handlers.types";
import { deriveEncryptionKey } from "./invitations";
import { createIssueSession, createAuthenticate } from "./handlers/session";
import { createMutateParty, createSetUserPartyId } from "./handlers/parties";
import { createSignupHandler } from "./handlers/signup";
import { createLoginHandler } from "./handlers/login";
import { createMeHandler } from "./handlers/me";
import { createCreatePartyHandler } from "./handlers/createParty";
import { createCreateInvitationHandler } from "./handlers/createInvitation";
import { createJoinPartyHandler } from "./handlers/joinParty";

// Dev-only fallback, matching the one server/index.ts uses for the token
// secret: any string works locally because it is stretched into a key. A real
// deployment overrides it (RFC §6) — a shared default would mean every
// installation could decrypt every other's invitation records.
const DEV_ENCRYPTION_SECRET = "dev-encryption-key";

// Builds one handler set over a single storage adapter and token secret.
// `now` is injectable so tests can pin token issue/expiry times.
export const createHandlers = ({
  storage,
  tokenSecret,
  encryptionSecret = DEV_ENCRYPTION_SECRET,
  now = Date.now,
}: CreateHandlersOptions): Handlers => {
  const issueSession = createIssueSession({ tokenSecret, now });
  const authenticate = createAuthenticate({ storage, tokenSecret, now });
  const encryptionKey = deriveEncryptionKey(encryptionSecret);
  const mutateParty = createMutateParty({ storage });
  const setUserPartyId = createSetUserPartyId({ storage });

  return {
    signup: createSignupHandler({ storage, issueSession, now }),
    login: createLoginHandler({ storage, issueSession }),
    me: createMeHandler({ storage, authenticate }),
    createParty: createCreatePartyHandler({
      storage,
      authenticate,
      setUserPartyId,
      now,
    }),
    createInvitation: createCreateInvitationHandler({
      storage,
      authenticate,
      mutateParty,
      encryptionKey,
      now,
    }),
    joinParty: createJoinPartyHandler({
      storage,
      authenticate,
      mutateParty,
      setUserPartyId,
      encryptionKey,
    }),
  };
};
