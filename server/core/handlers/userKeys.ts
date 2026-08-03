// Storage keys for the user records (RFC §1 key layout).
import { sha256Hex } from "../crypto";

// Primary record. Keying on the sha256 of the normalized email lets signup
// and login look an account up directly instead of scanning every user, while
// keeping the address itself out of the key (and so out of file names on the
// fs adapter).
export const userKey = (email: string): string =>
  `users/${sha256Hex(email.trim().toLowerCase())}`;

// Secondary pointer so /api/me can resolve the token's `sub` (user id) back
// to the email-keyed user record without scanning.
export const userIdKey = (id: string): string => `user-ids/${id}`;
