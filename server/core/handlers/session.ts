// Session lifecycle: minting a token for a user record, and resolving a
// bearer token on an incoming request back to that record.
import { signToken, verifyToken } from "../crypto";
import {
  AppRequest,
  Authenticate,
  IssueSession,
  SessionBody,
  UserIdPointer,
  UserRecord,
} from "../handlers.types";
import { StorageAdapter } from "../storage";
import { publicUser } from "./responses";
import { userIdKey } from "./userKeys";

interface CreateIssueSessionOptions {
  tokenSecret: string;
  now: () => number;
}

interface CreateAuthenticateOptions {
  storage: StorageAdapter;
  tokenSecret: string;
  now: () => number;
}

export const createIssueSession =
  ({ tokenSecret, now }: CreateIssueSessionOptions): IssueSession =>
  (user: UserRecord): SessionBody => ({
    token: signToken({ sub: user.id, secret: tokenSecret, now: now() }),
    user: publicUser(user),
  });

// Resolves the bearer token to the stored user, or null.
export const createAuthenticate =
  ({ storage, tokenSecret, now }: CreateAuthenticateOptions): Authenticate =>
  async ({ headers }: AppRequest): Promise<UserRecord | null> => {
    const header = (headers && headers.authorization) || "";
    const match = /^Bearer (.+)$/.exec(header);
    if (!match) return null;
    const payload = verifyToken({
      token: match[1],
      secret: tokenSecret,
      now: now(),
    });
    if (!payload) return null;
    const pointer = await storage.readJson<UserIdPointer>(
      userIdKey(payload.sub)
    );
    if (!pointer) return null;
    return storage.readJson<UserRecord>(pointer.userKey);
  };
