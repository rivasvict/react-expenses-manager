// Storage keys for the user records (RFC §1 key layout).
//
// One account is reachable by two different identifiers, so it is stored
// under two keys in separate namespaces:
//
//   users/{sha256(email)}  the record itself     — looked up by email
//   user-ids/{id}          a pointer to that key — looked up by user id
//
// The prefixes are what keep the two namespaces from colliding. Storage is a
// flat key→JSON map (see ../storage.ts) with no listing or query operation,
// so the only way to find a record is to know its exact key; anything that
// cannot be derived into a key would require a full scan.
import { sha256Hex } from "../crypto";

// Primary record, keyed by the caller-supplied identifier: signup and login
// both start from an email address.
//
// Hashing it serves two ends. The key is fixed-length and safe to use as a
// path segment, which matters because the fs adapter turns keys into file
// names; and the address is not sitting in plaintext in key listings or
// directory entries, which is where a flat store leaks most easily.
// Normalizing before hashing is what makes the lookup case- and
// whitespace-insensitive, so one account cannot be registered twice.
export const userKey = (email: string): string =>
  `users/${sha256Hex(email.trim().toLowerCase())}`;

// Secondary pointer, keyed by user id. A token carries the user id in `sub`,
// not the email, so /api/me has no way to rebuild the users/ key above —
// the hash is one-way. This record maps id → primary key, turning that into
// two direct reads instead of scanning every user. Ids are already opaque
// UUIDs, so there is nothing to hide by hashing them.
export const userIdKey = (id: string): string => `user-ids/${id}`;
