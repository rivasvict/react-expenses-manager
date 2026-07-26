// Merge & idempotency engine for multi-user sync (RFC §4). All pure
// functions, no I/O — every EC combination is unit-testable here.
//
// Every syncable unit gets an itemKey and a contentHash (RFC §4.1):
//   Entry                    entry:{id}                    entry minus id
//   Fixed-entry history state fixed:{id}:{from}            state minus from
//   Bucket history state     bucket:{lowercased name}:{from} state minus from
//
// contentHash is FNV-1a over a canonical (recursively key-sorted) JSON
// serialization — change detection, not security, so it runs identically
// in jsdom.
import { BackupData } from "../../services/syncApi/contract";

export type SyncItemKind = "entry" | "fixed" | "bucket";

export interface SyncItem {
  key: string;
  hash: string;
  kind: SyncItemKind;
  // The concrete unit needed to apply the item locally:
  entry?: any; // kind "entry": the full entry (with id)
  fixed?: { id: string; type?: string; state: any }; // state includes `from`
  bucket?: { name: string; state: any }; // state includes `from`
}

export interface IncomingItem extends SyncItem {
  // True when the local snapshot has the same itemKey with different
  // content — an edit by another member, not a brand-new item.
  isChange: boolean;
  // A brand-new fixed entry / bucket arriving with several pending
  // history states presents as ONE card whose facts are the resolved
  // current state (RFC §4.1); `grouped` carries every per-state item so
  // one decision applies (and one rejection records) all of them.
  grouped?: SyncItem[];
}

// Rejection memory (AC-3.9/EC-4): content hashes rejected per itemKey.
export interface Rejections {
  [itemKey: string]: string[];
}

// JSON with recursively sorted object keys, so logically equal values
// always serialize identically.
export const canonicalStringify = (value: any): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map(canonicalStringify).join(",")}]`;
  const keys = Object.keys(value).sort();
  const body = keys
    .filter((key) => value[key] !== undefined)
    .map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`)
    .join(",");
  return `{${body}}`;
};

// 32-bit FNV-1a, hex-encoded.
export const fnv1a = (text: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    // hash *= 16777619, in 32-bit space without BigInt.
    hash =
      (hash + (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)) >>>
      0;
  }
  return hash.toString(16).padStart(8, "0");
};

export const contentHash = (payload: any): string =>
  fnv1a(canonicalStringify(payload));

const omit = (value: any, field: string) => {
  const { [field]: ignored, ...rest } = value || {};
  return rest;
};

// Flattens a snapshot's data into its syncable units (RFC §4.1).
export const extractItems = (data: BackupData): SyncItem[] => {
  const items: SyncItem[] = [];

  (data.balance || []).forEach((entry: any) => {
    items.push({
      kind: "entry",
      key: `entry:${entry.id}`,
      hash: contentHash(omit(entry, "id")),
      entry,
    });
  });

  (data.fixedEntries || []).forEach((definition: any) => {
    (definition.history || []).forEach((state: any) => {
      items.push({
        kind: "fixed",
        key: `fixed:${definition.id}:${state.from}`,
        hash: contentHash(omit(state, "from")),
        fixed: { id: definition.id, type: definition.type, state },
      });
    });
  });

  Object.keys(data.buckets || {}).forEach((name) => {
    const history = data.buckets[name];
    // Legacy plain-number buckets have no history states to sync.
    if (!Array.isArray(history)) return;
    history.forEach((state: any) => {
      items.push({
        kind: "bucket",
        key: `bucket:${name.toLowerCase()}:${state.from}`,
        hash: contentHash(omit(state, "from")),
        bucket: { name, state },
      });
    });
  });

  return items;
};

const itemHashByKey = (data: BackupData): Map<string, string> => {
  const map = new Map<string, string>();
  extractItems(data).forEach((item) => map.set(item.key, item.hash));
  return map;
};

