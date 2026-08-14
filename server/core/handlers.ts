// Auth endpoint handlers (RFC §3, endpoints 1–3). Framework-free: each
// handler takes a plain request description and returns { status, body }.
//
// This file is only the wiring. Each endpoint lives in its own module under
// ./handlers/, alongside the collaborators they share (response shaping,
// storage keys, field guards, session minting). The shapes they all speak
// live in ./handlers.types.
import { CreateHandlersOptions, Handlers } from "./handlers.types";
import { createIssueSession, createAuthenticate } from "./handlers/session";
import { createSignupHandler } from "./handlers/signup";
import { createLoginHandler } from "./handlers/login";
import { createMeHandler } from "./handlers/me";

// Builds one handler set over a single storage adapter and token secret.
// `now` is injectable so tests can pin token issue/expiry times.
export const createHandlers = ({
  storage,
  tokenSecret,
  now = Date.now,
}: CreateHandlersOptions): Handlers => {
  const issueSession = createIssueSession({ tokenSecret, now });
  const authenticate = createAuthenticate({ storage, tokenSecret, now });

  return {
    signup: createSignupHandler({ storage, issueSession, now }),
    login: createLoginHandler({ storage, issueSession }),
    me: createMeHandler({ authenticate }),
  };
};
