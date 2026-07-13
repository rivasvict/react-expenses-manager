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
  return incoming;
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
  const categoriesA = [...(a.categories || [])].sort();
  const categoriesB = [...(b.categories || [])].sort();
  return canonicalStringify(categoriesA) === canonicalStringify(categoriesB);
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