// Collapses the per-state items of BRAND-NEW fixed entries/buckets (no
// local counterpart) into one reviewable item each (RFC §4.1): the
// representative carries the resolved current state (the latest by
// `from`) and `grouped` lists every member state. States of an already-
// known definition stay individual items ("Tom raised the Groceries
// bucket for August").
const groupNewDefinitions = (
  incoming: IncomingItem[],
  localData: BackupData
): IncomingItem[] => {
  const localFixedIds = new Set(
    (localData.fixedEntries || []).map((definition: any) => definition.id)
  );
  const localBucketNames = new Set(
    Object.keys(localData.buckets || {}).map((name) => name.toLowerCase())
  );

  const groupKeyOf = (item: IncomingItem): string | null => {
    if (item.kind === "fixed" && item.fixed && !localFixedIds.has(item.fixed.id))
      return `fixed:${item.fixed.id}`;
    if (
      item.kind === "bucket" &&
      item.bucket &&
      !localBucketNames.has(item.bucket.name.toLowerCase())
    )
      return `bucket:${item.bucket.name.toLowerCase()}`;
    return null; // not groupable — stays an individual item
  };

  const groups = new Map<string, IncomingItem[]>();
  incoming.forEach((item) => {
    const groupKey = groupKeyOf(item);
    if (!groupKey) return;
    groups.set(groupKey, [...(groups.get(groupKey) || []), item]);
  });

  const result: IncomingItem[] = [];
  const emitted = new Set<string>();
  incoming.forEach((item) => {
    const groupKey = groupKeyOf(item);
    if (!groupKey) {
      result.push(item);
      return;
    }
    if (emitted.has(groupKey)) return;
    emitted.add(groupKey);
    const members = groups.get(groupKey)!;
    if (members.length === 1) {
      result.push(members[0]);
      return;
    }
    const byFrom = [...members].sort((first, second) => {
      const fromOf = (candidate: IncomingItem) =>
        candidate.kind === "fixed"
          ? candidate.fixed!.state.from
          : candidate.bucket!.state.from;
      return fromOf(first) < fromOf(second) ? -1 : 1;
    });
    // The resolved current state (latest `from`) fronts the card.
    result.push({ ...byFrom[byFrom.length - 1], grouped: byFrom });
  });
  return result;
};

// The diff, on download (RFC §4.2). Additive-only: a remote backup lacking
// a local item never deletes anything locally.
export const diffSnapshots = ({
  localData,
  remoteData,
  rejections = {},
}: {
  localData: BackupData;
  remoteData: BackupData;
  rejections?: Rejections;
}): IncomingItem[] => {
  const local = itemHashByKey(localData);
  const incoming: IncomingItem[] = [];
  extractItems(remoteData).forEach((item) => {
    if (local.get(item.key) === item.hash) return; // already applied / own
    if ((rejections[item.key] || []).indexOf(item.hash) !== -1) return; // EC-4
    incoming.push({ ...item, isChange: local.has(item.key) });
  });
  return groupNewDefinitions(incoming, localData);
};

// Categories are not reviewable items — they travel alongside entries and
// buckets (AC-3.10) as an additive, case-insensitive union (local casing
// and order win). Names promoted to buckets are excluded, matching how
// creating a bucket removes the standalone category locally.
export const mergeCategories = ({
  localCategories,
  remoteCategories,
  buckets,
}: {
  localCategories: string[];
  remoteCategories: string[];
  buckets: { [name: string]: any };
}): string[] => {
  const bucketNames = new Set(
    Object.keys(buckets || {}).map((name) => name.toLowerCase())
  );
  const seen = new Set<string>();
  const merged: string[] = [];
  [...(localCategories || []), ...(remoteCategories || [])].forEach((name) => {
    const lower = String(name).toLowerCase();
    if (bucketNames.has(lower) || seen.has(lower)) return;
    seen.add(lower);
    merged.push(name);
  });
  return merged;
};

// Two snapshots hold the same content when their syncable units match
// exactly (order-insensitive) and their category lists are equal as sets.
export const snapshotsContentEqual = (
  a: BackupData,
  b: BackupData
): boolean => {
  const mapA = itemHashByKey(a);
  const mapB = itemHashByKey(b);
  if (mapA.size !== mapB.size) return false;
  let equal = true;
  mapA.forEach((hash, key) => {
    if (mapB.get(key) !== hash) equal = false;
  });
  if (!equal) return false;
  // Case-insensitive, like every other category comparison in the app —
  // otherwise two members with different casings would re-upload forever.
  const normalize = (categories?: string[]) =>
    (categories || []).map((name) => name.toLowerCase()).sort();
  return (
    canonicalStringify(normalize(a.categories)) ===
    canonicalStringify(normalize(b.categories))
  );
};

