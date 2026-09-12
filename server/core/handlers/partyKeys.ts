// Storage keys for the party records (docs/multi-user-sync/RFC.md §1/§2.1
// key layout). The user-record keys live next door in ./userKeys.ts; these
// are kept separate because they address a different namespace with
// different access rules — parties are read and written through the
// versioned (compare-and-swap) storage methods, users through the plain ones.

// The party document itself. Ids are already opaque UUIDs, so unlike the
// email-keyed user record there is nothing here to hide by hashing.
export const partyKey = (partyId: string): string => `parties/${partyId}`;

// Pointer from an invitation code's keyed lookup hash to the party holding
// it. Storage is a flat key→JSON map with no listing or query operation, so
// without this pointer `join` would have no way to get from a code to its
// party short of scanning every party record.
//
// The pointer is a plain (unversioned) key on purpose: it is written once and
// never mutated, so it needs no compare-and-swap. Single use is enforced by
// the `used` flag inside the encrypted record on the party, which is exactly
// what the CAS on the party record protects.
export const invitationPointerKey = (lookupHash: string): string =>
  `invitations/${lookupHash}`;