const byFromAscending = (first: any, second: any) =>
  first.from < second.from ? -1 : 1;

const upsertHistoryState = (history: any[], state: any): any[] =>
  [...history.filter((item) => item.from !== state.from), state].sort(
    byFromAscending
  );

// Applies accepted incoming items to a local snapshot, returning a new one
// (RFC §4.3 step 5): entries appended/replaced by id; fixed/bucket states
// upserted by `from` with histories kept sorted; bucket names matched
// case-insensitively (local casing wins). Removal tombstones are states
// like any other. Never mutates its input.
export const applyItems = (
  localData: BackupData,
  items: SyncItem[]
): BackupData => {
  const data: BackupData = {
    balance: [...(localData.balance || [])],
    buckets: { ...(localData.buckets || {}) },
    categories: [...(localData.categories || [])],
    fixedEntries: (localData.fixedEntries || []).map((definition: any) => ({
      ...definition,
      history: [...(definition.history || [])],
    })),
  };

  items.forEach((item) => {
    if (item.kind === "entry" && item.entry) {
      const index = data.balance.findIndex(
        (entry: any) => entry.id === item.entry.id
      );
      if (index >= 0) data.balance[index] = item.entry;
      else data.balance.push(item.entry);
    }

    if (item.kind === "fixed" && item.fixed) {
      const definition = data.fixedEntries.find(
        (candidate: any) => candidate.id === item.fixed!.id
      );
      if (definition) {
        definition.history = upsertHistoryState(
          definition.history,
          item.fixed.state
        );
      } else {
        data.fixedEntries.push({
          id: item.fixed.id,
          type: item.fixed.type,
          history: [item.fixed.state],
        });
      }
    }

    if (item.kind === "bucket" && item.bucket) {
      const existingName = Object.keys(data.buckets).find(
        (name) => name.toLowerCase() === item.bucket!.name.toLowerCase()
      );
      if (existingName && Array.isArray(data.buckets[existingName])) {
        data.buckets[existingName] = upsertHistoryState(
          data.buckets[existingName],
          item.bucket.state
        );
      } else {
        data.buckets[existingName || item.bucket.name] = [item.bucket.state];
      }
    }
  });

  return data;
};

// The union of `base` and `remoteData`, keyed by itemKey — the snapshot a
// sync UPLOADS (RFC §4.3 step 6). `base` is the local snapshot with the
// review's accepted/modified items already applied (applyItems), so its
// items win: any remote item whose itemKey is ALSO in `base` keeps the
// base value (so a modified-accepted item uploads with the modified value,
// EC-5, and a local item wins over a stale remote one). Only remote items
// ABSENT from `base` are added, at their remote value.
//
// This is the entry/fixed/bucket analogue of mergeCategories' additive
// union (AC-3.10). It fixes D5: uploads used to be built from LOCAL data
// alone, so a remote item not present locally — one this member rejected,
// now or in a prior sync — was wholesale-dropped from the party backup,
// violating AC-3.9 and looping uploads forever. Retaining it here keeps
// the backup stable and lets both members converge.
//
// Consistent with the additive-only design (RFC §4.2): just as a download
// never deletes a local item, an upload never deletes a remote one — sync
// carries no deletions in either direction. A locally-removed item that is
// still remote is therefore RETAINED in the upload (not resurrected
// locally — the local commit uses `base`, never this union), matching how
// the download side already re-offers such an item rather than dropping it.
export const mergeSnapshotForUpload = ({
  base,
  remoteData,
}: {
  base: BackupData;
  remoteData: BackupData;
}): BackupData => {
  const present = new Set<string>();
  extractItems(base).forEach((item) => present.add(item.key));
  const remoteOnly = extractItems(remoteData).filter(
    (item) => !present.has(item.key)
  );
  // Categories are unioned separately (mergeCategories) by the callers;
  // applyItems preserves base.categories untouched.
  return applyItems(base, remoteOnly);
};
